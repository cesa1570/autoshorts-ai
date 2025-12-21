
// Minimal valid MP3 Base64 (Silent 0.1s) for placeholders
// In a real app, these would be real sound effect files
const MOCK_SFX_BASE64 = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABLmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmn';

export const SFX_LIBRARY = {
    LAUGH: { id: 'laugh', label: 'Funny Laugh', url: MOCK_SFX_BASE64, keywords: ['[laugh]', '[555]', '[haha]'] },
    BOING: { id: 'boing', label: 'Cartoon Boing', url: MOCK_SFX_BASE64, keywords: ['[boing]', '[bounce]'] },
    SCREAM: { id: 'scream', label: 'Scream', url: MOCK_SFX_BASE64, keywords: ['[scream]', '[scary]'] },
    CASH: { id: 'cash', label: 'Ka-ching', url: MOCK_SFX_BASE64, keywords: ['[cash]', '[money]', '[profit]'] }
};

export interface SfxCue {
    id: string;
    timeOffset: number; // 0 to 1 (percentage of scene duration or fixed seconds?)
    // Let's use fixed seconds relative to scene start, or 'start', 'middle', 'end'
    position: 'start' | 'middle' | 'end';
}

/**
 * Analyze text to find SFX triggers
 * Returns list of SFX IDs found
 */
export const detectSfxInText = (text: string): string[] => {
    const found: string[] = [];
    const lower = text.toLowerCase();

    Object.values(SFX_LIBRARY).forEach(sfx => {
        if (sfx.keywords.some(k => lower.includes(k))) {
            found.push(sfx.id);
        }
    });

    return found;
};
