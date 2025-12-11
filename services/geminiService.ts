import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptData, GeneratorMode, NewsItem, SocialPostData } from "../types";

// Helper to get client securely
const getClient = (apiKey?: string) => {
  // Priority: 1) Passed apiKey (from localStorage), 2) Build-time env variable
  // @ts-ignore - Vite injects these at build time
  const envKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined;
  const finalKey = apiKey || envKey;
  if (!finalKey) {
    throw new Error("API Key not found. Please enter your Gemini API Key in Settings.");
  }
  return new GoogleGenAI({ apiKey: finalKey });
};

// --- RATE LIMIT HANDLING ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries an async operation with exponential backoff if it fails with a rate limit error (429).
 */
const withRetry = async <T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check for common rate limit error codes/messages
      const isRateLimit =
        error.status === 429 ||
        error.code === 429 ||
        error.message?.includes('429') ||
        error.message?.includes('quota') ||
        error.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i); // 2s, 4s, 8s
        console.warn(`⚠️ Rate limit hit (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }

      // If it's not a rate limit error, or we ran out of retries, throw immediately
      throw error;
    }
  }
  throw lastError;
};

export const generateScript = async (topic: string, mode: GeneratorMode, apiKey?: string): Promise<ScriptData> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const systemInstruction = `You are a viral content scriptwriter and SEO expert for TikTok, YouTube Shorts, and Reels. 
    
    Your goal is to:
    1. Write a highly engaging, fast-paced script (3-5 scenes).
    2. Generate extensive SEO metadata to maximize reach.
    
    Tone guidelines:
    - Mystery/Horror: Suspenseful, dark.
    - True Crime: Serious, gripping.
    - Facts/News: Energetic, "Did you know?" style.
    
    Language: Write EVERYTHING in the SAME LANGUAGE as the user's topic (e.g., if input is Thai, output Thai).
    
    Requirements for SEO:
    - 'seoTitle': A highly searchable, clickbait-style title including keywords.
    - 'longDescription': A comprehensive, keyword-rich article describing the content (Minimum 300 words).
    - 'hashtags': An array of at least 20 popular, relevant hashtags.
    - 'seoKeywords': A comma-separated string of 30-50 high-traffic keywords related to the topic.
    
    Output JSON format only.`;

    const prompt = `Create a short video script about: "${topic}". Mode: ${mode}. Include extensive SEO data.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short internal display title" },
            seoTitle: { type: Type.STRING, description: "Optimized YouTube title" },
            description: { type: Type.STRING, description: "Short hook description" },
            longDescription: { type: Type.STRING, description: "Detailed 300+ word description for SEO" },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "20+ hashtags" },
            seoKeywords: { type: Type.STRING, description: "Comma separated list of 50 keywords" },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  visual_prompt: { type: Type.STRING, description: "Detailed prompt for AI image generator. ALWAYS IN ENGLISH." },
                  voiceover: { type: Type.STRING, description: "The narrator text." },
                  duration_est: { type: Type.NUMBER }
                },
                required: ["id", "visual_prompt", "voiceover", "duration_est"]
              }
            }
          },
          required: ["title", "seoTitle", "description", "longDescription", "hashtags", "seoKeywords", "scenes"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Failed to generate script");
    }

    return JSON.parse(response.text) as ScriptData;
  });
};

export const fetchTrendingNews = async (apiKey?: string, region: 'global' | 'thailand' = 'global', category: string = 'all'): Promise<NewsItem[]> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    // Category mapping for prompts
    const categoryPrompts: Record<string, string> = {
      'all': 'any viral topic',
      'sports': 'Sports news (ข่าวกีฬา) - Football, Boxing, MMA, Olympics, eSports, Thai League',
      'crime': 'Crime & Murder news (ข่าวอาชญากรรม/ฆาตกรรม) - Murder cases, robbery, scams, police investigations',
      'entertainment': 'Entertainment news (ข่าวบันเทิง) - Celebrity drama, movies, music, TV shows, gossip',
      'tech': 'Technology news (ข่าวเทคโนโลยี) - AI, gadgets, smartphones, apps, startups',
      'other': 'Unusual & Bizarre news (ข่าวแปลก) - Weird stories, mysteries, unexplained events, viral moments'
    };

    const categoryFocus = categoryPrompts[category] || categoryPrompts['all'];

    let prompt = "";

    if (region === 'thailand') {
      prompt = `Generate 9 viral, trending news headlines specifically for THAILAND (ประเทศไทย) that would be popular on TikTok/Shorts RIGHT NOW.
      
      CATEGORY FOCUS: ${categoryFocus}
      
      IMPORTANT: 
      - Output the 'headline' and 'summary' in THAI Language (ภาษาไทย).
      - Include a plausible 'source' (e.g. Thairath, Sanook, Khaosod, Thai PBS, Amarin TV).
      - Include a relative 'date' (e.g. "2 ชั่วโมงที่แล้ว", "วันนี้", "เมื่อวาน").
      - Make headlines catchy and viral-worthy.
      Return a JSON array of objects.`;
    } else {
      prompt = `Generate 9 viral, trending news headlines or topics that would be popular on YouTube Shorts / TikTok RIGHT NOW.
      
      CATEGORY FOCUS: ${categoryFocus}
      
      Include a plausible 'source' (e.g. BBC, CNN, The Verge, Reddit, TMZ) and a relative 'date' (e.g. 5 hours ago, Yesterday).
      Make headlines catchy and viral-worthy.
      Return a JSON array of objects.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              popularity: { type: Type.STRING, description: "e.g. '1.5M Searches'" },
              source: { type: Type.STRING, description: "Name of the news source" },
              date: { type: Type.STRING, description: "Relative time/date" }
            }
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text) as NewsItem[];
  });
};

export const generateSocialPost = async (topic: string, platform: string, apiKey?: string): Promise<SocialPostData> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const prompt = `You are a professional social media news editor and storyteller (similar to viral explainer pages like "หาทำนิวส์" or "สรุปให้"). 
    Create a viral, engaging news summary post for "${platform}" about: "${topic}".
    
    **Style & Structure Requirements (Match this format exactly):**
    
    1. **Headline**: Start with a catchy, urgent hook (e.g., "เปิดปมร้อน!", "สรุปดราม่า!", "รู้ยัง?").
    2. **Intro**: One sentence on why this is the talk of the town.
    3. **The Story (เรื่องมันเป็นแบบนี้/สรุปเหตุการณ์):** 
       - Use an emoji like 🌊, 📖, or 📍 to start.
       - Simplify the complex background story into easy-to-read bullet points or short paragraphs. 
       - Explain it like you are talking to a friend.
    4. **The Conflict/Concern (จุดที่คนกังวล/ประเด็นร้อน):** 
       - Use ⚠️, 🛡️, or 🔥 to start.
       - Explain the core conflict, the drama, or the "Why is this a problem?" part.
    5. **Perspectives / Sides:**
       - ✅ Side A (e.g., Government, Supporters, Pros).
       - ❌ Side B (e.g., Opposition, Critics, Cons).
       - Or use 1️⃣ / 2️⃣ if it's a choice.
    6. **Call to Action (Engagement):** 
       - Ask the audience to pick a side or comment (e.g., "You choose Team 1 or 2?", "What do you think? Comment below! 👇").
    
    **Tone**: Informative, Neutral but engaging, "News for the new generation". Easy to digest.
    **Language**: STRICTLY use the SAME LANGUAGE as the input topic (e.g. if the topic is in Thai, write the post in Thai).
    
    **Outputs Requirements**:
    - 'caption': The full text post formatted with newlines and emojis.
    - 'hashtags': 15-20 relevant trending tags.
    - 'image_prompt': A HIGHLY DETAILED, PROFESSIONAL art prompt in ENGLISH describing a cover image for this news topic. Use keywords like 'Editorial illustration', 'Split screen comparison', 'Info-graphic style', 'Cinematic lighting', '8k'.
    
    Return JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            image_prompt: { type: Type.STRING, description: "English prompt for image generation" }
          },
          required: ["caption", "hashtags", "image_prompt"]
        }
      }
    });

    if (!response.text) throw new Error("Failed to generate post");
    return JSON.parse(response.text) as SocialPostData;
  });
};

export const generateImageForScene = async (prompt: string, apiKey?: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
  // Inner helper to handle specific model calls without retry wrapper yet, 
  // because we might want to switch models on failure.
  const ai = getClient(apiKey);

  const extractImage = (response: any) => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  };

  const cleanPrompt = prompt + ", cinematic lighting, 8k resolution, highly detailed, photorealistic, vertical aspect ratio 9:16. NO text, NO typography, NO writing, clear visual only.";

  // If Flash is requested, use it with standard retry
  if (model === 'gemini-2.5-flash-image') {
    return withRetry(async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: cleanPrompt }] }
        });
        const img = extractImage(response);
        if (img) return img;
        throw new Error("Flash image generation returned no data");
      } catch (e) {
        throw new Error(`Flash Image Generation Failed: ${(e as Error).message}`);
      }
    });
  }

  // Default: Try Gemini 3 Pro first (High Quality)
  // We wrap the Pro attempt in try/catch to fallback to Flash, 
  // BUT we also use withRetry inside to handle rate limits for Pro specifically before giving up.
  try {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: cleanPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: '9:16',
            imageSize: '1K'
          }
        }
      });

      const img = extractImage(response);
      if (img) return img;
      throw new Error("No image data returned from Gemini Pro");
    }, 2, 2000); // Retry Pro 2 times before falling back

  } catch (e) {
    console.warn("Gemini 3 Pro Image failed or exhausted quota, attempting fallback to Flash Image", e);

    // Fallback to Flash with its own retry logic
    return withRetry(async () => {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: cleanPrompt }]
        }
      });

      const img = extractImage(fallbackResponse);
      if (img) return img;
      throw new Error("Flash image generation failed");
    });
  }
};

export const generateVoiceover = async (text: string, apiKey?: string, voiceName: string = 'Kore'): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate audio");
    }

    return base64Audio;
  });
};

// ==================== PASSIVE INCOME FEATURES ====================

// Predict viral potential of a topic (0-100 score)
export interface ViralPrediction {
  score: number;
  reasoning: string;
  suggestions: string[];
  bestTimeToPost: string;
}

export const predictViralScore = async (topic: string, apiKey?: string): Promise<ViralPrediction> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this topic for viral potential on YouTube Shorts/TikTok: "${topic}"

      Consider:
      - Current trend relevance
      - Emotional engagement potential
      - Shareability factor
      - Target audience size
      - Competition level

      Return JSON with:
      - score (0-100, where 100 = extremely likely to go viral)
      - reasoning (brief explanation)
      - suggestions (3 ways to make it more viral)
      - bestTimeToPost (best time in Thailand timezone)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            bestTimeToPost: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) throw new Error("Failed to predict viral score");
    return JSON.parse(response.text) as ViralPrediction;
  });
};

// Generate auto topic suggestions based on current trends
export const generateAutoTopics = async (niche: string, count: number = 10, apiKey?: string): Promise<{
  topics: { title: string; viralScore: number; category: string }[];
}> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate ${count} highly viral topic ideas for YouTube Shorts/TikTok in the "${niche}" niche.

      Focus on:
      - Topics trending RIGHT NOW in Thailand and globally
      - High engagement potential
      - Easy to create content
      - Good for short-form video (30-60 seconds)

      Each topic should have a predicted viral score (0-100).
      Return in Thai language if niche is Thai-related, otherwise English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  viralScore: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("Failed to generate topics");
    return JSON.parse(response.text);
  });
};

// Translate script to another language
export const translateScript = async (
  script: ScriptData,
  targetLanguage: string,
  apiKey?: string
): Promise<ScriptData> => {
  return withRetry(async () => {
    const ai = getClient(apiKey);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate this video script to ${targetLanguage}. 
      Maintain the same tone, viral appeal, and SEO optimization.
      Adapt hashtags for the target language market.

      Original Script:
      ${JSON.stringify(script, null, 2)}

      Return the translated script in the same JSON structure.`,
      config: {
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
                  id: { type: Type.NUMBER },
                  visual_prompt: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                  duration_est: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("Failed to translate script");
    return JSON.parse(response.text) as ScriptData;
  });
};