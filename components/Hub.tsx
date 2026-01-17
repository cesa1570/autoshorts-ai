import React, { useEffect, useState } from 'react';
import {
  Video, Smartphone, MoveRight, Grid, Mic, Clock, FileText, Trash2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DraftService } from '../services/draftService';
import { Draft } from '../types';

interface HubProps {
  onNavigate: (tab: 'create' | 'long' | 'podcast') => void;
  onResume: (draft: Draft) => void;
}

const Hub: React.FC<HubProps> = ({ onNavigate, onResume }) => {
  const { userId } = useApp();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    setDrafts(DraftService.getAll(userId));
  }, [userId]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    DraftService.delete(id);
    setDrafts(DraftService.getAll(userId));
  };

  const getPreviewImage = (draft: Draft) => {
    // 1. Check direct preview image (from DraftService extraction)
    if (draft.previewImageUrl) return draft.previewImageUrl;

    // 2. Fallback to extracting from data (for legacy drafts that haven't been re-saved)
    if (draft.type === 'podcast') {
      const scenes = draft.data.scenes || [];
      if (scenes.length > 0 && scenes[0].imageUrl) return scenes[0].imageUrl;
    } else {
      const scenes = draft.data.script?.scenes || [];
      const validScene = scenes.find((s: any) => s.imageUrl || s.videoUrl);
      if (validScene) return validScene.imageUrl || validScene.videoUrl;
    }
    return null;
  };

  return (
    <div className="min-h-[80vh] bg-transparent text-white font-kanit">
      <div className="max-w-7xl mx-auto space-y-20">

        {/* Header Section */}
        <div className="space-y-6 relative">
          <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-[#C5A059]/5 blur-[120px] rounded-full pointer-events-none" />
          <h1 className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter leading-none">
            Lazy <br /> Auto <span className="text-[#C5A059]">.</span>
          </h1>
          <p className="text-lg text-neutral-500 font-light tracking-[0.4em] uppercase max-w-2xl">
            Autonomous Content Engineering Suite
          </p>
        </div>

        {/* Main Tools Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {/* 1. Shorts Creator */}
          <div
            onClick={() => onNavigate('create')}
            className="group relative bg-[#090909] border border-white/5 hover:border-[#C5A059]/40 rounded-xl p-4 cursor-pointer transition-all duration-500 hover:shadow-[0_0_20px_rgba(197,160,89,0.1)] hover:-translate-y-1 overflow-hidden flex flex-col items-center justify-center gap-3 aspect-square"
          >
            <div className="text-[#C5A059] transition-all duration-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(197,160,89,0.5)] relative z-10 flex flex-col items-center">
              <Smartphone size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-600 group-hover:text-white transition-colors relative z-10 text-center">Vertical</span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#C5A059] scale-x-0 group-hover:scale-x-50 transition-transform duration-500 opacity-50" />
          </div>

          {/* 2. Long Video Creator */}
          <div
            onClick={() => onNavigate('long')}
            className="group relative bg-[#090909] border border-white/5 hover:border-[#C5A059]/40 rounded-xl p-4 cursor-pointer transition-all duration-500 hover:shadow-[0_0_20px_rgba(197,160,89,0.1)] hover:-translate-y-1 overflow-hidden flex flex-col items-center justify-center gap-3 aspect-square"
          >
            <div className="text-[#C5A059] transition-all duration-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(197,160,89,0.5)] relative z-10 flex flex-col items-center">
              <Video size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-600 group-hover:text-white transition-colors relative z-10 text-center">Cinema</span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#C5A059] scale-x-0 group-hover:scale-x-50 transition-transform duration-500 opacity-50" />
          </div>

          {/* 3. Podcast Studio */}
          <div
            onClick={() => onNavigate('podcast')}
            className="group relative bg-[#090909] border border-white/5 hover:border-[#C5A059]/40 rounded-xl p-4 cursor-pointer transition-all duration-500 hover:shadow-[0_0_20px_rgba(197,160,89,0.1)] hover:-translate-y-1 overflow-hidden flex flex-col items-center justify-center gap-3 aspect-square"
          >
            <div className="text-[#C5A059] transition-all duration-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(197,160,89,0.5)] relative z-10 flex flex-col items-center">
              <Mic size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-600 group-hover:text-white transition-colors relative z-10 text-center">Podcast</span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#C5A059] scale-x-0 group-hover:scale-x-50 transition-transform duration-500 opacity-50" />
          </div>
        </div>

        {/* Recent Drafts Section */}
        {drafts.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center gap-4 text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em]">
              <div className="h-px w-10 bg-[#C5A059]/30"></div>
              <span>History Log</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map(draft => {
                const previewImg = getPreviewImage(draft);
                return (
                  <div
                    key={draft.id}
                    onClick={() => onResume(draft)}
                    className="group bg-[#0f0f0f] border border-white/5 hover:border-[#C5A059]/30 p-6 rounded-2xl cursor-pointer hover:bg-[#151515] transition-all flex items-start gap-4 relative overflow-hidden"
                  >
                    {/* Background glow for preview */}
                    {previewImg && (
                      <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                        <img src={previewImg} alt="" className="w-full h-full object-cover blur-xl scale-150" />
                      </div>
                    )}

                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-[#C5A059] transition-all shrink-0 overflow-hidden border border-white/5 relative z-10 group-hover:scale-105 duration-500">
                      {previewImg ? (
                        <img src={previewImg} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          {draft.type === 'shorts' && <Smartphone size={24} />}
                          {draft.type === 'long' && <Video size={24} />}
                          {draft.type === 'podcast' && <Mic size={24} />}
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-[#C5A059]">{draft.type} Node</span>
                        <span className="text-[10px] font-mono text-neutral-700">{new Date(draft.lastModified).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-white font-bold truncate pr-2 mb-1 group-hover:text-[#C5A059] transition-colors">{draft.title || 'Untitled Operation'}</h4>
                      <p className="text-neutral-500 text-xs truncate">{draft.subtitle || 'No details logged'}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, draft.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all relative z-10"
                      title="Delete Draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hub;
