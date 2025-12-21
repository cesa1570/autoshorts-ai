import React, { useEffect, useState, useRef } from 'react';
import { Flame, RefreshCw, Globe, MapPin, Search, Video, Mic, Share2, X, ChevronDown } from 'lucide-react';
import { fetchTrendsWithCache } from '../services/googleTrendsService';
import { fetchMockTrends } from '../services/mockNewsService';
import { NewsItem } from '../types';

interface TrendingNewsProps {
  onSelectTopic: (topic: string, type: 'video' | 'social' | 'podcast', region: 'global' | 'thailand') => void;
}

// Categories supported by Google Trends RSS
const CATEGORIES = [
  { id: 'All', label: '🔥 All' },
  { id: 'Business', label: '💰 Business' },
  { id: 'Entertainment', label: '🎬 Ent' },
  { id: 'Health', label: '🏥 Health' },
  { id: 'Science', label: '🧬 Science' },
  { id: 'Sports', label: '⚽ Sports' },
  { id: 'Technology', label: '💻 Tech' },
  { id: 'Top', label: '📰 Top Stories' },
];

// Debounce delay to prevent rapid API calls
const DEBOUNCE_MS = 500;

const TrendingNews: React.FC<TrendingNewsProps> = ({ onSelectTopic }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<'global' | 'thailand'>('thailand');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSource, setActiveSource] = useState<'google' | 'demo'>('google');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [isCached, setIsCached] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const loadNews = async (force: boolean = false) => {
    // Rate limiting: minimum 2 seconds between calls
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 2000) {
      console.log('[Trends] Throttled - too soon since last request');
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    setIsCached(false);
    try {
      const startTime = Date.now();
      let items: NewsItem[] = [];

      if (activeSource === 'demo') {
        // Use Mock Data (Simulated) - Supports Category Filtering
        items = await fetchMockTrends(activeRegion, activeCategory);
      } else {
        // Use Google Trends RSS (via rss2json) - FREE, no API quota!
        // Note: Google Trends RSS for Thailand often ignores category param
        items = await fetchTrendsWithCache(activeRegion, activeCategory);
      }

      // Filter by search query if provided
      const filtered = searchQuery
        ? items.filter(item =>
          item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : items;
      // If returned in < 50ms, it's from cache
      if (Date.now() - startTime < 50) {
        setIsCached(true);
      }
      setNews(filtered);
    } catch (error) {
      console.error('[Trends] Error:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Track if first render
  const isFirstRender = useRef(true);

  // Auto-load on mount and when region changes (FREE - no quota concerns!)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadNews(true); // Auto-load since it's free now!
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadNews();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [activeRegion, activeCategory, activeSource]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <Flame className="text-orange-500" fill="currentColor" size={24} /> Trending Intelligence
            </h2>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest font-black">Google Trends Explorer</p>
          </div>
          <button
            onClick={() => loadNews(true)}
            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Google Trends Style Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-1 rounded-xl">

          {/* Region Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800 min-w-[140px] justify-between transition-all">
              <span className="flex items-center gap-2 truncate">
                {activeRegion === 'thailand' ? '🇹🇭 Thailand' : '🌎 Global'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
              <button onClick={() => setActiveRegion('thailand')} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white text-sm flex items-center gap-2">
                <span className="w-5 text-center">🇹🇭</span> Thailand
              </button>
              <button onClick={() => setActiveRegion('global')} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white text-sm flex items-center gap-2">
                <span className="w-5 text-center">🌎</span> Global
              </button>
            </div>
          </div>

          {/* Time Period (Static for RSS) */}
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-sm text-slate-500 min-w-[140px] justify-between cursor-not-allowed opacity-60">
            <span>Past 24 hours</span>
            <ChevronDown size={14} className="text-slate-600" />
          </button>

          {/* Category Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800 min-w-[160px] justify-between transition-all">
              <span className="truncate">{CATEGORIES.find(c => c.id === activeCategory)?.label || 'All Categories'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w - full text - left px - 4 py - 3 text - sm flex items - center justify - between group / item ${activeCategory === cat.id ? 'bg-slate-800 text-purple-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} `}
                >
                  {cat.label}
                  {activeCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Source Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800 min-w-[150px] justify-between transition-all">
              <span className="truncate">{activeSource === 'google' ? 'Google (Real)' : 'Demo Mode'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
              <button onClick={() => setActiveSource('google')} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white text-sm flex items-center gap-2">
                <span className="w-5 text-center">🔥</span> Google (Real)
              </button>
              <button onClick={() => setActiveSource('demo')} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white text-sm flex items-center gap-2">
                <span className="w-5 text-center">🧪</span> Demo Mode (Sim)
              </button>
            </div>
          </div>

        </div>

        {/* Warning Toast for Thailand Category Limitation */}
        {activeSource === 'google' && activeRegion === 'thailand' && activeCategory !== 'All' && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-200 px-4 py-2 rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="bg-orange-500/20 p-1 rounded-full"><ChevronDown size={10} className="text-orange-400" /></span>
            Note: Google Trends Thailand RSS feed often provides mixed results regardless of category setting. Switch to <b>Global</b> or <b>Demo Mode</b> for precise filtering.
          </div>
        )}

      </div>
      <div className="relative">
        <Search className="absolute left-4 top-4 text-slate-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadNews()}
          placeholder={activeRegion === 'thailand' ? "ค้นหาเทรนด์ในไทย..." : "Search international trends..."}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-slate-200 outline-none focus:ring-2 focus:ring-purple-600/50 transition-all font-medium"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px - 4 py - 2 rounded - full text - [10px] font - black uppercase whitespace - nowrap border transition - all ${activeCategory === cat.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'} `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-900/40 rounded-3xl animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, idx) => (
              <div
                key={idx}
                className="group bg-slate-900/60 border border-slate-800 hover:border-purple-600 rounded-[2.5rem] p-8 transition-all cursor-pointer shadow-xl flex flex-col h-full hover:bg-slate-900 transform hover:-translate-y-1"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-purple-600/10 text-purple-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-purple-600/20">{item.category}</span>
                  <span className="text-[10px] font-black text-orange-400 flex items-center gap-1 uppercase tracking-widest"><Flame size={12} fill="currentColor" /> {item.popularity}</span>
                </div>
                <h3 className="text-xl font-black text-white leading-tight mb-4 line-clamp-2 font-kanit group-hover:text-purple-400 transition-colors">{item.headline}</h3>
                <p className="text-sm text-slate-400 line-clamp-3 mb-8 font-medium leading-relaxed font-kanit">{item.summary}</p>
                <div className="mt-auto pt-6 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  <span className="truncate max-w-[150px]">{item.source}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {
        selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-xl p-10 relative shadow-2xl">
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition active:scale-90"><X size={28} /></button>
              <div className="mb-10">
                <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <div className="w-8 h-px bg-purple-500/30"></div>
                  <span>{selectedItem.category} | {activeRegion} News</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-6 font-kanit">{selectedItem.headline}</h3>
                <p className="text-slate-400 text-base leading-relaxed mb-8 font-medium font-kanit">{selectedItem.summary}</p>
              </div>

              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2">Choose Production Format</p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => onSelectTopic(selectedItem.headline, 'video', activeRegion)}
                  className="flex flex-col items-center gap-3 p-8 bg-slate-900 border border-slate-800 hover:border-purple-600 rounded-[2rem] transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition shadow-lg"><Video size={28} /></div>
                  <span className="font-black text-white text-[10px] uppercase tracking-widest">Video</span>
                </button>
                <button
                  onClick={() => onSelectTopic(selectedItem.headline, 'podcast', activeRegion)}
                  className="flex flex-col items-center gap-3 p-8 bg-slate-900 border border-slate-800 hover:border-red-600 rounded-[2rem] transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-600/10 text-red-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition shadow-lg"><Mic size={28} /></div>
                  <span className="font-black text-white text-[10px] uppercase tracking-widest">Podcast</span>
                </button>
                <button
                  onClick={() => onSelectTopic(selectedItem.headline, 'social', activeRegion)}
                  className="flex flex-col items-center gap-3 p-8 bg-slate-900 border border-slate-800 hover:border-pink-600 rounded-[2rem] transition-all group active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl bg-pink-600/10 text-pink-400 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition shadow-lg"><Share2 size={28} /></div>
                  <span className="font-black text-white text-[10px] uppercase tracking-widest">Post</span>
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default TrendingNews;
