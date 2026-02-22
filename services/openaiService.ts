
import { TEXT_MODELS, VISUAL_MODELS, TTS_MODELS, AIModel, ModelPrice } from '../utils/models';
import { proxyAiRequest, UsageLimitError, SubscriptionExpiredError } from './proxyService';

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Helper to notify usage
const notifyUsage = (modelId: string, type: 'text' | 'image' | 'audio', usage: { prompt_tokens?: number, completion_tokens?: number, characters?: number }) => {
    if (typeof window === 'undefined') return;

    let modelDef: AIModel | undefined;
    if (type === 'text') modelDef = TEXT_MODELS.find(m => m.id === modelId);
    else if (type === 'image') modelDef = VISUAL_MODELS.find(m => m.id === modelId);
    else if (type === 'audio') modelDef = TTS_MODELS.find(m => m.id === modelId);

    if (!modelDef) return;

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

    const totalTokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) + (usage.characters || 0);

    window.dispatchEvent(new CustomEvent('gemini-api-usage', {
        detail: {
            tokens: totalTokens,
            model: modelId,
            cost: cost,
            timestamp: Date.now()
        }
    }));
};

let openaiApiKey: string = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') || '' : '';

export const setOpenAIApiKey = (key: string) => {
    openaiApiKey = key;
    if (typeof window !== 'undefined') {
        localStorage.setItem('openai_api_key', key);
    }
};

export const getOpenAIApiKey = () => openaiApiKey;

export const generateScriptWithOpenAI = async (prompt: string, model: string = 'gpt-4o'): Promise<string> => {
    try {
        const data = await proxyAiRequest('generate_script', {
            model,
            prompt,
            provider: 'openai'
        });

        notifyUsage(model, 'text', {
            prompt_tokens: 500, // Estimate if proxy doesn't return
            completion_tokens: 500
        });

        return data.text || data;
    } catch (error: any) {
        console.error("OpenAI Script Proxy Failed:", error);
        throw error;
    }
};

export const generateImageWithDalle = async (prompt: string, size: string = '1024x1792'): Promise<string | null> => {
    try {
        const data = await proxyAiRequest('generate_image', {
            model: "dall-e-3",
            prompt: prompt,
            size: size,
            provider: "openai"
        });

        notifyUsage('dall-e-3', 'image', {});

        return data.imageUrl;
    } catch (error: any) {
        console.error("DALL-E Proxy Failed:", error);
        throw error;
    }
};

export const generateAudioWithOpenAI = async (text: string, voice: string = 'alloy'): Promise<string | null> => {
    try {
        const data = await proxyAiRequest('generate_voiceover', {
            text,
            voice,
            provider: "openai"
        });

        notifyUsage('tts-1', 'audio', { characters: text.length });

        return `data:audio/mpeg;base64,${data.audioBase64}`;
    } catch (error: any) {
        console.error("OpenAI TTS Proxy Failed:", error);
        throw error;
    }
};

export const generateVideoWithSora = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16' = '16:9',
    model: string = 'sora-2',
    style: string = 'Cinematic',
    onProgress?: (pollCount: number) => void
): Promise<string> => {
    try {
        // High-level Sora call to proxy: proxy handles polling!
        const data = await proxyAiRequest('generate_video', {
            prompt,
            model,
            aspectRatio,
            style,
            provider: 'openai'
        });

        notifyUsage(model, 'image', {}); // Per-unit tracking

        return `data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`;
    } catch (error: any) {
        console.error("Sora Proxy Failed:", error);
        throw error;
    }
};
