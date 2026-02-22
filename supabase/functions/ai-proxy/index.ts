import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tier limits (monthly requests)
const TIER_LIMITS: Record<string, { requests: number, videoGenerations: number }> = {
    'free': { requests: 5, videoGenerations: 0 },
    'enterprise': { requests: 500, videoGenerations: 20 },  // Early Bird
    'pro': { requests: 99999, videoGenerations: 100 },       // Standard Pro
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 2. Get user profile & check tier
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('license_tier, license_expires_at, monthly_requests, monthly_reset_at')
            .eq('id', user.id)
            .single()

        const tier = profile?.license_tier || 'free'
        const limits = TIER_LIMITS[tier] || TIER_LIMITS['free']

        // Check if subscription is expired (for paid tiers)
        if (tier !== 'free' && profile?.license_expires_at) {
            const expiresAt = new Date(profile.license_expires_at)
            if (expiresAt < new Date()) {
                return new Response(JSON.stringify({
                    error: 'Subscription expired',
                    code: 'SUBSCRIPTION_EXPIRED'
                }), {
                    status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        // Reset monthly counter if needed
        let monthlyRequests = profile?.monthly_requests || 0
        const resetAt = profile?.monthly_reset_at ? new Date(profile.monthly_reset_at) : new Date(0)
        const now = new Date()
        if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
            monthlyRequests = 0
            await supabaseAdmin.from('profiles').update({
                monthly_requests: 0,
                monthly_reset_at: now.toISOString()
            }).eq('id', user.id)
        }

        // Check usage limits
        if (monthlyRequests >= limits.requests) {
            return new Response(JSON.stringify({
                error: 'Monthly usage limit reached',
                code: 'USAGE_LIMIT',
                limit: limits.requests,
                used: monthlyRequests,
                tier
            }), {
                status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Parse request
        const body = await req.json()
        const { action, ...payload } = body

        if (!action) {
            return new Response(JSON.stringify({ error: 'Missing action' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Route to appropriate AI provider
        let result: any
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        const openaiKey = Deno.env.get('OPENAI_API_KEY')

        switch (action) {
            case 'generate_script':
                result = await handleGeminiText(geminiKey!, payload)
                break
            case 'generate_image':
                if (payload.provider === 'openai') {
                    result = await handleDalleImage(openaiKey!, payload)
                } else {
                    result = await handleGeminiImage(geminiKey!, payload)
                }
                break
            case 'generate_video':
                if (payload.model?.startsWith('sora')) {
                    // Check video generation limit
                    result = await handleSoraVideo(openaiKey!, payload)
                } else {
                    result = await handleGeminiVideo(geminiKey!, payload)
                }
                break
            case 'generate_voiceover':
                if (payload.provider === 'openai') {
                    result = await handleOpenAiTts(openaiKey!, payload)
                } else {
                    result = await handleGeminiTts(geminiKey!, payload)
                }
                break
            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
        }

        // 5. Track usage
        await supabaseAdmin.from('profiles').update({
            monthly_requests: monthlyRequests + 1
        }).eq('id', user.id)

        await supabaseAdmin.from('api_usage').insert({
            user_id: user.id,
            action,
            model: payload.model || 'unknown',
            tokens_used: result._tokens || 0,
            cost_usd: result._cost || 0,
        })

        // Remove internal tracking fields before returning
        delete result._tokens
        delete result._cost

        return new Response(JSON.stringify(result), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('[ai-proxy] Error:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

// ============================================================
// Handler Functions
// ============================================================

async function handleGeminiText(apiKey: string, payload: any) {
    const { model = 'gemini-3-flash-preview', prompt, systemInstruction, responseSchema } = payload

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const body: any = {
        contents: [{ parts: [{ text: prompt }] }],
    }
    if (systemInstruction) {
        body.system_instruction = { parts: [{ text: systemInstruction }] }
    }
    if (responseSchema) {
        body.generationConfig = {
            responseMimeType: 'application/json',
            responseSchema,
        }
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini API Error (${res.status}): ${err}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const tokens = data.usageMetadata?.totalTokenCount || 0

    return { text, _tokens: tokens, _cost: 0 }
}

async function handleGeminiImage(apiKey: string, payload: any) {
    const { prompt, model = 'gemini-2.5-flash-image', aspectRatio = '9:16' } = payload

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { imageConfig: { aspectRatio } },
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini Image Error: ${err}`)
    }

    const data = await res.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
        if (part.inlineData) {
            return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png', _tokens: 0, _cost: 0 }
        }
    }
    throw new Error('No image generated')
}

async function handleDalleImage(apiKey: string, payload: any) {
    const { prompt, model = 'dall-e-3', size = '1024x1792' } = payload

    const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, n: 1, size, quality: 'hd' }),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'DALL-E Error')
    }

    const data = await res.json()
    return { imageUrl: data.data?.[0]?.url, _tokens: 0, _cost: 0.08 }
}

async function handleGeminiVideo(apiKey: string, payload: any) {
    const { prompt, model = 'veo-3.1-fast-generate-preview', aspectRatio = '16:9' } = payload

    // Start generation
    const startUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos?key=${apiKey}`
    const startRes = await fetch(startUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
        }),
    })

    if (!startRes.ok) {
        const err = await startRes.text()
        throw new Error(`Veo Error: ${err}`)
    }

    let op = await startRes.json()

    // Poll for completion (max 5 minutes)
    const maxPolls = 40
    let polls = 0
    while (!op.done && polls < maxPolls) {
        polls++
        await new Promise(r => setTimeout(r, 8000))
        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${op.name}?key=${apiKey}`
        const pollRes = await fetch(pollUrl)
        op = await pollRes.json()
    }

    if (!op.done) throw new Error('Video generation timed out')

    const videoUri = op.response?.generatedVideos?.[0]?.video?.uri
    return { videoUrl: `${videoUri}&key=${apiKey}`, _tokens: 0, _cost: 0 }
}

async function handleSoraVideo(apiKey: string, payload: any) {
    const { prompt, model = 'sora-2', size = '1280x720' } = payload
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

    // Create job
    const createRes = await fetch('https://api.openai.com/v1/videos/generations', {
        method: 'POST', headers,
        body: JSON.stringify({ model, prompt, size, n: 1 }),
    })

    if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error?.message || 'Sora Error')
    }

    const job = await createRes.json()
    const jobId = job.id

    // Poll
    let status = job.status || 'in_progress'
    const maxPolls = 60
    let polls = 0
    while (status !== 'completed' && status !== 'failed' && polls < maxPolls) {
        polls++
        await new Promise(r => setTimeout(r, 5000))
        const pollRes = await fetch(`https://api.openai.com/v1/videos/generations/${jobId}`, {
            method: 'GET', headers,
        })
        const pollData = await pollRes.json()
        status = pollData.status
        if (status === 'failed') throw new Error(pollData.error?.message || 'Sora failed')
    }

    if (status !== 'completed') throw new Error('Sora timed out')

    // Download content and return as base64
    const contentRes = await fetch(`https://api.openai.com/v1/videos/generations/${jobId}/content`, {
        method: 'GET', headers,
    })
    if (!contentRes.ok) throw new Error('Failed to download Sora video')

    const videoBuffer = await contentRes.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(videoBuffer)))

    return { videoBase64: base64, mimeType: 'video/mp4', _tokens: 0, _cost: 0.40 }
}

async function handleGeminiTts(apiKey: string, payload: any) {
    const { text, voiceName = 'Kore' } = payload

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini TTS Error: ${err}`)
    }

    const data = await res.json()
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || ''

    return { audioBase64: audioData, _tokens: 0, _cost: 0 }
}

async function handleOpenAiTts(apiKey: string, payload: any) {
    const { text, voice = 'alloy' } = payload

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', input: text, voice }),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'OpenAI TTS Error')
    }

    const audioBuffer = await res.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    return { audioBase64: base64, _tokens: 0, _cost: 0 }
}
