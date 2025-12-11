import { SavedProject, ProjectStats, ScriptData, GeneratorMode } from '../types';

const STORAGE_KEY = 'autoshorts_projects';
const STATS_KEY = 'autoshorts_stats';

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

// Get project statistics
export const getProjectStats = (): ProjectStats => {
    const projects = listProjects();
    return {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'completed' || p.status === 'uploaded').length,
        uploadedProjects: projects.filter(p => p.status === 'uploaded').length
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
