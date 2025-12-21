
export interface Scene {
  id: number;
  visual_prompt: string;
  voiceover: string;
  duration_est: number; // in seconds
  imageUrl?: string;
  videoUrl?: string; // URL for the generated moving video
  audioBuffer?: AudioBuffer;
  audioBase64?: string;
  status?: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped';
  error?: string;
  mediaSource?: 'ai' | 'stock' | 'upload';
  stockUrl?: string; // If using stock video
}

export interface SubtitleStyle {
  fontSize: number;
  textColor: string;
  backgroundColor: string; // Hex color
  backgroundOpacity: number; // 0 to 1
  verticalOffset: number; // Percentage from bottom (5 to 90)
  fontFamily: 'Kanit' | 'Inter' | 'sans-serif';
}

export interface ScriptData {
  title: string;
  seoTitle: string;
  description: string;
  bgmVolume?: number;
  watermarkUrl?: string;
  projectDescription?: string;
  longDescription: string;
  hashtags: string[];
  seoKeywords: string;
  scenes: Scene[];
  thumbnailUrl?: string;
}

export interface ProjectState {
  id?: string;
  status: 'idle' | 'generating_script' | 'generating_assets' | 'ready' | 'error';
  topic: string;
  script: ScriptData | null;
  currentStep: string;
  error?: string;
}

export type ProjectData = ProjectState;

export enum GeneratorMode {
  FACTS = 'Knowledge/Facts',
  MYSTERY = 'Mystery/Horror',
  CRIME = 'True Crime',
  NEWS = 'Trending News',
  HISTORY = 'History/Biography',
  PHYSICS = 'Physics/Science',
  CRETACEOUS = 'Prehistoric/Dinosaurs',
  LONG_VIDEO = 'Cinematic Long Video',
  PODCAST = 'AI Podcast/Dialogue',
  GHOST = 'Thai Horror/Ghost Stories',
  MANUAL = 'Manual Creation' // Build from scratch
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  popularity: string;
  source?: string;
  date?: string;
  url?: string;
}

export interface SocialPostData {
  caption: string;
  hashtags: string[];
  image_prompt: string;
}

/**
 * Optimization Config for API Cost Reduction
 */
export interface OptimizationConfig {
  economyMode: boolean;      // ลด scene count (3/min แทน 6/min)
  imageOnly: boolean;        // ไม่ใช้ Veo เลย (ประหยัดสุด)
  enableCache: boolean;      // ใช้ cache (ไม่ generate ซ้ำ)
}
