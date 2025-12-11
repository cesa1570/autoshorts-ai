import React, { useEffect, useState } from 'react';
import { Newspaper, Flame, ArrowRight, RefreshCw, Loader2, Globe, MapPin, Clock, ExternalLink, Video, Share2, X, Plus } from 'lucide-react';
import { fetchTrendingNews } from '../services/geminiService';
import { NewsItem } from '../types';

interface TrendingNewsProps {
  onSelectTopic: (topic: string, type: 'video' | 'social') => void;
  apiKey?: string;
}

const TrendingNews: React.FC<TrendingNewsProps> = ({ onSelectTopic, apiKey }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeRegion, setActiveRegion] = useState<'global' | 'thailand'>('global');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  const loadNews = async (isLoadMore: boolean = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const items = await fetchTrendingNews(apiKey, activeRegion);
      
      if (isLoadMore) {
        // Prevent duplicates based on headline
        setNews(prev => {
           const existingHeadlines = new Set(prev.map(i => i.headline));
           const uniqueNewItems = items.filter(i => !existingHeadlines.has(i.headline));
           return [...prev, ...uniqueNewItems];
        });
      } else {
        setNews(items);
      }
    } catch (error) {
      console.error("Failed to load news", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNews(false);
  }, [apiKey, activeRegion]); 

  return (
    <div className="space-y-6 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-500" /> Google Trends / Hot News
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Pick a viral topic to instantly generate content.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
             <button 
                onClick={() => setActiveRegion('global')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${activeRegion === 'global' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <Globe size={16} /> Global
             </button>
             <button 
                onClick={() => setActiveRegion('thailand')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${activeRegion === 'thailand' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <MapPin size={16} className="text-red-400" /> Thailand
             </button>
          </div>

          <button 
            onClick={() => loadNews(false)}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white border border-slate-600"
            title="Refresh News"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className="group bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-purple-900/20 relative"
                  onClick={() => setSelectedItem(item)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded font-medium border border-purple-500/20">
                        {item.category}
                      </span>
                      <span className="text-xs text-orange-400 flex items-center gap-1">
                        <Flame size={12} /> {item.popularity}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-purple-300 transition-colors">
                      {item.headline}
                    </h3>
                    
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                      {item.summary}
                    </p>

                    {/* Source & Date Info */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 border-t border-slate-700/50 pt-3">
                       <span className="flex items-center gap-1">
                          <ExternalLink size={10} /> {item.source || 'Unknown Source'}
                       </span>
                       <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                       <span className="flex items-center gap-1">
                          <Clock size={10} /> {item.date || 'Today'}
                       </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 flex items-center justify-center text-sm font-medium text-slate-500 group-hover:text-white transition-colors border-t border-slate-700/30 border-dashed">
                    Tap to Create
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            <div className="flex justify-center pt-4 pb-8">
                <button
                    onClick={() => loadNews(true)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-xl"
                >
                    {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    {loadingMore ? 'Fetching More News...' : 'Load More Topics'}
                </button>
            </div>
        </>
      )}

      {/* Action Selection Modal */}
      {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl transform scale-100 transition-all">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800 relative">
                   <h3 className="text-xl font-bold text-white pr-8 leading-snug">
                      {selectedItem.headline}
                   </h3>
                   <button 
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-white transition bg-slate-800 rounded-full p-1"
                   >
                      <X size={20} />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                   <p className="text-slate-400 text-sm mb-6 text-center">
                      What would you like to create with this topic?
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4">
                      {/* Create Video Option */}
                      <button 
                         onClick={() => onSelectTopic(selectedItem.headline, 'video')}
                         className="group flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 hover:bg-purple-900/20 border border-slate-700 hover:border-purple-500 rounded-xl transition-all"
                      >
                         <div className="w-12 h-12 rounded-full bg-purple-500/10 group-hover:bg-purple-500 text-purple-400 group-hover:text-white flex items-center justify-center transition-colors">
                             <Video size={24} />
                         </div>
                         <div className="text-center">
                             <span className="block font-bold text-white group-hover:text-purple-300">Short Video</span>
                             <span className="text-xs text-slate-500">Reels / TikTok Script & Assets</span>
                         </div>
                      </button>

                      {/* Create Social Post Option */}
                      <button 
                         onClick={() => onSelectTopic(selectedItem.headline, 'social')}
                         className="group flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 hover:bg-pink-900/20 border border-slate-700 hover:border-pink-500 rounded-xl transition-all"
                      >
                         <div className="w-12 h-12 rounded-full bg-pink-500/10 group-hover:bg-pink-500 text-pink-400 group-hover:text-white flex items-center justify-center transition-colors">
                             <Share2 size={24} />
                         </div>
                         <div className="text-center">
                             <span className="block font-bold text-white group-hover:text-pink-300">Social Post</span>
                             <span className="text-xs text-slate-500">Caption & AI Image Prompt</span>
                         </div>
                      </button>
                   </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/50 rounded-b-2xl border-t border-slate-800 text-center">
                   <span className="text-xs text-slate-500">
                      Powered by Gemini 2.5 Flash
                   </span>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default TrendingNews;