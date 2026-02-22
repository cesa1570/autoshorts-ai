
import { ScriptData, GeneratorMode, NewsItem, SocialPostData, PolishStyle, Scene } from "../types";
import { MODEL_PRICING } from "../components/UsageAnalytics";
import { proxyAiRequest, SubscriptionExpiredError, UsageLimitError } from "./proxyService";

export const ERR_INVALID_KEY = "API_KEY_INVALID";

const calculateCost = (modelId: string, tokens: number): number => {
  const model = Object.keys(MODEL_PRICING).find(key =>
    modelId.toLowerCase().includes(key)
  ) || 'unknown';
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || { input: 0, output: 0 };

  const inputTokens = tokens * 0.7;
  const outputTokens = tokens * 0.3;

  return (inputTokens / 1_000_000 * pricing.input) + (outputTokens / 1_000_000 * pricing.output);
};

export const notifyApiUsage = (usageAmount: number = 0, modelId: string = 'unknown', details: any = {}) => {
  const estimatedTokens = details.totalTokens || 1000;
  const cost = calculateCost(modelId, estimatedTokens);

  window.dispatchEvent(new CustomEvent('gemini-api-usage', {
    detail: {
      usageAmount,
      model: modelId,
      tokens: estimatedTokens,
      cost: cost,
      details
    }
  }));
};

// --- Key Management (Minimal Legacy for UI Compatibility) ---
let globalApiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '';

export const setGlobalApiKey = (key: string) => {
  globalApiKey = key;
  if (typeof window !== 'undefined') localStorage.setItem('gemini_api_key', key);
};

export const getKeys = () => globalApiKey ? [globalApiKey] : [];
export const addKey = (key: string) => setGlobalApiKey(key);
export const removeKey = (key: string) => setGlobalApiKey('');
export const setSingleKey = (key: string) => setGlobalApiKey(key);
export const setGlobalTier = (tier: any) => { };

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const detectLanguage = (text: string): 'Thai' | 'English' => {
  return /[ก-๙]/.test(text) ? 'Thai' : 'English';
};

const withRetry = async <T>(operation: () => Promise<T>, retries = 3, initialDelay = 3000, modelId: string = 'unknown'): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation();
      notifyApiUsage(1, modelId);
      return result;
    } catch (error: any) {
      lastError = error;
      if (error instanceof UsageLimitError || error instanceof SubscriptionExpiredError) {
        throw error; // Don't retry these
      }

      const msg = (error.message || "").toLowerCase();
      if (msg.includes('429') || msg.includes('quota') || msg.includes('limit')) {
        await wait(initialDelay * Math.pow(2, i));
        continue;
      }
      if (i < retries - 1) {
        await wait(initialDelay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const STYLE_DIRECTIVES: Record<string, string> = {
  'Cinematic': 'Master-level cinematography, 35mm anamorphic lens, deep chiaroscuro shadows, Rembrandt lighting, volumetric haze, floating dust motes, 8k raw texture detail, shallow depth of field (f/1.8), cinematic color grading (teal and orange hints), epic scale, immersive atmosphere.',
  'Anime': 'Makoto Shinkai style, vibrant cel-shaded, expressive line art, stylized sky with fluffy clouds, saturated colors, hand-drawn aesthetic, high-quality modern anime.',
  'Cyberpunk': 'Neon noir, rainy streets with neon reflections, high contrast, volumetric fog, chromatic aberration, futuristic night city, aggressive teal and orange palette.',
  'Horror': 'Chiaroscuro lighting, heavy film grain, desaturated colors, eerie atmosphere, shadow play, unsettling micro-details, low-key lighting, suspenseful cinematic mood.',
  'Documentary': 'Naturalistic lighting, macro photography, realistic organic textures, neutral color palette, clean framing, high-fidelity details, authentic material realism.',
  'Unreal': 'Rendered in Unreal Engine 5, Nanite geometry, Lumen global illumination, 8K resolution, hyper-realistic 3D graphics, ray tracing, high fidelity, detailed textures, cinematic lighting, photorealistic game asset style.'
};

const augmentPromptWithStyle = (prompt: string, style: string) => {
  const directive = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
  return `${prompt}. Technical Artistic Direction: ${directive}`;
};

export const generateScript = async (
  topic: string,
  mode: GeneratorMode,
  aspectRatio: '9:16' | '16:9',
  languageOverride?: 'Thai' | 'English',
  durationMinutes: number = 1,
  visualModel?: string,
  style: string = 'Cinematic',
  textModel: string = 'gemini-3-flash-preview'
): Promise<ScriptData> => {
  if (mode === GeneratorMode.LONG_VIDEO) {
    return generateLongVideoScript(topic, '16:9', languageOverride, durationMinutes, style, textModel);
  }
  return generateShortsScript(topic, mode, aspectRatio, languageOverride, style, textModel);
};

export const generateShortsScript = async (
  topic: string,
  mode: GeneratorMode,
  aspectRatio: '9:16' | '16:9',
  languageOverride?: 'Thai' | 'English',
  style: string = 'Cinematic',
  textModel: string = 'gemini-3-flash-preview'
): Promise<ScriptData> => {
  return withRetry(async () => {
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const detectedLang = detectLanguage(topic);
    const targetLang = (detectedLang === 'English') ? 'English' : (languageOverride || 'Thai');

    const systemInstruction = `You are a Professional Viral Content Creator.mirror language ${targetLang}. Visual prompt in English. Style: ${style}. DNA: ${styleDirectives}. One scene per sentence. Mix 8-12 scenes.`;

    const response = await proxyAiRequest('generate_script', {
      model: textModel,
      prompt: `Generate a script in ${targetLang} about: "${topic}"`,
      systemInstruction,
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          seoTitle: { type: "string" },
          description: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                visual_prompt: { type: "string" },
                voiceover: { type: "string" },
                duration_est: { type: "number" }
              },
              required: ["id", "visual_prompt", "voiceover", "duration_est"]
            }
          }
        },
        required: ["title", "seoTitle", "scenes"]
      }
    });

    const data = JSON.parse(response.text);
    return { ...data, scenes: (data.scenes || []).map((s: any) => ({ ...s, status: 'pending' })) };
  }, 3, 3000, textModel);
};

export const generateLongVideoScript = async (
  topic: string,
  aspectRatio: '16:9',
  languageOverride?: 'Thai' | 'English',
  durationMinutes: number = 10,
  style: string = 'Cinematic',
  textModel: string = 'gemini-3-flash-preview'
): Promise<ScriptData> => {
  return withRetry(async () => {
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const targetWordCount = durationMinutes * 140;
    const detectedLang = detectLanguage(topic);
    const targetLang = (detectedLang === 'English') ? 'English' : (languageOverride || 'Thai');

    const systemInstruction = `World-Class Documentary Filmmaker. ${targetLang}. Visuals English. Style: ${style}. DNA: ${styleDirectives}. LONG voiceovers (50-100 words).`;

    const response = await proxyAiRequest('generate_script', {
      model: textModel,
      prompt: `Generate a documentary script about: "${topic}". Duration: ${durationMinutes} mins. Word count: ${targetWordCount}.`,
      systemInstruction,
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          seoTitle: { type: "string" },
          longDescription: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                visual_prompt: { type: "string" },
                voiceover: { type: "string" },
                duration_est: { type: "number" }
              },
              required: ["id", "visual_prompt", "voiceover", "duration_est"]
            }
          }
        },
        required: ["title", "seoTitle", "scenes"]
      }
    });

    const data = JSON.parse(response.text);
    return { ...data, scenes: (data.scenes || []).map((s: any) => ({ ...s, status: 'pending' })) };
  }, 3, 3000, textModel);
};

export const refineVisualPrompt = async (topic: string, style: string, voiceover: string): Promise<string> => {
  return withRetry(async () => {
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const response = await proxyAiRequest('generate_script', {
      model: 'gemini-2.0-flash-exp',
      prompt: `Refine visual prompt. Context: ${voiceover}. Topic: ${topic}. DNA: ${styleDirectives}. Output one dense paragraph in English.`,
    });
    return response.textComponent || response.text || "";
  });
};

export const generateStoryboards = async (topic: string, style: string, scenes: { id: number, voiceover: string }[]): Promise<Record<number, string>> => {
  return withRetry(async () => {
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const response = await proxyAiRequest('generate_script', {
      model: 'gemini-3-flash-preview',
      prompt: `Generate storyboards. Topic: ${topic}. DNA: ${styleDirectives}. Scenes: ${JSON.stringify(scenes)}. Return JSON: {"storyboards": [{"id": number, "prompt": string}]}`,
      responseSchema: {
        type: "object",
        properties: {
          storyboards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                prompt: { type: "string" }
              }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text);
    const result: Record<number, string> = {};
    (data.storyboards || []).forEach((item: any) => {
      result[item.id] = item.prompt;
    });
    return result;
  });
};

export const regenerateScene = async (topic: string, style: string, context?: string, language: string = 'Thai'): Promise<{ voiceover: string, visual_prompt: string }> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_script', {
      model: 'gemini-3-flash-preview',
      prompt: `Alternative scene. Topic: ${topic}. Context: ${context}. Style: ${style}. Language: ${language}.`,
      responseSchema: {
        type: "object",
        properties: {
          voiceover: { type: "string" },
          visual_prompt: { type: "string" }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateLiveImageForScene = async (prompt: string, aspectRatio: string = '9:16', style: string = 'Cinematic'): Promise<string> => {
  return generateVideoForScene(prompt, aspectRatio as any, 'veo-2.0-generate-001', style);
};

export const generatePodcastScript = async (topic: string, language: string = 'Auto'): Promise<any> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_script', {
      model: 'gemini-3-flash-preview',
      prompt: `Podcast script about "${topic}" in ${language}. JSON: {title: string, dialogue: [{speaker: 1|2, text: string}]}.`,
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          dialogue: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "integer" },
                text: { type: "string" }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }, 3, 3000, 'gemini-3-flash-preview');
};

export interface PodcastScriptOptions {
  style: string;
  host1Name: string;
  host2Name: string;
  language: string;
  modelId?: string;
  duration?: string;
}

export const generatePodcastScriptAdvanced = async (topic: string, options: PodcastScriptOptions): Promise<any> => {
  const { style, host1Name, host2Name, language, modelId, duration } = options;
  const model = modelId || 'gemini-3-flash-preview';

  return withRetry(async () => {
    const response = await proxyAiRequest('generate_script', {
      model,
      prompt: `Podcast writer. Topic: ${topic}. Host1: ${host1Name}. Host2: ${host2Name}. Style: ${style}. Lang: ${language}. Duration: ${duration}.`,
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          dialogue: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "integer" },
                text: { type: "string" },
                emotion: { type: "string" },
                hostName: { type: "string" }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }, 3, 3000, model);
};

export const generateVoiceover = async (text: string, voiceName: string): Promise<string> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_voiceover', { text, voiceName });
    return response.audioBase64 || "";
  });
};

export const generateVideoForScene = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  model: string = 'veo-3.1-fast-generate-preview',
  style: string = 'Cinematic',
  onProgress?: (pollingCount: number) => void
): Promise<string> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_video', { prompt, model, aspectRatio, style });
    return response.videoUrl;
  });
};

export const generateImageForScene = async (prompt: string, model: string = 'gemini-2.5-flash-image', aspectRatio: string = '9:16', style: string = 'Cinematic'): Promise<string> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_image', { prompt, model, aspectRatio, style });
    return `data:${response.mimeType || 'image/png'};base64,${response.imageBase64}`;
  });
};

export const generateThumbnail = async (title: string, topic: string, style: string = 'Cinematic'): Promise<string> => {
  return generateImageForScene(`Viral high-impact YouTube thumbnail. Topic: ${topic}.`, 'gemini-2.5-flash-image', '16:9', style);
};

export const generateSeoMetadata = async (topic: string, title: string, description: string): Promise<{ hashtags: string[], seoKeywords: string }> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_script', {
      model: 'gemini-3-flash-preview',
      prompt: `YouTube SEO Expert. Viral metadata for: "${topic}". Title: "${title}".`,
      responseSchema: {
        type: "object",
        properties: {
          hashtags: { type: "array", items: { type: "string" } },
          seoKeywords: { type: "string" }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generatePodcastAudio = async (text: string, voiceA: string, voiceB: string): Promise<string> => {
  return withRetry(async () => {
    const response = await proxyAiRequest('generate_voiceover', { text, voiceA, voiceB, multiSpeaker: true });
    return response.audioBase64 || "";
  });
};
