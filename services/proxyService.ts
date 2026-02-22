/**
 * Proxy Service — All AI calls go through this service to the ai-proxy Edge Function.
 * This replaces direct API calls to Gemini/OpenAI from the frontend.
 */

import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class UsageLimitError extends Error {
    limit: number;
    used: number;
    tier: string;
    constructor(message: string, limit: number, used: number, tier: string) {
        super(message);
        this.name = 'UsageLimitError';
        this.limit = limit;
        this.used = used;
        this.tier = tier;
    }
}

export class SubscriptionExpiredError extends Error {
    constructor() {
        super('Your subscription has expired. Please renew to continue.');
        this.name = 'SubscriptionExpiredError';
    }
}

export const proxyAiRequest = async (action: string, payload: any): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('You must be logged in to use AI features. Please sign in.');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 429 && err.code === 'USAGE_LIMIT') {
            throw new UsageLimitError(err.error, err.limit, err.used, err.tier);
        }
        if (response.status === 403 && err.code === 'SUBSCRIPTION_EXPIRED') {
            throw new SubscriptionExpiredError();
        }
        throw new Error(err.error || `Proxy error (${response.status})`);
    }

    return response.json();
};

// Convenience wrappers

export const proxyGenerateScript = async (
    prompt: string,
    model: string,
    systemInstruction: string,
    responseSchema?: any
) => {
    return proxyAiRequest('generate_script', { prompt, model, systemInstruction, responseSchema });
};

export const proxyGenerateImage = async (
    prompt: string,
    model: string = 'gemini-2.5-flash-image',
    aspectRatio: string = '9:16',
    provider: 'google' | 'openai' = 'google'
) => {
    return proxyAiRequest('generate_image', { prompt, model, aspectRatio, provider });
};

export const proxyGenerateVideo = async (
    prompt: string,
    model: string = 'veo-3.1-fast-generate-preview',
    aspectRatio: string = '16:9',
    size?: string
) => {
    return proxyAiRequest('generate_video', { prompt, model, aspectRatio, size });
};

export const proxyGenerateVoiceover = async (
    text: string,
    voiceName: string = 'Kore',
    provider: 'google' | 'openai' = 'google'
) => {
    return proxyAiRequest('generate_voiceover', { text, voiceName, provider });
};
