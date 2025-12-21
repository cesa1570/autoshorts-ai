
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptData, GeneratorMode, NewsItem, SocialPostData } from "../types";
import { getCachedNews, setCachedNews } from "./cacheService";

export const ERR_INVALID_KEY = "API_KEY_INVALID";

// Check if we're in production (deployed to Vercel)
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Backend proxy base URL
const getProxyBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

// Custom API key storage key
const CUSTOM_API_KEY = 'autoshorts_custom_api_key';

/**
 * Get custom API key from localStorage
 */
export const getCustomApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CUSTOM_API_KEY);
  }
  return null;
};

/**
 * Set custom API key to localStorage
 */
export const setCustomApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_API_KEY, apiKey);
  }
};

/**
 * Clear custom API key
 */
export const clearCustomApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CUSTOM_API_KEY);
  }
};

const getClient = () => {
  // Priority: 1. Custom key from localStorage, 2. Environment key
  const customKey = getCustomApiKey();
  const apiKey = customKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key not found. Please set your API key in settings.");
  }
  // CRITICAL: Always create a new instance to pick up the latest injected key
  return new GoogleGenAI({ apiKey });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const msg = (error.message || JSON.stringify(error)).toLowerCase();

      // If the project or key is invalid/not found, do not retry and signal the app to re-prompt
      if (msg.includes('requested entity was not found')) {
        const keyErr = new Error("The selected project or API key is invalid for this model. Pro and Veo models require a paid billing project.");
        (keyErr as any).code = ERR_INVALID_KEY;
        throw keyErr;
      }

      const isQuotaExhausted = msg.includes('429') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('resource_exhausted');
      if (isQuotaExhausted) {
        if (msg.includes('daily limit')) {
          throw new Error("API_QUOTA_EXHAUSTED: Daily limit reached on Free Tier.");
        }
        if (i < retries - 1) {
          await wait(30000); // Wait 30s for quota reset (optimized)
          continue;
        }
      }

      if (i < retries - 1) {
        await wait(initialDelay * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const generateScript = async (
  topic: string,
  mode: GeneratorMode,
  aspectRatio: '9:16' | '16:9',
  language: 'Thai' | 'English' = 'Thai',
  durationMinutes: number = 1,
  visualModel?: string,
  introText?: string,
  outroText?: string,
  economyMode: boolean = false
): Promise<ScriptData> => {
  // === PRODUCTION MODE: Use Backend Proxy ===
  if (isProduction && !getCustomApiKey()) {
    const response = await fetch(`${getProxyBaseUrl()}/api/generate-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: topic,
        mode,
        language,
        aspectRatio,
        economyMode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Script generation failed');
    }

    return await response.json() as ScriptData;
  }

  // === LOCAL DEV / BYOK MODE: Direct SDK ===
  return withRetry(async () => {
    const ai = getClient();
    const isPodcast = mode === GeneratorMode.PODCAST;
    const isLongVideo = mode === GeneratorMode.LONG_VIDEO;
    const isPhysics = mode === GeneratorMode.PHYSICS;
    const isCretaceous = mode === GeneratorMode.CRETACEOUS;
    const isGhost = mode === GeneratorMode.GHOST;
    const isVideoModel = visualModel?.startsWith('veo');

    // Adjusted scene count for "Reduced scenes, increased content"
    // Economy Mode: 3 scenes/min, Normal: 6 scenes/min
    const scenesPerMinute = economyMode ? 3 : 6;
    const targetSceneCount = isLongVideo ? Math.max(3, durationMinutes * 3) : Math.max(3, durationMinutes * scenesPerMinute);

    const systemInstruction = `You are a world-class viral content strategist and cinematic director. 
    TARGET LANGUAGE: ${language}. 
    Output JSON.
    
    ${isLongVideo ? `LONG VIDEO MODE: Create a structured narrative for a ${durationMinutes} minute cinematic video. 
    You MUST generate exactly ${targetSceneCount} scenes. 
    STRATEGY: Reduce scene frequency to allow for DEEPER content. Each scene must have a LONG, DETAILED voiceover (approx 15-25 seconds of speech per scene). 
    Focus on deep storytelling, high-quality educational insights, and cinematic pacing.` : ""}
    ${isPhysics ? "PHYSICS MODE: Focus on scientific curiosity and education. Use engaging scientific metaphors." : ""}
    ${isCretaceous ? "CRETACEOUS MODE: Focus on prehistoric wonder, terrifying dinosaurs, and extinct ecosystems. Use descriptive, awe-inspiring language about the ancient world." : ""}
    ${isGhost ? "THAI GHOST MODE: Use atmospheric, eerie, and suspenseful language. Incorporate Thai cultural elements like 'Wat' (Temple), 'Karma', 'Spirit House', 'Phee' (Ghost), 'Saiyasart' (Dark Magic). Make it sound like a local legend or a true horror story." : ""}
    ${isPodcast ? `PODCAST MODE: Generate a deep-dive dialogue between two hosts (Host A and Host B). Prefix voiceover with "Speaker 1: " or "Speaker 2: ". The tone should be conversational, engaging, and explicitly mention 'listening' or 'podcast'.` : ""}
    
    VISUAL PROMPT RULE: Describe cinematic visuals in ENGLISH.
    ${isVideoModel ? "VEO MOTION RULE: Visual prompts MUST focus on fluid movement, dynamic camera shifts, and temporal progression (e.g., 'a character walking through a bustling neon street, camera tracking low, cinematic lighting')." : "IMAGE RULE: Focus on composition and lighting."}
    ${isGhost ? "VISUALS FOR GHOST: Dark, moody, high contrast, shadows, abandoned Thai places, spirit houses, ancient trees, eerie moonlight." : ""}
    
    CRITICAL LANGUAGE RULE: Every text field in the response (title, description, voiceover) MUST be in ${language}. ONLY "visual_prompt" MUST be in English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate a sensational ${mode} content for: "${topic}". Format: ${aspectRatio}. Duration: ${durationMinutes} minutes.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            longDescription: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            seoKeywords: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  visual_prompt: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                  duration_est: { type: Type.INTEGER }
                },
                required: ['id', 'visual_prompt', 'voiceover', 'duration_est']
              }
            }
          },
          required: ['title', 'seoTitle', 'description', 'longDescription', 'hashtags', 'seoKeywords', 'scenes']
        }
      }
    });

    return JSON.parse(response.text || '{}') as ScriptData;
  });
};

export const generateVideoForScene = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', model: string = 'veo-3.1-fast-generate-preview'): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    let operation = await ai.models.generateVideos({
      model: model as any,
      prompt: `${prompt}. Cinematic movement, high quality, realistic.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a link");

    return `${downloadLink}&key=${process.env.API_KEY}`;
  });
};

export const generateImageForScene = async (prompt: string, model: string = 'gemini-2.0-flash', aspectRatio: string = '9:16'): Promise<string> => {
  // === PRODUCTION MODE: Use Backend Proxy ===
  if (isProduction && !getCustomApiKey()) {
    const response = await fetch(`${getProxyBaseUrl()}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Image generation failed');
    }

    const data = await response.json();
    return `data:${data.mimeType};base64,${data.imageData}`;
  }

  // === LOCAL DEV / BYOK MODE ===
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio === '9:16' || aspectRatio === '16:9' || aspectRatio === '1:1' || aspectRatio === '3:4' || aspectRatio === '4:3') ? aspectRatio : '1:1'
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  });
};

export const generateVoiceover = async (text: string, voiceName: string): Promise<string> => {
  // === PRODUCTION MODE: Use Backend Proxy ===
  if (isProduction && !getCustomApiKey()) {
    const response = await fetch(`${getProxyBaseUrl()}/api/generate-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Voice generation failed');
    }

    const data = await response.json();
    return data.audioData;
  }

  // === LOCAL DEV / BYOK MODE ===
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};

export const fetchTrendingNews = async (region: string, category: string, searchQuery?: string): Promise<NewsItem[]> => {
  // Check cache first (news TTL: 10 min)
  const cached = getCachedNews(region, category + (searchQuery || ''));
  if (cached) {
    console.log('[News] Using cached news for', region, category);
    return cached;
  }

  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Find top 10 trending news topics for ${region}. Category: ${category}. Query: ${searchQuery || ''}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              popularity: { type: Type.STRING },
              source: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ['headline', 'summary', 'category', 'popularity']
          }
        }
      }
    });

    const news = JSON.parse(response.text || '[]');
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const newsItems = news.map((item: any, idx: number) => ({
      ...item,
      id: `news-${idx}-${Date.now()}`,
      source: chunks[idx]?.web?.title || item.source || 'News',
      url: chunks[idx]?.web?.uri || '#'
    }));

    // Cache the result
    setCachedNews(region, category + (searchQuery || ''), newsItems);

    return newsItems;
  }, 2, 3000); // Reduce retries to 2, delay 3s for news
};

export const generateSocialPost = async (topic: string, platform: string, language: 'Thai' | 'English' = 'Thai'): Promise<SocialPostData> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Create viral ${platform} post for: ${topic} in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            image_prompt: { type: Type.STRING }
          },
          required: ['caption', 'hashtags', 'image_prompt']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateThumbnail = async (title: string): Promise<string> => {
  return generateImageForScene(`Cinematic thumbnail for: ${title}. NO TEXT.`, 'gemini-2.0-flash', '16:9');
};

export const generatePodcastAudio = async (text: string, voiceA: string, voiceB: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } } },
              { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } } },
            ]
          }
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};
