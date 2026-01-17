export { };

declare global {
    interface Window {
        electron: {
            window: {
                minimize: () => void;
                maximize: () => void;
                close: () => void;
            };
            fileSystem: {
                saveProject: (filename: string, content: any) => Promise<{ success?: boolean; path?: string; canceled?: boolean }>;
            };
            video: {
                renderVideo: (config: any) => Promise<{ success: boolean; path?: string; error?: string }>;
                saveVideo: (data: any, filename: string) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>;
                onProgress: (callback: (progress: number) => void) => void;
                removeProgressListeners: () => void;
            };
            auth: {
                startAuthFlow: (url: string) => Promise<{ success: boolean; code?: string; error?: string }>;
                exchangeToken: (req: any) => Promise<any>;
            };
            vertex: {
                generateContent: (args: { config: any, modelId: string, prompt: string, systemInstruction?: string }) => Promise<{ success: boolean, text?: string, usage?: any, error?: string }>;
                generateImage: (args: { config: any, prompt: string, aspectRatio?: string }) => Promise<{ success: boolean, data?: string, error?: string }>;
            };
            exchangeToken: (req: any) => Promise<any>;
        };
    }
}
