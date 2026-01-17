
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptData, GeneratorMode, NewsItem, SocialPostData, PolishStyle, Scene } from "../types";

export const ERR_INVALID_KEY = "API_KEY_INVALID";

export const notifyApiUsage = (usageAmount: number = 0, modelId: string = '', details: any = {}) => {
  window.dispatchEvent(new CustomEvent('gemini-api-usage', { detail: { usageAmount, modelId, details } }));
};

// --- Key Management (Simplified) ---
let globalApiKey = (process.env as any).API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '');

export const setGlobalApiKey = (key: string) => {
  globalApiKey = key;
  if (typeof window !== 'undefined') localStorage.setItem('gemini_api_key', key);
};

export const getKeys = () => globalApiKey ? [globalApiKey] : [];
export const addKey = (key: string) => setGlobalApiKey(key);
export const removeKey = (key: string) => setGlobalApiKey('');
export const setSingleKey = (key: string) => setGlobalApiKey(key);
export const setGlobalTier = (tier: any) => { }; // User tier managed in AppContext now

const getClient = () => {
  if (!globalApiKey) throw new Error("API Key not found. Please set it in Settings.");
  const trimmedKey = globalApiKey.trim();
  console.log('[DEBUG] Using API Key:', trimmedKey.substring(0, 10) + '...' + trimmedKey.substring(trimmedKey.length - 4));
  return new GoogleGenAI({ apiKey: trimmedKey });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const detectLanguage = (text: string): 'Thai' | 'English' => {
  return /[ก-๙]/.test(text) ? 'Thai' : 'English';
};

const withRetry = async <T>(operation: () => Promise<T>, retries = 3, initialDelay = 3000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation();
      notifyApiUsage();
      return result;
    } catch (error: any) {
      lastError = error;
      const msg = (error.message || "").toLowerCase();
      if (msg.includes('requested entity was not found')) {
        const keyErr = new Error("Invalid Key or Project.");
        (keyErr as any).code = ERR_INVALID_KEY;
        throw keyErr;
      }
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

const safeParseJson = (text: string) => {
  try {
    let cleanText = text.trim();
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
    } catch (e2) { }
    throw new Error("AI generated invalid JSON. Please try again.");
  }
};

/**
 * Universal Script Generator
 */
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

/**
 * Specialized Script Generator for Shorts (Concise & Viral)
 */
export const generateShortsScript = async (
  topic: string,
  mode: GeneratorMode,
  aspectRatio: '9:16' | '16:9',
  languageOverride?: 'Thai' | 'English',
  style: string = 'Cinematic',
  textModel: string = 'gemini-3-flash-preview'
): Promise<ScriptData> => {
  return withRetry(async () => {
    const ai = getClient();
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];

    // STRICT: Detect language from topic to ensure mirroring
    const detectedLang = detectLanguage(topic);
    const targetLang = (detectedLang === 'English') ? 'English' : (languageOverride || 'Thai');

    const systemInstruction = `You are a Professional Viral Content Creator.
    STRICT LANGUAGE POLICY:
    - YOU MUST MIRROR THE LANGUAGE OF THE TOPIC.
    - TOPIC: "${topic}"
    - If the topic is in ENGLISH, the 'voiceover', 'title', and 'description' MUST be in ENGLISH.
    - If the topic is in THAI, the 'voiceover', 'title', and 'description' MUST be in THAI.
    - NEVER mix languages. If the user input is English, do not respond in Thai.
    
    CRITICAL - VISUAL PROMPT RULES:
    - The 'visual_prompt' field MUST be in ENGLISH ONLY.
    - NEVER include Thai text, Chinese text, or ANY non-Latin characters in visual_prompt.
    - NEVER ask the AI to render text/words/letters on the image.
    - Focus ONLY on describing the visual scene, lighting, camera angles, and atmosphere.
    - Example: "Cinematic shot of ancient temple at sunset, golden hour lighting, 35mm lens" ✅
    - Bad example: "Image with Thai text 'สวัสดี' on it" ❌

    CONTENT STYLE: ${style}.
    VISUAL DNA: ${styleDirectives}.

    VIRAL ARCHITECTURE (MANDATORY):
    1. THE HOOK (0-3s): Must be a "Visual Shock" or "Controversial Question". Stop the scroll immediately.
    2. THE RETENTION BRIDGE: Connect the hook to the fact. Use "Did you know..." or "The reason why..." 
    3. THE CLIMAX: The most shocking or interesting part of the script.
    4. THE SEAMLESS LOOP: The last sentence must lead perfectly into the first word of the hook (e.g., if hook starts with "Space is...", end with "...because").
    
    PRODUCTION RULES:
    - ONE SCENE PER SENTENCE: Every single independent sentence must be its own scene node.
    - DYNAMIC SCENE COUNT: Generate as many scenes as necessary to cover the topic (usually 8-12 scenes for a 60s short). DO NOT limit to 5.
    - MAX 10-12 words per scene node for ultra-fast pacing.
    - voiceover should feel personal and urgent, use "You" frequently.
    - 'visual_prompt': Use the Visual DNA provided. Describe a SPECIFIC lighting and camera choice unique to this sentence. NO TEXT.
    - 'title': Click-baity, high CTR, using "Why", "How", or "The truth about".`;

    const response = await ai.models.generateContent({
      model: textModel as any,
      contents: `Generate a script in ${targetLang} about: "${topic}". Remember, if the topic is English, keep the script English.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            scenes: {
              type: Type.ARRAY,
              minItems: 5, maxItems: 5,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  visual_prompt: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                  duration_est: { type: Type.NUMBER }
                },
                required: ["id", "visual_prompt", "voiceover", "duration_est"]
              }
            }
          },
          required: ["title", "seoTitle", "scenes"]
        }
      }
    });

    const data = safeParseJson(response.text || '{}');
    return { ...data, scenes: (data.scenes || []).map((s: any) => ({ ...s, status: 'pending' })) };
  });
};

/**
 * Specialized Script Generator for Long Video (In-depth & Educational)
 */
export const generateLongVideoScript = async (
  topic: string,
  aspectRatio: '16:9',
  languageOverride?: 'Thai' | 'English',
  durationMinutes: number = 10,
  style: string = 'Cinematic',
  textModel: string = 'gemini-3-flash-preview' // แนะนำรุ่น Pro เพื่อความฉลาด
): Promise<ScriptData> => {
  return withRetry(async () => {
    const ai = getClient();
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];

    // คำนวณเป้าหมายจำนวนคำ (พูดปกติ ~140 คำ/นาที)
    const targetWordCount = durationMinutes * 140;

    const detectedLang = detectLanguage(topic);
    const targetLang = (detectedLang === 'English') ? 'English' : (languageOverride || 'Thai');

    // 🔥 PROMPT ที่อัปเกรดแล้วสำหรับสาย DEEP DIVE
    const systemInstruction = `You are a World-Class Documentary Filmmaker and Subject Matter Expert (History/Science/Tech).
    
    YOUR GOAL: Create a "Deep Dive" video script (Video Essay style like 'Lemmino', 'Veritasium', or 'Kurzgesagt').
    
    STRICT LANGUAGE POLICY:
    - TOPIC: "${topic}"
    - TARGET LANGUAGE: ${targetLang} (Must output in this language only).
    - 'visual_prompt' MUST remain in English (Technical cinematography description).

    CONTENT DEPTH GUIDELINES (CRITICAL):
    1. NO FLUFF: Avoid generic phrases like "In today's video..." or "Let's dive in." Start with a hook.
    2. FACT-DENSE: Every paragraph must contain specific dates, names, statistics, or scientific principles.
    3. NUANCE: Do not just state facts; explain the *implications*, *causes*, and *effects*.
    4. UNKNOWN DETAILS: Include trivia or insights that the average person doesn't know.
    5. STRUCTURE: 
       - Hook (Mystery/Paradox)
       - Historical/Contextual Background
       - The Core Analysis (The "Meat" of the video)
       - Addressing Misconceptions
       - Profound Conclusion
    
    ARTISTIC DIRECTION: ${style}.
    TECHNICAL SPECS: ${styleDirectives}.
    
    VOICEOVER LENGTH REQUIREMENT (VERY IMPORTANT):
    - Each scene voiceover must be 50-100 words (NOT 10-15 words like Shorts).
    - Write in complete sentences with depth and analysis.
    - This is NOT a TikTok. This is a DOCUMENTARY.
    
    VISUAL PROMPT REQUIREMENT (CRITICAL - NO TEXT IN IMAGES):
    - Each visual_prompt must be 40+ words in English.
    - NEVER include Thai text, Chinese text, or ANY non-Latin characters.
    - NEVER ask the AI to render text/words/letters on the image.
    - Focus ONLY on visual scenes - lighting, camera angles, atmosphere, subjects.
    - Include: camera angle (wide/close-up), lens (35mm/85mm), lighting (golden hour/Rembrandt), atmosphere (fog/dust motes), color grade (teal-orange/desaturated).
    - Example: "Epic aerial drone shot of pristine Amazon rainforest at sunrise, 24mm lens, volumetric god rays piercing through mist, emerald green canopy stretching infinitely, National Geographic style, 8K resolution." ✅
    - Bad example: "Image showing 'มนุษยชาติ' text overlay" ❌`;

    const response = await ai.models.generateContent({
      model: textModel as any,
      contents: `Generate a highly detailed, educational documentary script about: "${topic}".
      
      PARAMETERS:
      - Duration: ${durationMinutes} Minutes.
      - Target Word Count: Approximately ${targetWordCount} words (Write LONG voiceovers, 50-100 words per scene).
      - Tone: Intellectual, Authoritative, yet Engaging.
      - Each scene voiceover should be a PARAGRAPH, not a sentence.
      
      Provide 10 to 30 sequential scenes covering the topic in extreme depth.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            longDescription: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            scenes: {
              type: Type.ARRAY,
              minItems: 10,
              maxItems: 40,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  visual_prompt: { type: Type.STRING }, // 40+ words cinematic description
                  voiceover: { type: Type.STRING }, // 50-100 words per scene
                  duration_est: { type: Type.NUMBER }
                },
                required: ["id", "visual_prompt", "voiceover", "duration_est"]
              }
            }
          },
          required: ["title", "seoTitle", "scenes"]
        }
      }
    });

    const data = safeParseJson(response.text || '{}');
    return { ...data, scenes: (data.scenes || []).map((s: any) => ({ ...s, status: 'pending' })) };
  });
};

export const refineVisualPrompt = async (topic: string, style: string, voiceover: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `You are a Director of Photography. Enhance this scene concept into a professional 8K cinematic visual prompt in English.
      
      Scene Context: ${voiceover}
      Base Topic: ${topic}
      Technical Directives: ${styleDirectives}
      
      TASK:
      1. Analyze the voiceover's emotional subtext.
      2. Translate the concept into a Masterpiece Cinematic Prompt.
      3. Focus on: Camera lens (85mm for portraits, 24mm for scale), Lighting physics (global illumination, ray-traced shadows), and Texture (8k skin pores, detailed foliage).
      4. DO NOT include generic "cinematic" words. Use specific technical terms like "Anamorphic bokeh", "Volumetric scattering", "Chiaroscuro".
      
      OUTPUT: One dense English paragraph. NO conversations. NO markdown code blocks. NO TEXT in image.`,
    });
    return response.text || "";
  });
};

/**
 * Bulk generate narratively consistent storyboards for multiple scenes.
 */
export const generateStoryboards = async (topic: string, style: string, scenes: { id: number, voiceover: string }[]): Promise<Record<number, string>> => {
  return withRetry(async () => {
    const ai = getClient();
    const styleDirectives = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES['Cinematic'];
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Lead Concept Artist. Generate visually consistent English storyboard prompts for this narrative sequence.
      
      Topic: ${topic}
      Visual DNA: ${styleDirectives}
      
      Timeline:
      ${scenes.map(s => `ID ${s.id}: ${s.voiceover}`).join('\n')}
      
      TASK: Produce a hyper-descriptive cinematic prompt for each ID. Ensure visual continuity in lighting and environment.
      Return ONLY valid JSON: {"storyboards": [{"id": number, "prompt": string}]}`,
      config: { responseMimeType: "application/json" }
    });
    const data = safeParseJson(response.text || '{}');
    const result: Record<number, string> = {};
    (data.storyboards || []).forEach((item: any) => {
      result[item.id] = item.prompt;
    });
    return result;
  });
};

export const regenerateScene = async (topic: string, style: string, context?: string, language: string = 'Thai'): Promise<{ voiceover: string, visual_prompt: string }> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a better alternative for this scene. Topic: ${topic}. Context: ${context}. Style: ${style}. Language: ${language}. Return JSON {voiceover, visual_prompt}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParseJson(response.text || '{}');
  });
};

export const generateLiveImageForScene = async (prompt: string, aspectRatio: string = '9:16', style: string = 'Cinematic'): Promise<string> => {
  return generateVideoForScene(prompt, aspectRatio as any, 'veo-2.0-generate-001', style);
};

export const generatePodcastScript = async (topic: string, language: string = 'Auto'): Promise<any> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a podcast script about "${topic}" in ${language}. Format JSON: {title: string, dialogue: [{speaker: 1|2, text: string}]}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParseJson(response.text || '{}');
  });
};

export const generatePodcastImage = async (style: string = 'Cinematic', model?: string): Promise<string> => {
  return generateImageForScene("Professional podcast studio, neon lighting, depth of field", model || 'gemini-2.5-flash-image', '16:9', style);
};

// ในไฟล์ geminiService.ts

export const generateSeoMetadata = async (topic: string, title: string, description: string): Promise<{ hashtags: string[], seoKeywords: string }> => {
  return withRetry(async () => {
    // อย่าลืมส่ง apiKey เข้ามาใน getClient() ถ้าคุณแก้ตามสเต็ปก่อนหน้า
    const ai = getClient();
    const lang = detectLanguage(topic);

    // 🔥 แก้ Prompt ตรงนี้: สั่งขอ 40-50 Tags แบบเน้นๆ
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // หรือ gemini-3-flash-preview
      contents: `You are a YouTube SEO Expert. 
      Generate a MASSIVE list of viral metadata in ${lang} for: "${topic}"
      Context Title: "${title}"
      
      REQUIREMENTS:
      1. hashtags: Generate exactly 40-50 high-volume viral hashtags. Mix broad (e.g. #fyp) and specific niche tags.
      2. seoKeywords: Generate 50 comma-separated semantic keywords for the video tags section.
      
      Output JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            seoKeywords: { type: Type.STRING }
          }
        }
      }
    });
    return safeParseJson(response.text || '{}');
  });
};

export const generateVoiceover = async (text: string, voiceName: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
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
    const ai = getClient();
    const augmentedPrompt = augmentPromptWithStyle(prompt, style);
    const operation = await ai.models.generateVideos({
      model: model as any,
      prompt: augmentedPrompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    let op = operation;
    let pollCount = 0;
    while (!op.done) {
      pollCount++;
      onProgress?.(pollCount);
      await wait(8000);
      op = await ai.operations.getVideosOperation({ operation: op });
    }
    return `${op.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
  });
};

export const generateImageForScene = async (prompt: string, model: string = 'gemini-2.5-flash-image', aspectRatio: string = '9:16', style: string = 'Cinematic'): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const augmentedPrompt = augmentPromptWithStyle(prompt, style);
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: augmentedPrompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image error");
  });
};
export const generateThumbnail = async (title: string, topic: string, style: string = 'Cinematic'): Promise<string> => {
  // IMPORTANT: Do NOT include any Thai/non-Latin text in the prompt to avoid corrupted text rendering
  return generateImageForScene(`Viral high-impact YouTube thumbnail. Topic: ${topic}. Cinematic key visual representing the theme. High-contrast, clickable graphic design. NO TEXT ON IMAGE - the image should be purely visual without any words, letters, or characters. Focus on dramatic lighting, bold colors, and eye-catching composition.`, 'gemini-2.5-flash-image', '16:9', style);
};

export const generatePodcastAudio = async (text: string, voiceA: string, voiceB: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } } },
              { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } } }
            ]
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};
