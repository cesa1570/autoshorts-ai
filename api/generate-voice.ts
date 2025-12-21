import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Rate limiting
const ipRequests: Map<string, { count: number; timestamp: number }> = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = ipRequests.get(ip);
    if (!record || now - record.timestamp > RATE_WINDOW) {
        ipRequests.set(ip, { count: 1, timestamp: now });
        return true;
    }
    if (record.count >= RATE_LIMIT) return false;
    record.count++;
    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server API key not configured' });

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    try {
        const { text, voice = 'en-US-Journey-D' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const model = 'gemini-2.0-flash';

        // Use Gemini's TTS capability
        const response = await fetch(
            `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text }] }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: voice }
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini Voice Error:', errorData);
            return res.status(response.status).json({ error: 'Voice generation failed' });
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData) {
                return res.status(200).json({
                    audioData: part.inlineData.data,
                    mimeType: part.inlineData.mimeType
                });
            }
        }

        return res.status(500).json({ error: 'No audio generated' });

    } catch (error: any) {
        console.error('Generate Voice Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
