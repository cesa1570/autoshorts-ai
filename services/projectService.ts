
/**
 * Project Storage Service
 * Uses IndexedDB to store project states, including large base64 audio and video data.
 * This avoids the 5MB limit of localStorage.
 */

const DB_NAME = 'AutoShortsStudioDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Deeply clones an object and removes non-serializable properties like AudioBuffer.
 * IndexedDB's structured clone algorithm fails on certain Web API objects.
 * We rely on the base64 versions of assets for long-term storage and reconstruct
 * buffers in memory during the load process.
 */
const sanitizeForIDB = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check for AudioBuffer or other problematic browser-specific objects
  // Using constructor check for robustness across potentially minified environments
  if (typeof AudioBuffer !== 'undefined' && obj instanceof AudioBuffer) return undefined;
  if (typeof HTMLImageElement !== 'undefined' && obj instanceof HTMLImageElement) return undefined;
  if (typeof HTMLVideoElement !== 'undefined' && obj instanceof HTMLVideoElement) return undefined;
  if (typeof MediaStream !== 'undefined' && obj instanceof MediaStream) return undefined;
  if (typeof File !== 'undefined' && obj instanceof File) return undefined;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForIDB(item)).filter(item => item !== undefined);
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = sanitizeForIDB(obj[key]);
      // We skip undefined values (which result from our removal checks above)
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

export interface ProjectData {
  id: string;
  type: 'shorts' | 'long' | 'podcast';
  title: string;
  topic: string;
  lastUpdated: number;
  config: any; // voices, bgm settings, etc.
  script: any; // includes scenes with base64 assets
}

export const saveProject = async (project: ProjectData): Promise<void> => {
  const db = await openDB();
  
  // Clean the object of any non-serializable data before IDB 'put'
  const safeProject = sanitizeForIDB(project);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(safeProject);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadProject = async (id: string): Promise<ProjectData | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const listProjects = async (type?: string): Promise<ProjectData[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result as ProjectData[];
      if (type) {
        results = results.filter(p => p.type === type);
      }
      resolve(results.sort((a, b) => b.lastUpdated - a.lastUpdated));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const exportProjectToJson = (project: ProjectData) => {
  const safeProject = sanitizeForIDB(project);
  const blob = new Blob([JSON.stringify(safeProject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_')}_project.json`;
  a.click();
  URL.revokeObjectURL(url);
};
