export interface Scene {
  id: number;
  visual_prompt: string;
  voiceover: string;
  duration_est: number; // in seconds
  imageUrl?: string;
  audioBuffer?: AudioBuffer;
}

export interface ScriptData {
  title: string; // Display title
  seoTitle: string; // Searchable/Clickbait title
  description: string; // Short description
  longDescription: string; // 300+ words
  hashtags: string[]; // 20+ tags
  seoKeywords: string; // Comma separated string for YouTube tags (500 chars limit style)
  scenes: Scene[];
}

export interface ProjectState {
  status: 'idle' | 'generating_script' | 'generating_assets' | 'ready' | 'error';
  topic: string;
  script: ScriptData | null;
  currentStep: string;
  error?: string;
}

export enum GeneratorMode {
  FACTS = 'Knowledge/Facts',
  MYSTERY = 'Mystery/Horror',
  CRIME = 'True Crime',
  NEWS = 'Trending News'
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  popularity: string;
  source?: string;
  date?: string;
}

export interface SocialPostData {
  caption: string;
  hashtags: string[];
  image_prompt: string; // The English prompt for external generation
}

export interface SavedProject {
  id: string;
  name: string;
  topic: string;
  mode: GeneratorMode;
  script: ScriptData | null;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'uploaded';
}

export interface ProjectStats {
  totalProjects: number;
  completedProjects: number;
  uploadedProjects: number;
}