
import React, { useState } from 'react';
import { ScriptData } from '../types';
import { generateThumbnail } from '../services/geminiService';
import { Copy, Check, FileText, Hash, Search, Zap, ListChecks, ArrowRight, Clock, Image as ImageIcon, Loader2, Download, Sparkles } from 'lucide-react';

interface MetadataManagerProps {
  metadata: ScriptData;
}

const MetadataManager: React.FC<MetadataManagerProps> = ({ metadata }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(metadata.thumbnailUrl || null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAll = () => {
    const allText = `TITLE: ${metadata.seoTitle}\n\nDESCRIPTION:\n${metadata.longDescription}\n\nHASHTAGS:\n${metadata.hashtags.map(h => `#${h}`).join(' ')}\n\nKEYWORDS:\n${metadata.seoKeywords}`;
    handleCopy(allText, 'all');
  };

  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumbnail(true);
    try {
      const img = await generateThumbnail(metadata.title);
      setThumbnailUrl(img);
      metadata.thumbnailUrl = img; // Persist for session
    } catch (err) {
      alert("Thumbnail generation failed. Try again.");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const hashtagString = metadata.hashtags.map(h => `#${h}`).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Viral SEO Suite</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated metadata for maximum algorithm reach.</p>
          </div>
        </div>
        
        <button 
          onClick={copyAll}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 ${
            copiedSection === 'all' 
              ? 'bg-green-600 text-white' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20'
          }`}
        >
          {copiedSection === 'all' ? <Check size={16}/> : <Copy size={16}/>}
          {copiedSection === 'all' ? 'Copied All' : 'Copy All Assets'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Title & Article */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} className="text-blue-400" /> Viral Catchy Title
              </label>
              <button onClick={() => handleCopy(metadata.seoTitle, 'title')} className="text-slate-500 hover:text-white transition p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                {copiedSection === 'title' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
              </button>
            </div>
            <p className="text-lg font-bold text-white leading-tight font-kanit">{metadata.seoTitle}</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ListChecks size={12} className="text-emerald-400" /> 500+ Word Description (SEO Article)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-600 font-mono">{metadata.longDescription.split(/\s+/).length} words</span>
                <button onClick={() => handleCopy(metadata.longDescription, 'desc')} className="text-slate-500 hover:text-white transition p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  {copiedSection === 'desc' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                </button>
              </div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-kanit">{metadata.longDescription}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Thumbnail, Hashtags & Keywords */}
        <div className="space-y-6">
          {/* New: Cinematic Thumbnail Generator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ImageIcon size={100} />
             </div>
             <div className="flex items-center justify-between relative z-10">
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-widest">Viral Thumbnail (16:9)</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">8K Cinematic Masterpiece Style</p>
                </div>
                <button 
                   onClick={handleGenerateThumbnail}
                   disabled={isGeneratingThumbnail}
                   className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                   {isGeneratingThumbnail ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                   {isGeneratingThumbnail ? 'Creating Masterpiece...' : 'Generate AI Thumbnail'}
                </button>
             </div>

             <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center group">
                {thumbnailUrl ? (
                   <>
                      <img src={thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="AI Thumbnail" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <a 
                           href={thumbnailUrl} 
                           download={`thumbnail-${Date.now()}.png`} 
                           className="p-3 bg-white text-slate-900 rounded-full shadow-xl hover:scale-110 transition active:scale-90"
                           title="Download Image"
                         >
                            <Download size={20} />
                         </a>
                      </div>
                   </>
                ) : (
                   <div className="flex flex-col items-center gap-3 opacity-20">
                      <ImageIcon size={48} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Thumbnail Preview</span>
                   </div>
                )}
                {isGeneratingThumbnail && (
                   <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-red-500 mb-2" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Rendering Cinematic 8K...</span>
                   </div>
                )}
             </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hash size={12} className="text-pink-400" /> Trending Hashtags (500+)
              </label>
              <button onClick={() => handleCopy(hashtagString, 'tags')} className="text-slate-500 hover:text-white transition p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                {copiedSection === 'tags' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {metadata.hashtags.map((tag, i) => (
                <span key={i} className="text-[10px] font-bold text-pink-400 bg-pink-500/5 border border-pink-500/10 px-2 py-1 rounded-lg">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Search size={12} className="text-indigo-400" /> 700+ SEO Keyword Cluster
              </label>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] text-slate-600 font-mono">{metadata.seoKeywords.length} chars</span>
                 <button onClick={() => handleCopy(metadata.seoKeywords, 'keywords')} className="text-slate-500 hover:text-white transition p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  {copiedSection === 'keywords' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                </button>
              </div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 text-[10px] text-slate-500 font-mono leading-relaxed break-words max-h-[150px] overflow-y-auto">
              {metadata.seoKeywords}
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
              <Zap size={14} className="text-blue-400 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-blue-400 font-bold uppercase">Algorithm Tip:</span> Use these keywords in the video's 'Tags' section to maximize reach across YouTube and TikTok search results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataManager;
