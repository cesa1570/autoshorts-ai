import { generateScriptWithOpenAI, generateAudioWithOpenAI, generateImageWithDalle } from './openaiService';
import { generateShortsScript, generateLongVideoScript, generateVoiceover, refineVisualPrompt, regenerateScene } from './geminiService';
// import { generateTextWithVertex, generateImageWithVertex, VertexConfig } from './vertexAiService';
// Stub types to prevent build break until full refactor
type VertexConfig = any;
import { TEXT_MODELS, VISUAL_MODELS, AIModel } from '../utils/models';

export type AIProvider = 'google' | 'openai' | 'vertex';

export interface UnifiedConfig {
    openaiKey?: string;
    geminiKey?: string;
    vertex?: VertexConfig;
}

const findModel = (modelId: string): AIModel | undefined => {
    return [...TEXT_MODELS, ...VISUAL_MODELS].find(m => m.id === modelId);
};

export const unifiedGenerateScript = async (
    topic: string,
    modelId: string,
    config: UnifiedConfig,
    options: any // mode, language, duration, aspectRatio, selectedStyle
) => {
    const model = findModel(modelId);
    const provider = model?.provider || 'google';

    if (provider === 'openai') {
        const prompt = `Create a viral video script about "${topic}". Style: ${options.mode}. Language: ${options.language}. 
        Format as JSON with title, scenes array (voiceover, visual_prompt).`;
        const raw = await generateScriptWithOpenAI(prompt, modelId);
        return JSON.parse(raw.replace(/```json|```/g, ''));
    }

    /* 
    if (provider === 'vertex' && config.vertex) {
        const prompt = `Create a viral video script about "${topic}". Style: ${options.mode}. Language: ${options.language}. 
        Format strictly as JSON with "title" string and "scenes" array containing objects with "voiceover" and "visual_prompt" strings.`;
        // const raw = await generateTextWithVertex(config.vertex, modelId, prompt);
        // return JSON.parse(raw.replace(/```json|```/g, ''));
        throw new Error("Vertex AI is currently disabled.");
    }
    */

    // Default to Gemini (Google AI Studio)
    // Route to Long Video Script if duration is specified (Long Video Creator)
    if (options.duration && options.duration >= 5) {
        console.log('[unifiedAiService] Using generateLongVideoScript for duration:', options.duration, 'minutes');
        return await generateLongVideoScript(topic, '16:9', options.language, options.duration, options.selectedStyle || options.mode, modelId);
    }

    // Otherwise use Shorts Script (quick viral content)
    console.log('[unifiedAiService] Using generateShortsScript');
    return await generateShortsScript(topic, options.mode, options.aspectRatio, options.language, options.selectedStyle, modelId);
};

export const unifiedGenerateImage = async (
    prompt: string,
    modelId: string,
    config: UnifiedConfig,
    aspectRatio: any = '1:1'
) => {
    const model = findModel(modelId);
    const provider = model?.provider || 'google';

    if (provider === 'openai') {
        return await generateImageWithDalle(prompt);
    }

    /*
    if (provider === 'vertex' && config.vertex) {
        // return await generateImageWithVertex(config.vertex, prompt, aspectRatio);
        return null;
    }
    */

    // Default to Gemini (standard behavior in geminiService relies on Replicate or internal logic)
    // For now we assume the caller in the UI handles standard Google images via geminiService or replicate directly
    // but we can add routing here if needed.
    return null;
};
