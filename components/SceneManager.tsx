
import React, { useState, useRef, useEffect, memo } from 'react';
import { Scene } from '../types';
import {
  Loader2, Trash2, Image as ImageIcon, Mic,
  Play, Pause, Sparkles, UploadCloud,
  ChevronUp, ChevronDown, Wand2,
  Move, Plus, Zap, Timer, Activity, Check, Film, AlertCircle, GripVertical, RefreshCw
} from 'lucide-react';

// --- Interfaces ---

interface SceneManagerProps {
  scenes: Scene[];
  onRegenerate: (scene: Scene) => void;
  onRefinePrompt?: (scene: Scene) => void;
  onAutoStoryboard?: () => void;
  onGenerateAudio?: (scene: Scene) => void;
  onGenerateVisual?: (scene: Scene) => void;
  onToggleSkip: (sceneId: number) => void;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  onReorder?: (sceneId: number, direction: 'up' | 'down') => void;
  onDragReorder?: (startIndex: number, endIndex: number) => void;
  onAddScene?: () => void;
  onDelete?: (sceneId: number) => void;
  isProcessingAll: boolean;
}

interface SceneCardProps {
  scene: Scene;
  index: number;
  totalScenes: number;
  isDragging: boolean;
  isOver: boolean;
  draggedIdx: number | null;
  playingId: number | null;
  onPreviewAudio: (scene: Scene) => void;
  onUpdate: (id: number, updates: Partial<Scene>) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRegenerate: (scene: Scene) => void;
  onRefine: (scene: Scene) => void;
  onToggleSkip: (id: number) => void;
  onDelete?: (id: number) => void;
  onReorder?: (id: number, dir: 'up' | 'down') => void;
}

// --- Sub-Component: SceneCard (Redesigned for Stealth Theme) ---

const SceneCard = memo(({
  scene, index, totalScenes, isDragging, isOver, draggedIdx, playingId,
  onPreviewAudio, onUpdate, onDragStart, onDragOver, onDrop, onDragEnd,
  onRegenerate, onRegenerateScene, onRefine, onToggleSkip, onDelete, onReorder
}: SceneCardProps & { onRegenerateScene?: (scene: Scene) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isSkipped = scene.status === 'skipped';
  const isGenerating = scene.status === 'generating';
  const isFailed = scene.status === 'failed';
  const hasAudio = !!scene.audioBase64 || !!scene.audioBuffer;
  const isAudioSynth = isGenerating && scene.assetStage === 'audio';
  const isVisualSynth = isGenerating && scene.assetStage === 'visual';
  const hasVisual = !!scene.imageUrl || !!scene.videoUrl;
  const progress = scene.processingProgress || 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      console.log("File selected:", file.name, file.type);
      const isVideo = file.type.startsWith('video/');

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        console.log("File read complete. Length:", result.length);
        if (isVideo) {
          onUpdate(scene.id, { videoUrl: result, imageUrl: undefined, status: 'completed' });
        } else {
          onUpdate(scene.id, { imageUrl: result, videoUrl: undefined, status: 'completed' });
        }
        e.target.value = '';
      };
      reader.onerror = (err) => console.error("File Read Error:", err);
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload Handler Error:", err);
    }
  };

  const handleRefineClick = async () => {
    setIsRefining(true);
    await onRefine(scene);
    setIsRefining(false);
  };

  const handleRegenerateSceneClick = async () => {
    if (!onRegenerateScene) return;
    setIsRegenerating(true);
    await onRegenerateScene(scene);
    setIsRegenerating(false);
  };

  return (
    <div
      draggable={!isGenerating}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`relative group/scene transition-all duration-500 
        ${isOver && draggedIdx !== null && draggedIdx !== index ? (draggedIdx < index ? 'pb-12' : 'pt-12') : ''} 
        ${isDragging ? 'opacity-10 scale-[0.98]' : 'opacity-100'} 
        ${isSkipped ? 'grayscale opacity-40' : ''}`}
    >
      <div className={`bg-[#0d0d0d] border ${isGenerating ? 'border-[#C5A059]/50 shadow-[0_0_30px_rgba(197,160,89,0.15)]' : isDragging ? 'border-purple-500/20' : 'border-white/5'} p-4 rounded-[2rem] hover:border-white/10 transition-all flex flex-col md:flex-row gap-5 relative overflow-hidden`}>

        {/* Progress Strip (Integrated) */}
        {isGenerating && (
          <div className="absolute top-0 left-0 h-0.5 bg-[#C5A059]/20 w-full">
            <div className="h-full bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,1)] transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {/* Left Control Column (Slim) */}
        <div className="flex flex-row md:flex-col items-center justify-center gap-4 px-1 border-r border-white/5 shrink-0 opacity-40 group-hover/scene:opacity-100 transition-opacity">
          <div className="cursor-grab active:cursor-grabbing p-1 hover:text-[#C5A059] transition-colors"><GripVertical size={20} /></div>
          <div className="flex flex-col gap-1">
            <button onClick={() => onReorder?.(scene.id, 'up')} disabled={index === 0 || isGenerating} className="p-1 hover:text-[#C5A059] disabled:opacity-0"><ChevronUp size={14} /></button>
            <button onClick={() => onReorder?.(scene.id, 'down')} disabled={index === totalScenes - 1 || isGenerating} className="p-1 hover:text-[#C5A059] disabled:opacity-0"><ChevronDown size={14} /></button>
          </div>
        </div>

        {/* Media Preview (Compact) */}
        <div className="w-full md:w-44 aspect-video rounded-2xl bg-black border border-white/5 relative overflow-hidden shrink-0 group/preview shadow-inner">
          {scene.videoUrl ? (
            <video src={scene.videoUrl} className="w-full h-full object-cover" />
          ) : scene.imageUrl ? (
            <img src={scene.imageUrl} className="w-full h-full object-cover" alt="Scene" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900/50">
              {isGenerating ? (
                <Loader2 size={24} className="text-[#C5A059] animate-spin" />
              ) : <ImageIcon size={24} className="text-neutral-800" />}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white/10 rounded-full text-white hover:bg-[#C5A059] hover:text-black transition transform active:scale-90">
              <UploadCloud size={16} />
            </button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Node #{index + 1}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${hasAudio ? 'bg-emerald-500' : 'bg-neutral-800'}`} title="Audio Status"></div>
                <div className={`w-1.5 h-1.5 rounded-full ${hasVisual ? 'bg-blue-500' : 'bg-neutral-800'}`} title="Visual Status"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFailed && <AlertCircle size={14} className="text-red-500" />}
              <button onClick={() => onToggleSkip(scene.id)} className={`p-1.5 rounded-lg transition-colors ${isSkipped ? 'text-red-500' : 'text-neutral-600 hover:text-white hover:bg-white/5'}`}><Film size={16} /></button>
              {onDelete && <button onClick={() => onDelete(scene.id)} className="p-1.5 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="relative group/vox">
              <textarea
                value={scene.voiceover}
                onChange={(e) => onUpdate(scene.id, { voiceover: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pr-10 text-[12px] text-neutral-300 font-kanit min-h-[120px] outline-none focus:border-[#C5A059]/30 resize-y shadow-inner"
                placeholder="Dialogue segment..."
              />
              <button
                onClick={handleRegenerateSceneClick}
                className="absolute right-2 top-2 p-1.5 bg-neutral-900 rounded-lg text-neutral-500 hover:text-[#C5A059] transition-all border border-white/5 opacity-0 group-hover/vox:opacity-100"
                title="Regenerate Script & Prompt"
              >
                {isRegenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={scene.visual_prompt}
                onChange={(e) => onUpdate(scene.id, { visual_prompt: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pr-10 text-[10px] text-neutral-500 italic font-medium min-h-[80px] outline-none focus:border-blue-500/30 resize-none shadow-inner scrollbar-hide"
                placeholder="Visual DNA parameters..."
              />
              <button
                onClick={handleRefineClick}
                disabled={isRefining}
                className="absolute right-2 top-2 p-1.5 bg-neutral-900 rounded-lg text-neutral-500 hover:text-[#C5A059] transition-colors border border-white/5"
                title="Refine Visual Prompt"
              >
                {isRefining ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} />}
              </button>
            </div>
          </div>

          {/* Compact Status Bar & Action */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPreviewAudio(scene)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${playingId === scene.id ? 'bg-red-600 text-white' : hasAudio ? 'bg-white/5 text-neutral-400 hover:bg-white/10' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  }`}
              >
                {playingId === scene.id ? <Pause size={10} fill="currentColor" /> : hasAudio ? <Play size={10} fill="currentColor" /> : <Mic size={10} />}
                {playingId === scene.id ? 'Monitoring' : hasAudio ? 'Listen' : 'Synth VO'}
              </button>
              {(isGenerating || isRegenerating) && (
                <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-tighter animate-pulse flex items-center gap-1.5">
                  <Activity size={10} /> {scene.statusDetail || 'Processing...'}
                </span>
              )}
            </div>

            <button
              onClick={() => onRegenerate(scene)}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isGenerating ? 'bg-neutral-800 text-neutral-600' : 'bg-[#C5A059] text-black hover:bg-[#d4af37] shadow-lg shadow-[#C5A059]/10'
                }`}
            >
              {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {isGenerating ? 'Synthesizing' : 'Produce Node'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.scene.id === next.scene.id &&
    prev.scene.voiceover === next.scene.voiceover &&
    prev.scene.visual_prompt === next.scene.visual_prompt &&
    prev.scene.status === next.scene.status &&
    prev.scene.processingProgress === next.scene.processingProgress &&
    prev.scene.videoUrl === next.scene.videoUrl &&
    prev.scene.imageUrl === next.scene.imageUrl &&
    prev.playingId === next.playingId &&
    prev.isDragging === next.isDragging &&
    prev.isOver === next.isOver &&
    prev.index === next.index
  );
});

// --- Main Component: SceneManager (Stealth Theme Wrapper) ---

const SceneManager: React.FC<SceneManagerProps> = ({
  scenes, onRegenerate, onRefinePrompt, onAutoStoryboard, onGenerateAudio,
  onToggleSkip, onUpdateScene, onReorder, onDragReorder, onAddScene,
  onDelete
}) => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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
    if (playingId === scene.id) { stopPreview(); return; }
    if (!scene.audioBuffer && onGenerateAudio) { onGenerateAudio(scene); return; }
    if (!scene.audioBuffer) return;

    stopPreview();
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = scene.audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setPlayingId(null);
    activeSourceRef.current = source;
    setPlayingId(scene.id);
    source.start();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    setDragOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx !== null && onDragReorder && draggedIdx !== index) {
      onDragReorder(draggedIdx, index);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-6">
      {/* Mini Dashboard Wrapper */}
      <div className="flex items-center justify-between bg-black border border-white/5 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 pointer-events-none"><Activity size={80} /></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#C5A059] border border-white/5"><Zap size={20} fill="currentColor" /></div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Logic Pipeline</h3>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.2em]">{scenes.length} Production Clusters Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {onAutoStoryboard && (
            <button onClick={onAutoStoryboard} className="px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-all">AI Storyboard</button>
          )}
          {onAddScene && (
            <button onClick={onAddScene} className="flex items-center gap-2 px-5 py-2 bg-white/5 text-white border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg">
              <Plus size={14} /> New Node
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-4" onDragLeave={() => setDragOverIdx(null)}>
        {scenes.map((scene, idx) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={idx}
            totalScenes={scenes.length}
            isDragging={draggedIdx === idx}
            isOver={dragOverIdx === idx}
            draggedIdx={draggedIdx}
            playingId={playingId}
            onPreviewAudio={handlePreviewAudio}
            onUpdate={onUpdateScene}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={() => setDraggedIdx(null)}
            onRegenerate={onRegenerate}
            onRefine={onRefinePrompt!}
            onToggleSkip={onToggleSkip}
            onDelete={onDelete}
            onReorder={onReorder}
          />
        ))}

        {onAddScene && (
          <button
            onClick={onAddScene}
            className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] text-neutral-700 hover:text-[#C5A059] hover:border-[#C5A059]/30 hover:bg-[#C5A059]/5 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <Plus size={24} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Append Production Cluster</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SceneManager;
