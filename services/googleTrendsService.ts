// Google Trends RSS Service - FREE, no API key needed!
import { NewsItem } from '../types';

// Correct RSS URLs (New format)
const TRENDS_RSS_TH = 'https://trends.google.com/trending/rss?geo=TH';
const TRENDS_RSS_US = 'https://trends.google.com/trending/rss?geo=US';

// RSS to JSON Converter API (Handles CORS and XML parsing)
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Category codes for Google Trends
const CATEGORY_CODES: Record<string, string> = {
    'business': 'b',
    'entertainment': 'e',
    'health': 'm',
    'science': 't', // Sci/Tech
    'technology': 't', // Sci/Tech
    'sports': 's',
    'top': 'h', // Top stories
    'all': ''
};

interface RSSItem {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    guid: string;
    author: string;
    thumbnail: string;
}

/**
 * Fetch trending topics using rss2json service
 * @param region - 'thailand' or 'global'
 * @param category - Optional category filter
 * @returns Array of NewsItem
 */
export const fetchGoogleTrends = async (region: 'thailand' | 'global' = 'thailand', category: string = 'All'): Promise<NewsItem[]> => {
    let rssUrl = region === 'thailand' ? TRENDS_RSS_TH : TRENDS_RSS_US;

    // Append category param if valid and not 'All'
    const catCode = CATEGORY_CODES[category.toLowerCase()];
    if (catCode) {
        rssUrl += `&cat=${catCode}`;
    }

    try {
        // 1. Fetch from rss2json
        const response = await fetch(`${RSS2JSON_API}${encodeURIComponent(rssUrl)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch trends: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error('rss2json returned error status');
        }

        // 2. Map items to NewsItem format
        const items: RSSItem[] = data.items || [];

        return items.slice(0, 15).map((item, index) => {
            // Create summary from description (strip HTML)
            const div = document.createElement('div');
            div.innerHTML = item.description;
            const textSummary = div.textContent || div.innerText || item.title;

            return {
                id: `trend-${index}-${Date.now()}`,
                headline: item.title,
                summary: textSummary.substring(0, 150) + (textSummary.length > 150 ? '...' : ''),
                category: category === 'All' ? 'Trending' : category, // Use requested category
                popularity: 'Hot', // rss2json doesn't give traffic count, assume Hot
                source: 'Google Trends',
                date: new Date(item.pubDate).toLocaleDateString('th-TH'),
                url: item.link
            };
        });

    } catch (error) {
        console.error('[Google Trends] Error fetching:', error);
        throw error;
    }
};

// Cache for trends (longer TTL since it's free)
const trendsCache: Map<string, { data: NewsItem[], timestamp: number }> = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch trends with caching
 */
export const fetchTrendsWithCache = async (region: 'thailand' | 'global' = 'thailand', category: string = 'All'): Promise<NewsItem[]> => {
    const cacheKey = `${region}-${category}`;
    const cached = trendsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[Google Trends] Using cached data for', region, category);
        return cached.data;
    }

    const data = await fetchGoogleTrends(region, category);
    trendsCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('[Google Trends] Fetched fresh data for', region, category);

    return data;
};
