export interface AudioTrack {
    id: string;
    title: string;
    genre: string;
    url: string;
    duration?: number;
}

export const STOCK_BGM: AudioTrack[] = [
    {
        id: 'bgm-pop',
        title: 'Upbeat Pop Energy',
        genre: 'Pop / Vlog',
        url: 'https://cdn.pixabay.com/audio/2025/10/24/audio_404fbe9e71.mp3',
        duration: 120
    },
    {
        id: 'bgm-cinematic',
        title: 'Epic Cinematic Dramatic',
        genre: 'Cinematic',
        url: 'https://cdn.pixabay.com/audio/2021/11/23/audio_035a943c87.mp3',
        duration: 145
    },
    {
        id: 'bgm-lofi',
        title: 'Cozy Lofi Chill',
        genre: 'Lofi / Ambience',
        url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e0908e8569.mp3',
        duration: 180
    },
    {
        id: 'bgm-none',
        title: 'No Background Music',
        genre: 'Silent',
        url: '',
        duration: 0
    }
];

export const getAudioTracks = async (): Promise<AudioTrack[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return STOCK_BGM;
};
