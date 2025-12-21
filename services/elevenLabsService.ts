
export const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default Voices
export const ELEVENLABS_VOICES = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (American, Calm)' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (American, Strong)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (American, Soft)' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (American, Well-rounded)' },
    { id: 'MF3mGyEYCl7XYWlgZ9nu', name: 'MacKenzie (Narrative)' },
];

export const generateElevenLabsAudio = async (text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> => {
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to generate audio via ElevenLabs');
    }

    return response.arrayBuffer();
};
