import { SavedProject, ProjectStats, ScriptData, GeneratorMode } from '../types';

const STORAGE_KEY = 'autoshorts_projects';
const STATS_KEY = 'autoshorts_stats';
const PRESETS_KEY = 'autoshorts_presets';
const CALENDAR_KEY = 'autoshorts_calendar';
const BATCH_QUEUE_KEY = 'autoshorts_batch_queue';

// Types for new features
export interface Preset {
    id: string;
    name: string;
    mode: GeneratorMode;
    voice: string;
    imageModel: string;
    createdAt: string;
}

export interface CalendarItem {
    id: string;
    date: string; // YYYY-MM-DD
    topic: string;
    projectId?: string;
    status: 'planned' | 'created' | 'published';
}

export interface BatchQueueItem {
    id: string;
    topic: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    projectId?: string;
    error?: string;
}

// Generate unique ID
const generateId = (): string => {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all projects from storage
export const listProjects = (): SavedProject[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data) as SavedProject[];
    } catch (e) {
        console.error('Error loading projects:', e);
        return [];
    }
};

// Save a new project or update existing
export const saveProject = (
    name: string,
    topic: string,
    mode: GeneratorMode,
    script: ScriptData | null,
    existingId?: string
): SavedProject => {
    const projects = listProjects();
    const now = new Date().toISOString();

    if (existingId) {
        // Update existing project
        const index = projects.findIndex(p => p.id === existingId);
        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                name,
                topic,
                mode,
                script,
                updatedAt: now,
                status: script ? 'completed' : 'draft'
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            return projects[index];
        }
    }

    // Create new project
    const newProject: SavedProject = {
        id: generateId(),
        name,
        topic,
        mode,
        script,
        createdAt: now,
        updatedAt: now,
        status: script ? 'completed' : 'draft'
    };

    projects.unshift(newProject); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
};

// Load a specific project
export const loadProject = (id: string): SavedProject | null => {
    const projects = listProjects();
    return projects.find(p => p.id === id) || null;
};

// Delete a project
export const deleteProject = (id: string): boolean => {
    const projects = listProjects();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length !== projects.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
    return false;
};

// Mark project as uploaded
export const markProjectUploaded = (id: string): void => {
    const projects = listProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        projects[index].status = 'uploaded';
        projects[index].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
};

// Get project statistics (enhanced)
export const getProjectStats = (): ProjectStats & {
    videosThisWeek: number;
    videosThisMonth: number;
    topTopics: string[];
} => {
    const projects = listProjects();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count videos by time period
    const videosThisWeek = projects.filter(p => new Date(p.createdAt) >= oneWeekAgo).length;
    const videosThisMonth = projects.filter(p => new Date(p.createdAt) >= oneMonthAgo).length;

    // Get top topics
    const topicCounts: Record<string, number> = {};
    projects.forEach(p => {
        const topic = p.topic.toLowerCase().split(' ').slice(0, 3).join(' ');
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

    return {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'completed' || p.status === 'uploaded').length,
        uploadedProjects: projects.filter(p => p.status === 'uploaded').length,
        videosThisWeek,
        videosThisMonth,
        topTopics
    };
};

// Get recent projects (last N)
export const getRecentProjects = (count: number = 5): SavedProject[] => {
    const projects = listProjects();
    return projects.slice(0, count);
};

// Clear all projects (use with caution)
export const clearAllProjects = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
};

// ==================== PRESET TEMPLATES ====================

export const listPresets = (): Preset[] => {
    try {
        const data = localStorage.getItem(PRESETS_KEY);
        if (!data) return getDefaultPresets();
        return JSON.parse(data) as Preset[];
    } catch (e) {
        return getDefaultPresets();
    }
};

const getDefaultPresets = (): Preset[] => [
    { id: 'preset_horror', name: '👻 Horror Mode', mode: GeneratorMode.MYSTERY, voice: 'Charon', imageModel: 'gemini-3-pro-image-preview', createdAt: '' },
    { id: 'preset_facts', name: '🧠 Facts Mode', mode: GeneratorMode.FACTS, voice: 'Puck', imageModel: 'gemini-2.5-flash-image', createdAt: '' },
    { id: 'preset_news', name: '📰 News Mode', mode: GeneratorMode.NEWS, voice: 'Kore', imageModel: 'gemini-2.5-flash-image', createdAt: '' },
    { id: 'preset_crime', name: '🔪 True Crime', mode: GeneratorMode.CRIME, voice: 'Charon', imageModel: 'gemini-3-pro-image-preview', createdAt: '' },
];

export const savePreset = (preset: Omit<Preset, 'id' | 'createdAt'>): Preset => {
    const presets = listPresets().filter(p => !p.id.startsWith('preset_')); // Remove defaults
    const newPreset: Preset = {
        ...preset,
        id: `custom_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    presets.push(newPreset);
    localStorage.setItem(PRESETS_KEY, JSON.stringify([...getDefaultPresets(), ...presets]));
    return newPreset;
};

export const deletePreset = (id: string): void => {
    if (id.startsWith('preset_')) return; // Can't delete defaults
    const presets = listPresets().filter(p => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
};

// ==================== CONTENT CALENDAR ====================

export const getCalendarItems = (): CalendarItem[] => {
    try {
        const data = localStorage.getItem(CALENDAR_KEY);
        if (!data) return [];
        return JSON.parse(data) as CalendarItem[];
    } catch (e) {
        return [];
    }
};

export const addCalendarItem = (date: string, topic: string): CalendarItem => {
    const items = getCalendarItems();
    const newItem: CalendarItem = {
        id: `cal_${Date.now()}`,
        date,
        topic,
        status: 'planned'
    };
    items.push(newItem);
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(items));
    return newItem;
};

export const updateCalendarItem = (id: string, updates: Partial<CalendarItem>): void => {
    const items = getCalendarItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        localStorage.setItem(CALENDAR_KEY, JSON.stringify(items));
    }
};

export const deleteCalendarItem = (id: string): void => {
    const items = getCalendarItems().filter(i => i.id !== id);
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(items));
};

// ==================== BATCH QUEUE ====================

export const getBatchQueue = (): BatchQueueItem[] => {
    try {
        const data = localStorage.getItem(BATCH_QUEUE_KEY);
        if (!data) return [];
        return JSON.parse(data) as BatchQueueItem[];
    } catch (e) {
        return [];
    }
};

export const saveBatchQueue = (items: BatchQueueItem[]): void => {
    localStorage.setItem(BATCH_QUEUE_KEY, JSON.stringify(items));
};

export const clearBatchQueue = (): void => {
    localStorage.removeItem(BATCH_QUEUE_KEY);
};

