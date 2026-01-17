
import { TEXT_MODELS, VISUAL_MODELS, TTS_MODELS, AIModel, ModelPrice } from '../utils/models';

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Helper to notify usage
const notifyUsage = (modelId: string, type: 'text' | 'image' | 'audio', usage: { prompt_tokens?: number, completion_tokens?: number, characters?: number }) => {
    if (typeof window === 'undefined') return;

    let modelDef: AIModel | undefined;
    if (type === 'text') modelDef = TEXT_MODELS.find(m => m.id === modelId);
    else if (type === 'image') modelDef = VISUAL_MODELS.find(m => m.id === modelId);
    else if (type === 'audio') modelDef = TTS_MODELS.find(m => m.id === modelId);

    if (!modelDef) return; // Unknown model

    let cost = 0;
    const p = modelDef.pricing;

    if (type === 'text' && p.unit === 'token') {
        cost += (usage.prompt_tokens || 0) * (p.input || 0);
        cost += (usage.completion_tokens || 0) * (p.output || 0);
    } else if (type === 'image' && p.unit === 'image') {
        cost = p.perUnit || 0;
    } else if (type === 'audio' && p.unit === 'char') {
        cost = (usage.characters || 0) * (p.input || 0);
    }

    const totalTokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) + (usage.characters || 0); // usage proxy

    window.dispatchEvent(new CustomEvent('gemini-api-usage', {
        detail: {
            tokens: totalTokens,
            model: modelId,
            cost: cost,
            timestamp: Date.now()
        }
    }));
};

let openaiApiKey: string = '';

export const setOpenAIApiKey = (key: string) => {
    openaiApiKey = key;
    if (typeof window !== 'undefined') {
        localStorage.setItem('openai_api_key', key);
    }
};

export const getOpenAIApiKey = () => {
    if (openaiApiKey) return openaiApiKey;
    if (typeof window !== 'undefined') {
        return localStorage.getItem('openai_api_key') || '';
    }
    return '';
};

// Initialize from storage
if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('openai_api_key');
    if (stored) openaiApiKey = stored;
}

const getHeaders = () => {
    if (!openaiApiKey) throw new Error("OpenAI API Key not set. Please add it in Settings.");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
    };
};

export const generateScriptWithOpenAI = async (prompt: string, model: string = 'gpt-4o'): Promise<string> => {
    try {
        const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "You are a creative scriptwriter for viral short videos." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();

        // Notify Usage
        if (data.usage) {
            notifyUsage(model, 'text', {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens
            });
        }

        return data.choices[0].message.content;
    } catch (error: any) {
        console.error("OpenAI Script Gen Failed:", error);
        throw error;
    }
};

export const generateImageWithDalle = async (prompt: string, size: string = '1024x1792'): Promise<string | null> => {
    try {
        const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: size, // DALL-E 3 supports 1024x1024, 1024x1792 (portrait), 1792x1024 (landscape)
                response_format: "b64_json"
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'DALL-E Generation Error');
        }

        const data = await response.json();

        // Notify Usage (1 image)
        notifyUsage('dall-e-3', 'image', {});

        return `data:image/png;base64,${data.data[0].b64_json}`;
    } catch (error: any) {
        console.error("DALL-E Gen Failed:", error);
        throw error;
    }
};

export const generateAudioWithOpenAI = async (text: string, voice: string = 'alloy'): Promise<string | null> => {
    try {
        const response = await fetch(`${OPENAI_API_URL}/audio/speech`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: voice,
            })
        });

        notifyUsage('tts-1', 'audio', { characters: text.length });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'OpenAI TTS Error');
        }

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (error: any) {
        console.error("OpenAI TTS Failed:", error);
        throw error;
    }
};
