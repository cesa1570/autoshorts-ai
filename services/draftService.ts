
import { Draft } from '../types';

const STORAGE_KEY = 'PROJECT_DRAFTS';

export const DraftService = {
    getAll: (userId?: string | null): Draft[] => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const allDrafts: Draft[] = stored ? JSON.parse(stored) : [];
            if (userId) {
                return allDrafts.filter(d => d.userId === userId || !d.userId); // Allow orphans for migration
            }
            return allDrafts;
        } catch (e) {
            console.error('Failed to parse drafts', e);
            return [];
        }
    },

    save: (draft: Draft) => {
        const drafts = DraftService.getAll();
        const existingIndex = drafts.findIndex(d => d.id === draft.id);

        // 1. Extract Preview Image (Priority: Provided -> First Scene -> Null)
        let previewImageUrl = draft.previewImageUrl;
        if (!previewImageUrl) {
            if (draft.type === 'podcast') {
                const scenes = draft.data.scenes || [];
                if (scenes.length > 0 && scenes[0].imageUrl) previewImageUrl = scenes[0].imageUrl;
            } else {
                const scenes = draft.data.script?.scenes || [];
                const validScene = scenes.find((s: any) => s.imageUrl || s.videoUrl);
                if (validScene) previewImageUrl = validScene.imageUrl || validScene.videoUrl;
            }
        }

        // 2. Create Lightweight Copy for LocalStorage (Strip heavy Base64)
        // We rely on IndexedDB (projectService) to store the full heavy data.
        // LocalStorage is only for the "Recent" list and metadata.
        const lightweightData = { ...draft.data };

        // Strip heavy scenes data to prevent quota overflow
        if (lightweightData.script && lightweightData.script.scenes) {
            lightweightData.script = {
                ...lightweightData.script,
                scenes: lightweightData.script.scenes.map((s: any) => ({
                    id: s.id,
                    // Keep only essential metadata for the list/preview consistency if needed, 
                    // but mostly we want to trust the hydration from IndexedDB.
                    // We keep visual_prompt and status so we can at least show *something* if offline.
                    visual_prompt: s.visual_prompt,
                    voiceover: s.voiceover ? s.voiceover.substring(0, 50) + '...' : '',
                    status: s.status,
                    duration_est: s.duration_est,
                    // REMOVE Base64/Blob Urls
                    imageUrl: undefined,
                    videoUrl: undefined,
                    audioBase64: undefined,
                    audioBuffer: undefined
                }))
            };
        }
        if (lightweightData.scenes) { // Podcast
            lightweightData.scenes = lightweightData.scenes.map((s: any) => ({
                id: s.id,
                visual_prompt: s.visual_prompt,
                status: s.status,
                // REMOVE Base64
                imageUrl: undefined,
                audioBase64: undefined,
                audioBuffer: undefined
            }));
        }

        const lightweightDraft: Draft = {
            ...draft,
            previewImageUrl,
            lastModified: Date.now(),
            data: lightweightData
        };

        if (existingIndex >= 0) {
            drafts[existingIndex] = lightweightDraft;
        } else {
            drafts.unshift({ ...lightweightDraft, createdAt: Date.now() });
        }

        // Limit to 20 drafts for localStorage safety
        const trimmed = drafts.slice(0, 20);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.error("LocalStorage Update Failed (Quota?):", e);
        }
    },

    delete: (id: string) => {
        const drafts = DraftService.getAll().filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    },

    getById: (id: string, userId?: string | null): Draft | undefined => {
        return DraftService.getAll(userId).find(d => d.id === id);
    }
};
