
import React, { useState, useRef } from 'react';
import { Scene } from '../types';
import {
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  EyeOff, Eye, Trash2, Image as ImageIcon, Mic,
  Play, Pause, SkipForward, AlertTriangle, Video as VideoIcon, Download,
  Film, Search, Sparkles, PlusCircle
} from 'lucide-react';
import { MOCK_STOCK_VIDEOS } from '../services/stockService';

interface SceneManagerProps {
  scenes: Scene[];
  onRegenerate: (scene: Scene) => void;
  onToggleSkip: (sceneId: number) => void;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  isProcessingAll: boolean;
  onAddScene?: () => void;
  onDeleteScene?: (id: number) => void;
}

const SceneManager: React.FC<SceneManagerProps> = ({
  scenes,
  onRegenerate,
  onToggleSkip,
  onUpdateScene,
  isProcessingAll,
  onAddScene,
  onDeleteScene
}) => {
  const completedCount = scenes.filter(s => s.status === 'completed').length;
  const skippedCount = scenes.filter(s => s.status === 'skipped').length;
  const failedCount = scenes.filter(s => s.status === 'failed').length;

  const [playingId, setPlayingId] = useState<number | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopPreview = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) { }
      activeSourceRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePreviewAudio = async (scene: Scene) => {
    if (playingId === scene.id) {
      stopPreview();
      return;
    }
    stopPreview();

    if (!scene.audioBuffer) return;

    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = scene.audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setPlayingId(null);

    activeSourceRef.current = source;
    setPlayingId(scene.id);
    source.start();
  };

  const handleDownloadAudio = (scene: Scene) => {
    if (!scene.audioBase64) return;
    const link = document.createElement('a');
    link.href = `data:audio/pcm;base64,${scene.audioBase64}`;
    link.download = `scene-${scene.id}-audio.pcm`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Timeline Manager
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage your AI visual assets and narration flow.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] font-black text-slate-600 uppercase">Assets</span>
            <span className="text-lg font-bold text-green-500">{completedCount}</span>
          </div>
          <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] font-black text-slate-600 uppercase">Skipped</span>
            <span className="text-lg font-bold text-slate-400">{skippedCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {scenes.map((scene, idx) => {
          const isSkipped = scene.status === 'skipped';
          const isFailed = scene.status === 'failed';
          const isGenerating = scene.status === 'generating';
          const isCompleted = scene.status === 'completed';
          const hasMotion = !!scene.videoUrl;
          const hasAudio = !!scene.audioBuffer;

          return (
            <div
              key={scene.id}
              className={`group flex flex-col xl:flex-row gap-6 bg-slate-900/40 border rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden ${isSkipped ? 'opacity-60 grayscale-[0.5] border-slate-800' :
                isFailed ? 'border-red-500/40 bg-red-500/5' :
                  isGenerating ? 'border-purple-500/40 bg-purple-500/5' :
                    isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-slate-800'
                }`}
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {hasMotion && isCompleted && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-500/20 shadow-sm animate-pulse">
                    <VideoIcon size={12} /> Motion Ready
                  </span>
                )}
                {isCompleted && <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-full border border-green-500/20"><CheckCircle2 size={12} /> Ready</span>}
                {isFailed && <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded-full border border-red-500/20"><AlertTriangle size={12} /> Failed</span>}
                {isGenerating && <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase rounded-full border border-purple-500/20"><Loader2 size={12} className="animate-spin" /> Generating</span>}
              </div>

              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {onDeleteScene && (
                  <button
                    onClick={() => onDeleteScene(scene.id)}
                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all border border-red-500/20"
                    title="Delete Scene"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="w-full xl:w-64 shrink-0 flex flex-col gap-3">
                <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 relative shadow-inner group-hover:border-slate-700 transition-colors">
                  {scene.imageUrl || scene.videoUrl ? (
                    <div className="w-full h-full relative">
                      {scene.imageUrl && <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Preview" />}
                      {hasMotion && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none">
                          <Play size={24} className="text-white drop-shadow-lg opacity-60" fill="currentColor" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ImageIcon size={48} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Asset</span>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-purple-500 mb-2" size={32} />
                      <span className="text-[10px] font-black text-purple-300 uppercase animate-pulse">Processing {hasMotion ? 'Video' : 'Image'}...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onRegenerate(scene)}
                    disabled={isGenerating || isProcessingAll}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                    {isFailed ? "Retry" : "Regen"}
                  </button>
                  <button
                    onClick={() => onToggleSkip(scene.id)}
                    disabled={isGenerating}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${isSkipped ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    {isSkipped ? <><Eye size={14} /> Include</> : <><EyeOff size={14} /> Skip</>}
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Media Source Toggle */}
                  <div className="flex gap-2 p-1 bg-slate-950 rounded-lg w-fit border border-slate-800">
                    <button
                      onClick={() => onUpdateScene(scene.id, { mediaSource: 'ai' })}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${!scene.mediaSource || scene.mediaSource === 'ai' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <div className="flex items-center gap-1.5"><Sparkles size={12} /> AI Gen</div>
                    </button>
                    <button
                      onClick={() => onUpdateScene(scene.id, { mediaSource: 'stock' })}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${scene.mediaSource === 'stock' ? 'bg-teal-900/50 text-teal-400 border border-teal-500/50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <div className="flex items-center gap-1.5"><Film size={12} /> Stock Video</div>
                    </button>
                  </div>

                  {(!scene.mediaSource || scene.mediaSource === 'ai') ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                          <ImageIcon size={12} className="text-blue-400" /> Visual Motion Prompt
                        </label>
                      </div>
                      <textarea
                        value={scene.visual_prompt}
                        disabled={isSkipped || isGenerating}
                        onChange={(e) => onUpdateScene(scene.id, { visual_prompt: e.target.value })}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 min-h-[100px] outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none font-medium leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center gap-2 text-teal-400 mb-2">
                        <Search size={14} /> <span className="text-xs font-bold uppercase">Select Stock Footage</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {MOCK_STOCK_VIDEOS.map(video => (
                          <div
                            key={video.id}
                            onClick={() => onUpdateScene(scene.id, {
                              mediaSource: 'stock',
                              stockUrl: video.url,
                              videoUrl: video.url,
                              imageUrl: video.thumbnailUrl, // Use thumb if available
                              status: 'completed' // Mark ready immediately
                            })}
                            className={`relative group cursor-pointer border rounded-xl overflow-hidden aspect-video transition-all ${scene.stockUrl === video.url ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-800 hover:border-slate-600'}`}
                          >
                            <video src={video.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1.5">
                              <p className="text-[9px] text-white font-bold truncate">{video.category}</p>
                            </div>
                            {scene.stockUrl === video.url && (
                              <div className="absolute top-2 right-2 bg-teal-500 text-black p-0.5 rounded-full"><CheckCircle2 size={10} /></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                      <Mic size={12} className="text-indigo-400" /> Narration Script
                    </label>
                    <div className="flex items-center gap-2">
                      {hasAudio && (
                        <>
                          <button
                            onClick={() => handlePreviewAudio(scene)}
                            className={`p-1 bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white rounded transition-all`}
                            title="Play Preview"
                          >
                            {playingId === scene.id ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                          </button>
                          <button
                            onClick={() => handleDownloadAudio(scene)}
                            className={`p-1 bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white rounded transition-all`}
                            title="Download Audio"
                          >
                            <Download size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={scene.voiceover}
                    disabled={isSkipped || isGenerating}
                    onChange={(e) => onUpdateScene(scene.id, { voiceover: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 min-h-[100px] outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none font-kanit leading-relaxed"
                  />
                </div>
              </div>

              {isFailed && scene.error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white px-4 py-1.5 text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle size={10} /> Error: {scene.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onAddScene && (
        <button
          onClick={onAddScene}
          className="w-full py-6 mt-4 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center gap-2 text-slate-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-xs font-black uppercase tracking-widest"
        >
          <PlusCircle size={20} /> Add New Scene
        </button>
      )}
    </div>
  );
};

export default SceneManager;
