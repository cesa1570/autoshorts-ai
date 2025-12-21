import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Simple in-memory rate limiting (resets on cold start)
const ipRequests: Map<string, { count: number; timestamp: number }> = new Map();
const RATE_LIMIT = 20; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = ipRequests.get(ip);

    if (!record || now - record.timestamp > RATE_WINDOW) {
        ipRequests.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check API key
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server API key not configured' });
    }

    // Rate limiting
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: RATE_WINDOW / 1000
        });
    }

    try {
        const { prompt, mode, language, aspectRatio, economyMode } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const model = 'gemini-2.0-flash';
        const systemPrompt = buildSystemPrompt(mode, language, aspectRatio, economyMode);

        const response = await fetch(
            `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.8
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(response.status).json({ error: 'AI generation failed' });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({ error: 'No content generated' });
        }

        // Parse and return JSON
        const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
        const scriptData = JSON.parse(cleanedText);

        return res.status(200).json(scriptData);

    } catch (error: any) {
        console.error('Generate Script Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

function buildSystemPrompt(mode: string, language: string, aspectRatio: string, economyMode: boolean): string {
    const sceneCount = economyMode ? 3 : 5;
    const isPodcast = mode === 'AI Podcast/Dialogue';
    const isGhost = mode === 'Thai Horror/Ghost Stories';

    return `You are a professional viral content creator for YouTube Shorts and TikTok.
Generate a complete short video script in JSON format.

REQUIRED OUTPUT FORMAT:
{
  "title": "Catchy title in ${language}",
  "seoTitle": "SEO optimized title",
  "description": "Short description",
  "longDescription": "Detailed description for YouTube",
  "hashtags": ["tag1", "tag2", ...],
  "seoKeywords": "comma, separated, keywords",
  "scenes": [
    {
      "id": 1,
      "visual_prompt": "Detailed English description for image generation",
      "voiceover": "Narration text in ${language}",
      "duration_est": 5
    }
  ]
}

RULES:
- Generate exactly ${sceneCount} scenes
- Each scene should be 4-6 seconds
- Voiceover MUST be in ${language}
- Visual prompts MUST be in English (for AI image generation)
${isPodcast ? '- PODCAST MODE: Create dialogue between "Speaker 1:" and "Speaker 2:"' : ''}
${isGhost ? '- THAI GHOST MODE: Use atmospheric horror elements, Thai folklore (Phee, Wat, Karma)' : ''}
- Aspect ratio: ${aspectRatio}`;
}
