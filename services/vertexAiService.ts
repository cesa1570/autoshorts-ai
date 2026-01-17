import { notifyApiUsage } from './geminiService';

export interface VertexConfig {
    projectId: string;
    location: string;
    apiKey?: string;
    serviceAccountKey?: string;
}


export const generateTextWithVertex = async (
    config: VertexConfig,
    modelId: string,
    prompt: string,
    systemInstruction?: string
): Promise<string> => {
    try {
        // Call via bridge to Main Process
        const result = await window.electron.vertex.generateContent({
            config,
            modelId,
            prompt,
            systemInstruction
        });

        if (!result.success) throw new Error(result.error || "Vertex AI Bridge Failure");

        // Track Usage
        if (result.usage) {
            notifyApiUsage(
                result.usage.totalTokenCount || 0,
                modelId,
                {
                    promptTokens: result.usage.promptTokenCount,
                    outputTokens: result.usage.candidatesTokenCount
                }
            );
        }

        return result.text || '';
    } catch (error) {
        console.error("Vertex AI Bridge Error (Text):", error);
        throw error;
    }
};

export const generateImageWithVertex = async (
    config: VertexConfig,
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' = '1:1'
): Promise<string> => {
    const modelId = 'imagen-3.0-generate-vertex';
    try {
        const result = await window.electron.vertex.generateImage({
            config,
            prompt,
            aspectRatio
        });

        if (!result.success) throw new Error(result.error || "Vertex AI Bridge Failure (Image)");

        notifyApiUsage(1, modelId); // Track as 1 image
        return result.data || '';
    } catch (error) {
        console.error("Vertex AI Bridge Error (Image):", error);
        throw error;
    }
};
