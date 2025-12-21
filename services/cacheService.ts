/**
 * Cache Service for API Optimization
 * - In-memory cache สำหรับ script generation
 * - TTL 30 นาที
 * - ลดการเรียก API ซ้ำถ้า topic เหมือนกัน
 */

import { ScriptData, GeneratorMode } from '../types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// Cache TTL: 30 minutes
const CACHE_TTL = 30 * 60 * 1000;

// In-memory caches
const scriptCache = new Map<string, CacheEntry<ScriptData>>();
const newsCache = new Map<string, CacheEntry<any[]>>();

/**
 * Generate cache key from parameters
 */
const generateCacheKey = (topic: string, mode: GeneratorMode, language: string, economyMode: boolean): string => {
    return `${topic.toLowerCase().trim()}|${mode}|${language}|${economyMode ? 'eco' : 'full'}`;
};

/**
 * Get cached script if available and not expired
 */
export const getCachedScript = (
    topic: string,
    mode: GeneratorMode,
    language: string,
    economyMode: boolean = false
): ScriptData | null => {
    const key = generateCacheKey(topic, mode, language, economyMode);
    const entry = scriptCache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
        scriptCache.delete(key);
        return null;
    }

    console.log(`[Cache] HIT: Script for "${topic}" (${mode})`);
    return entry.data;
};

/**
 * Cache a generated script
 */
export const setCachedScript = (
    topic: string,
    mode: GeneratorMode,
    language: string,
    economyMode: boolean,
    script: ScriptData
): void => {
    const key = generateCacheKey(topic, mode, language, economyMode);
    scriptCache.set(key, {
        data: script,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL
    });
    console.log(`[Cache] SET: Script for "${topic}" cached for 30 min`);
};

/**
 * Get cached news if available
 */
export const getCachedNews = (region: string, category: string): any[] | null => {
    const key = `news|${region}|${category}`;
    const entry = newsCache.get(key);

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        newsCache.delete(key);
        return null;
    }

    return entry.data;
};

/**
 * Cache news results (shorter TTL: 10 min)
 */
export const setCachedNews = (region: string, category: string, news: any[]): void => {
    const key = `news|${region}|${category}`;
    newsCache.set(key, {
        data: news,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 min TTL for news
    });
};

/**
 * Clear all caches
 */
export const clearAllCache = (): void => {
    scriptCache.clear();
    newsCache.clear();
    console.log('[Cache] All caches cleared');
};

/**
 * Clear script cache only
 */
export const clearScriptCache = (): void => {
    scriptCache.clear();
    console.log('[Cache] Script cache cleared');
};

/**
 * Get cache stats
 */
export const getCacheStats = (): { scripts: number; news: number } => {
    return {
        scripts: scriptCache.size,
        news: newsCache.size
    };
};
