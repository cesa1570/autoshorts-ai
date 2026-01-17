// Pricing Interfaces
export interface ModelPrice {
    input?: number; // Cost per token/character
    output?: number; // Cost per token
    perUnit?: number; // Cost per generation (image/video)
    unit: 'token' | 'char' | 'image' | 'video' | 'second';
}

export interface AIModel {
    id: string;
    name: string;
    provider: 'google' | 'openai' | 'vertex';
    type?: 'text' | 'image' | 'video' | 'live' | 'audio' | 'animated';
    pricing: ModelPrice;
}

// Text Generation Models
export const TEXT_MODELS: AIModel[] = [
    {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Stable)',
        provider: 'google',
        pricing: { unit: 'token', input: 0, output: 0 } // Free - Works with standard API keys
    },
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash (Preview)',
        provider: 'google',
        pricing: { unit: 'token', input: 0, output: 0 }
    },
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro (Preview)',
        provider: 'google',
        pricing: { unit: 'token', input: 0, output: 0 }
    },
    {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash Thinking (Research)',
        provider: 'google',
        pricing: { unit: 'token', input: 0, output: 0 }
    }
];

// Image Generation Models
export const VISUAL_MODELS: AIModel[] = [
    {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        type: 'image',
        provider: 'google',
        pricing: { unit: 'image', perUnit: 0 }
    },
    {
        id: 'imagen-3.0-generate-001',
        name: 'Imagen 3 (High Quality)',
        type: 'image',
        provider: 'google',
        pricing: { unit: 'image', perUnit: 0.04 }
    },
    {
        id: 'dall-e-3',
        name: 'DALL-E 3 (OpenAI)',
        type: 'image',
        provider: 'openai',
        pricing: { unit: 'image', perUnit: 0.04 }
    }
];

// Video Generation Models
export const VIDEO_MODELS: AIModel[] = [
    {
        id: 'veo-3.1-fast-generate-preview',
        name: 'Veo 3.1 Fast (Preview)',
        type: 'video',
        provider: 'google',
        pricing: { unit: 'video', perUnit: 0 }
    },
    {
        id: 'veo-2.0-generate-001',
        name: 'Veo 2 (Stable)',
        type: 'video',
        provider: 'google',
        pricing: { unit: 'video', perUnit: 0 }
    },
];

export const TTS_MODELS: AIModel[] = [
    {
        id: 'gemini-2.5-flash-preview-tts',
        name: 'Gemini 2.5 Flash TTS',
        provider: 'google',
        pricing: { unit: 'char', input: 0 }
    },
    {
        id: 'tts-1',
        name: 'OpenAI TTS-1',
        provider: 'openai',
        pricing: { unit: 'char', input: 0.000015 }
    }
];
