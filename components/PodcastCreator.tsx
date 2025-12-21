
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, GeneratorMode, Scene } from '../types';
import { generateScript, generatePodcastAudio, generateVideoForScene, generateImageForScene, ERR_INVALID_KEY } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';
import { useApp } from '../App';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import { saveProject, listProjects, deleteProject, ProjectData, exportProjectToJson } from '../services/projectService';
import { 
  Mic, Wand2, Play, Pause, SkipBack, Loader2, AlertCircle, 
  Coffee, Headphones, MessageSquare, Volume2, Download,
  CheckCircle2, RefreshCw, GripVertical, AlignLeft, LogOut,
  Image as ImageIcon, Music, Trash2, Volume1, Save, FolderOpen,
  PlusCircle, History, Clock, ChevronRight, FileJson, Settings,
  Cloud, CloudOff, FileEdit, Video as VideoIcon, Sparkles, X,
  Activity, List, Timer
} from 'lucide-react';

interface PodcastCreatorProps {
  initialTopic?: string;
  initialLanguage?: 'Thai' | 'English';
}

const PodcastCreator: React.FC<PodcastCreatorProps> = ({ initialTopic, initialLanguage = 'Thai' }) => {
  const { openKeySelection, hasSelectedKey, resetKeyStatus } = useApp();
  const [state, setState] = useState<ProjectState>({
    status: 'idle',
    topic: initialTopic || '',
    script: null,
    currentStep: '',
  });

  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage);
  const [duration, setDuration] = useState(10);
  const [voiceA, setVoiceA] = useState('Kore');
  const [voiceB, setVoiceB] = useState('Puck');
  const [selectedVisualModel, setSelectedVisualModel] = useState<string>('veo-3.1-fast-generate-preview');
  const [introText, setIntroText] = useState('');
  const [outroText, setOutroText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [playingPreviewId, setPlayingPreviewId] = useState<number | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [audioBuffers, setAudioBuffers] = useState<Map<number, AudioBuffer>>(new Map());
  const [cooldown, setCooldown] = useState(0);
  
  // Project Management States
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'draft' | 'saving' | 'saved'>('draft');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const lastSaveRef = useRef<number>(Date.now());
  
  // BGM States
  const [bgmBuffer, setBgmBuffer] = useState<AudioBuffer | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string | undefined>(undefined);
  const [bgmName, setBgmName] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.15);
  
  // Drag and Drop States
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);

  const refreshProjectList = async () => {
    const projects = await listProjects('podcast');
    setSavedProjects(projects);
  };

  useEffect(() => {
    refreshProjectList();
  }, [saveStatus]);

  useEffect(() => {
    if (initialTopic) setState(prev => ({ ...prev, topic: initialTopic }));
    if (initialLanguage) setLanguage(initialLanguage);
  }, [initialTopic, initialLanguage]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Track changes to trigger auto-save or draft status
  useEffect(() => {
    if (state.script || state.topic) {
      setSaveStatus(prev => prev === 'saved' ? 'draft' : prev);
    }
  }, [state.topic, state.script, language, duration, voiceA, voiceB, introText, outroText, bgmName, bgmVolume, selectedVisualModel]);

  // Auto-save logic
  useEffect(() => {
    if (!autoSaveEnabled || !state.script) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current > 30000 && saveStatus === 'draft') {
        handleSaveProject();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, state, language, duration, voiceA, voiceB, introText, outroText, bgmName, bgmVolume, saveStatus]);

  const handleError = async (error: any) => {
    if (error.code === ERR_INVALID_KEY) {
      resetKeyStatus();
      await openKeySelection();
    }
    setState(prev => ({ ...prev, status: 'error', error: error.message }));
  };

  const handleSaveProject = async () => {
    if (!state.script && !state.topic) return;
    setSaveStatus('saving');
    
    const projectId = state.id || `podcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const projectTitle = state.script?.title || state.topic || "Untitled Podcast";
    
    const project: ProjectData = {
      id: projectId,
      type: 'podcast',
      title: projectTitle,
      topic: state.topic,
      lastUpdated: Date.now(),
      config: {
        language,
        duration,
        voiceA,
        voiceB,
        selectedVisualModel,
        introText,
        outroText,
        bgmName,
        bgmVolume
      },
      script: state.script
    };

    try {
      await saveProject(project);
      lastSaveRef.current = Date.now();
      setState(prev => ({ ...prev, id: projectId }));
      setSaveStatus('saved');
    } catch (err) {
      console.error("Save failed", err);
      setSaveStatus('draft');
    }
  };

  const handleLoadProject = async (project: ProjectData) => {
    stopAudio();
    
    setState({
      id: project.id,
      status: 'idle',
      topic: project.topic,
      script: project.script,
      currentStep: ''
    });

    setLanguage(project.config.language);
    setDuration(project.config.duration);
    setVoiceA(project.config.voiceA);
    setVoiceB(project.config.voiceB);
    setSelectedVisualModel(project.config.selectedVisualModel || 'gemini-2.5-flash-image');
    setIntroText(project.config.introText || '');
    setOutroText(project.config.outroText || '');
    setBgmName(project.config.bgmName || null);
    setBgmVolume(project.config.bgmVolume || 0.15);
    setBgmBuffer(null); 
    setBgmUrl(undefined);
    
    const restoredBuffers = new Map<number, AudioBuffer>();
    if (project.script?.scenes) {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      
      await Promise.all(project.script.scenes.map(async (scene: any) => {
        if (scene.audioBase64) {
          try {
            const buffer = await decodeAudioData(scene.audioBase64, ctx);
            restoredBuffers.set(scene.id, buffer);
          } catch (e) {
            console.error("Failed to restore buffer for scene", scene.id);
          }
        }
      }));
    }
    setAudioBuffers(restoredBuffers);
    setShowHistory(false);
    setSaveStatus('saved');
    lastSaveRef.current = Date.now();
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    await deleteProject(id);
    if (state.id === id) {
      handleNewProject();
    }
    await refreshProjectList();
  };

  const handleNewProject = () => {
    if (state.script && saveStatus !== 'saved' && !confirm("Discard current changes and start a new project?")) return;
    stopAudio();
    setState({ status: 'idle', topic: '', script: null, currentStep: '' });
    setIntroText('');
    setOutroText('');
    setAudioBuffers(new Map());
    setBgmBuffer(null);
    setBgmUrl(undefined);
    setBgmName(null);
    setSaveStatus('draft');
  };

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBgmName(file.name);
    const url = URL.createObjectURL(file);
    setBgmUrl(url);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      try {
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        setBgmBuffer(decodedBuffer);
      } catch (err) {
        alert("Failed to decode audio file.");
        setBgmName(null);
        setBgmUrl(undefined);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearBgm = () => {
    if (bgmUrl) URL.revokeObjectURL(bgmUrl);
    setBgmUrl(undefined);
    setBgmName(null);
    setBgmBuffer(null);
    if (bgmSourceRef.current) {
      try { bgmSourceRef.current.stop(); } catch(e) {}
      bgmSourceRef.current = null;
    }
  };

  const handleGenerateScript = async () => {
    if (!state.topic) return;
    setIsGenerating(true);
    setState(prev => ({ ...prev, status: 'generating_script', error: undefined }));
    try {
      const scriptData = await generateScript(
        state.topic, 
        GeneratorMode.PODCAST, 
        '16:9', 
        language, 
        duration,
        selectedVisualModel,
        introText || undefined,
        outroText || undefined
      );
      scriptData.scenes = scriptData.scenes.map(s => ({ ...s, status: 'pending' }));
      setState(prev => ({ ...prev, script: scriptData, status: 'idle' }));
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const processScene = async (scene: Scene, forceVisual = false, forceAudio = false) => {
    updateScene(scene.id, { status: 'generating', error: undefined });
    try {
      let audioBase64 = scene.audioBase64;
      let buffer = audioBuffers.get(scene.id);
      
      if (!audioBase64 || forceAudio) {
        audioBase64 = await generatePodcastAudio(scene.voiceover, voiceA, voiceB);
        const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        buffer = await decodeAudioData(audioBase64, ctx);
        setAudioBuffers(prev => new Map(prev).set(scene.id, buffer!));
      }

      let imageUrl = scene.imageUrl;
      let videoUrl = scene.videoUrl;
      const isVideoModel = selectedVisualModel.startsWith('veo');

      if (forceVisual || (!imageUrl && !videoUrl)) {
        if (isVideoModel) {
          imageUrl = undefined;
          videoUrl = await generateVideoForScene(scene.visual_prompt, '16:9', selectedVisualModel);
        } else {
          videoUrl = undefined;
          imageUrl = await generateImageForScene(scene.visual_prompt, selectedVisualModel, '16:9');
        }
      }
      
      updateScene(scene.id, { 
        status: 'completed', 
        audioBase64, 
        audioBuffer: buffer,
        imageUrl,
        videoUrl 
      });

      return buffer;
    } catch (err: any) {
      console.error(`Failed to process scene ${scene.id}`, err);
      updateScene(scene.id, { status: 'failed', error: err.message });
      handleError(err);
      throw err;
    }
  };

  const handleRegenerateVisual = async (scene: Scene) => {
    const isPaidModel = selectedVisualModel.includes('pro') || selectedVisualModel.includes('veo');
    if (isPaidModel && !hasSelectedKey) { await openKeySelection(); return; }
    await processScene(scene, true, false);
  };

  const handleRegenerateAudio = async (scene: Scene) => {
    await processScene(scene, false, true);
  };

  const handleGenerateProductionAssets = async () => {
    if (!state.script) return;
    const isPaidModel = selectedVisualModel.includes('pro') || selectedVisualModel.includes('veo');
    if (isPaidModel && !hasSelectedKey) { 
      await openKeySelection(); 
      return; 
    }

    setState(prev => ({ ...prev, status: 'generating_assets' }));
    setShowQueue(true);
    
    try {
      const scenes = state.script.scenes;
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (scene.status === 'completed') continue;
        
        if (i > 0) { 
            setCooldown(45);
            await new Promise(r => setTimeout(r, 45000));
        }
        await processScene(scene);
      }
      setState(prev => ({ ...prev, status: 'ready' }));
      handleSaveProject(); 
    } catch (err: any) {
      handleError(err);
    }
  };

  const updateScene = (sceneId: number, updates: Partial<Scene>) => {
    setState(prev => {
      if (!prev.script) return prev;
      return {
        ...prev,
        script: {
          ...prev.script,
          scenes: prev.script.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
        }
      };
    });
  };

  const stopAudio = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch(e) {}
      activeSourceRef.current = null;
    }
    if (bgmSourceRef.current) {
      try { bgmSourceRef.current.stop(); } catch(e) {}
      bgmSourceRef.current = null;
    }
    setIsPlaying(false);
    setPlayingPreviewId(null);
  };

  const handlePreviewAudio = async (scene: Scene) => {
    if (playingPreviewId === scene.id) {
      stopAudio();
      return;
    }

    stopAudio();

    let buffer = audioBuffers.get(scene.id);
    if (!buffer) {
      try {
        buffer = await processScene(scene, false, true);
      } catch (err) {
        return;
      }
    }

    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buffer!;
    source.connect(ctx.destination);
    source.onended = () => {
      setPlayingPreviewId(null);
    };
    
    activeSourceRef.current = source;
    setPlayingPreviewId(scene.id);
    source.start();
  };

  const handleDownloadSceneAudio = (scene: Scene) => {
    if (!scene.audioBase64) return;
    const link = document.createElement('a');
    link.href = `data:audio/pcm;base64,${scene.audioBase64}`;
    link.download = `scene-${scene.id}-audio.pcm`;
    link.click();
  };

  const playSequence = async (index: number) => {
    if (!state.script || index >= state.script.scenes.length) {
      stopAudio();
      setCurrentSceneIdx(0);
      return;
    }

    setCurrentSceneIdx(index);
    const scene = state.script.scenes[index];
    let buffer = audioBuffers.get(scene.id);

    if (!buffer) {
        try {
            buffer = await processScene(scene);
        } catch (e) {
            playSequence(index + 1);
            return;
        }
    }

    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    if (index === 0 && bgmBuffer && !bgmSourceRef.current) {
      const bSource = ctx.createBufferSource();
      bSource.buffer = bgmBuffer;
      bSource.loop = true;
      const bGain = ctx.createGain();
      bGain.gain.value = bgmVolume;
      bSource.connect(bGain);
      bGain.connect(ctx.destination);
      bSource.start();
      bgmSourceRef.current = bSource;
      bgmGainRef.current = bGain;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (isPlaying) playSequence(index + 1);
    };
    
    activeSourceRef.current = source;
    source.start();
    setIsPlaying(true);
    setPlayingPreviewId(null);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playSequence(currentSceneIdx);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIdx === null) return;
    if (dragOverIdx !== index) setDragOverIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIdx === null || draggedItemIdx === index) {
      handleDragEnd();
      return;
    }
    if (!state.script) return;

    const newScenes = [...state.script.scenes];
    const [removed] = newScenes.splice(draggedItemIdx, 1);
    newScenes.splice(index, 0, removed);

    setState(prev => ({
      ...prev,
      script: prev.script ? { ...prev.script, scenes: newScenes } : null
    }));
    
    if (isPlaying) {
      stopAudio();
      setCurrentSceneIdx(0);
    }
    handleDragEnd();
  };

  const totalAssets = state.script?.scenes.length || 0;
  const completedAssets = state.script?.scenes.filter(s => s.status === 'completed').length || 0;

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Workspace Controls Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800/50 backdrop-blur-sm z-30">
         <button 
           onClick={handleNewProject} 
           className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-lg border border-slate-700"
         >
           <PlusCircle size={14}/> New Workspace
         </button>
         
         <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveProject} 
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition shadow-lg ${
                saveStatus === 'saved' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 
                saveStatus === 'saving' ? 'bg-purple-800 text-purple-300 cursor-wait' :
                'bg-purple-600 text-white hover:bg-purple-500'
              }`}
            >
              {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin"/> : saveStatus === 'saved' ? <CheckCircle2 size={14}/> : <Save size={14}/>}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Workspace Saved' : 'Save Workspace'}
            </button>
            
            <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border transition-all duration-500 ${
              saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              saveStatus === 'saving' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse' :
              'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              {saveStatus === 'saved' ? <Cloud size={12}/> : saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin"/> : <FileEdit size={12}/>}
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}
            </div>
         </div>

         <button 
           onClick={() => setShowHistory(!showHistory)} 
           className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${showHistory ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
         >
           <History size={14}/> Recent Work {savedProjects.length > 0 && <span className="ml-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{savedProjects.length}</span>}
         </button>

         {state.script && (
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${showQueue ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <Activity size={14}/> Download Queue 
              <span className="ml-1 bg-slate-950/50 text-[8px] px-1.5 py-0.5 rounded-full">{completedAssets}/{totalAssets}</span>
            </button>
         )}
         
         <div className="flex-1"></div>

         <div className="flex items-center gap-4 pr-2">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Auto-save</span>
               <button 
                 onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                 className={`w-10 h-5 rounded-full transition-all relative p-1 ${autoSaveEnabled ? 'bg-emerald-500/20' : 'bg-slate-800'}`}
               >
                  <div className={`w-3 h-3 rounded-full transition-all ${autoSaveEnabled ? 'bg-emerald-400 translate-x-5' : 'bg-slate-600 translate-x-0'}`}></div>
               </button>
            </div>
            {state.script && (
               <button 
                 onClick={() => exportProjectToJson({
                   id: state.id || 'export',
                   type: 'podcast',
                   title: state.script?.title || 'Untitled',
                   topic: state.topic,
                   lastUpdated: Date.now(),
                   config: { language, duration, voiceA, voiceB, introText, outroText, bgmName, bgmVolume, selectedVisualModel },
                   script: state.script
                 })}
                 className="p-2 text-slate-500 hover:text-white transition"
                 title="Export Project to JSON"
               >
                  <FileJson size={18}/>
               </button>
            )}
         </div>
      </div>

      {/* Download Queue Drawer */}
      {showQueue && state.script && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 mb-8 overflow-hidden relative z-40">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={16} className="text-orange-400"/> AI Generation Queue (Asset Download Status)
                </h3>
                <button onClick={() => setShowQueue(false)} className="text-slate-500 hover:text-white transition p-2"><X size={20}/></button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
               {state.script.scenes.map((scene, idx) => (
                 <div key={scene.id} className={`flex items-center justify-between p-4 rounded-xl border ${scene.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20' : scene.status === 'generating' ? 'bg-orange-500/5 border-orange-500/20 animate-pulse' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-slate-600 font-mono w-6">#{scene.id}</span>
                       <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest line-clamp-1 max-w-[300px]">Segment: {scene.visual_prompt}</p>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{scene.status === 'completed' ? 'READY' : scene.status === 'generating' ? 'DOWNLOADING ASSETS...' : 'PENDING QUEUE'}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {scene.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500"/> : scene.status === 'generating' ? <Loader2 size={16} className="animate-spin text-orange-500"/> : <Clock size={16} className="text-slate-700"/>}
                    </div>
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4 flex-1 max-w-md">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${(completedAssets/totalAssets)*100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-orange-400">{Math.round((completedAssets/totalAssets)*100)}% PRODUCTION READY</span>
               </div>
               <button 
                 onClick={handleGenerateProductionAssets} 
                 disabled={state.status === 'generating_assets' || completedAssets === totalAssets}
                 className="px-6 py-2 bg-orange-600 text-white text-[10px] font-black uppercase rounded-full hover:bg-orange-500 transition disabled:opacity-30"
               >
                 {state.status === 'generating_assets' ? 'Rendering Queue...' : 'Resume All Downloads'}
               </button>
            </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 mb-8 overflow-hidden relative z-40">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <FolderOpen size={16} className="text-purple-400"/> Project History (Local Studio Storage)
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white transition p-2"><X size={20}/></button>
           </div>
           
           {savedProjects.length === 0 ? (
             <div className="text-center py-12">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest italic">No saved projects found in this studio.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedProjects.map(proj => (
                  <div 
                    key={proj.id} 
                    onClick={() => handleLoadProject(proj)}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl hover:border-purple-600 transition-all cursor-pointer group relative overflow-hidden"
                  >
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                           <Clock size={10}/> {new Date(proj.lastUpdated).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); exportProjectToJson(proj); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition">
                             <FileJson size={12}/>
                          </button>
                          <button onClick={(e) => handleDeleteProject(proj.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition">
                             <Trash2 size={12}/>
                          </button>
                        </div>
                     </div>
                     <h4 className="text-sm font-black text-white line-clamp-1 mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{proj.title}</h4>
                     <p className="text-[10px] text-slate-500 line-clamp-2 italic">{proj.topic}</p>
                     <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase">
                        <span>{proj.config.language}</span>
                        <span>•</span>
                        <span>{proj.config.duration}m</span>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl flex items-start gap-4 animate-in shake duration-300">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <div className="flex-1">
                <p className="text-red-400 font-black uppercase text-xs tracking-widest mb-1">Attention Required</p>
                <p className="text-red-200/80 text-xs font-medium leading-relaxed mb-3">{state.error}</p>
                <button onClick={openKeySelection} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">Configure Key</button>
            </div>
        </div>
      )}

      {cooldown > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
           <Coffee size={20} className="text-blue-400 animate-bounce" />
           <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Cooldown: Waiting {cooldown}s for API stability...</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
                <Mic className="text-red-500" size={24}/>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    Podcast Studio
                    {state.script && (
                      <span className={`text-[8px] px-2 py-0.5 rounded-full border transition-colors ${
                        saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        saveStatus === 'saving' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}
                      </span>
                    )}
                  </h2>
                  {state.script && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Workspace:</span>
                      <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest truncate max-w-[150px]">{state.script.title}</span>
                    </div>
                  )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-black uppercase text-slate-500">
                    Language: <span className="text-red-400 ml-1">{language}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-black uppercase text-slate-500">
                    Duration: <span className="text-red-400 ml-1">{duration}m</span>
                </div>
            </div>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter a deep dive topic..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 pr-36 text-white text-lg font-kanit outline-none shadow-inner focus:ring-2 focus:ring-red-600/30 transition-all" 
              value={state.topic} 
              onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))} 
            />
            <button 
              onClick={handleGenerateScript} 
              disabled={!state.topic || isGenerating} 
              className="absolute right-3 top-3 bottom-3 px-6 bg-red-600 text-white rounded-xl font-black transition flex items-center gap-2 uppercase tracking-widest text-[10px] hover:bg-red-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-900/30"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>}
              <span>Draft Script</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <AlignLeft size={12} className="text-red-500" /> Intro Hook (Speaker 1)
              </label>
              <textarea 
                value={introText} 
                onChange={(e) => setIntroText(e.target.value)} 
                placeholder="Custom intro for the episode..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-kanit outline-none min-h-[80px] resize-none focus:ring-1 focus:ring-red-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <LogOut size={12} className="text-red-500" /> Outro Closing (Speaker 1)
              </label>
              <textarea 
                value={outroText} 
                onChange={(e) => setOutroText(e.target.value)} 
                placeholder="Custom outro/CTA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-kanit outline-none min-h-[80px] resize-none focus:ring-1 focus:ring-red-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Speaker 1 (Host)</label>
              <select value={voiceA} onChange={(e) => setVoiceA(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none">
                <option value="Kore">Kore</option>
                <option value="Charon">Charon</option>
                <option value="Fenrir">Fenrir</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Speaker 2 (Guest)</label>
              <select value={voiceB} onChange={(e) => setVoiceB(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none">
                <option value="Puck">Puck</option>
                <option value="Zephyr">Zephyr</option>
                <option value="Kore">Kore</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Duration</label>
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 h-[48px]">
                {[2, 5, 10].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setDuration(m)} 
                    className={`flex-1 rounded-lg text-[10px] font-black transition-all ${duration === m ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><VideoIcon size={12}/> Visual Style</label>
              <select 
                value={selectedVisualModel} 
                onChange={(e) => setSelectedVisualModel(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none"
              >
                <option value="gemini-2.5-flash-image">Gemini Flash (Images)</option>
                <option value="gemini-3-pro-image-preview">Gemini Pro (HQ Images)</option>
                <option value="veo-3.1-fast-generate-preview">🎥 Veo Fast (Video)</option>
                <option value="veo-3.1-generate-preview">🎬 Veo Pro (HQ Video)</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                 <Music size={10}/> BG Music</label>
               <div className="relative">
                  <input type="file" accept="audio/*" onChange={handleBgmUpload} className="hidden" id="bgm-upload" />
                  <label htmlFor="bgm-upload" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 outline-none flex items-center justify-between cursor-pointer hover:bg-slate-900 transition">
                     <span className="truncate">{bgmName || "Select Music File (MP3/WAV)"}</span>
                     {bgmName ? <Trash2 size={12} className="text-red-500" onClick={(e) => { e.preventDefault(); clearBgm(); }} /> : <Music size={12} />}
                  </label>
               </div>
            </div>
          </div>
          
          {bgmBuffer && (
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <Volume1 size={14} className="text-slate-500" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-600 uppercase">Music Volume</span>
                    <span className="text-[9px] font-black text-red-500 uppercase">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="0.5" step="0.01" 
                    value={bgmVolume} 
                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))} 
                    className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-600"
                  />
                </div>
                <Volume2 size={14} className="text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {state.script && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 space-y-4">
             <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500"><MessageSquare size={20}/></div>
                   <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{state.script.title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{state.script.scenes.length} Segments (Drag to reorder)</p>
                   </div>
                </div>
                <button 
                  onClick={handleGenerateProductionAssets} 
                  disabled={state.status === 'generating_assets'}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500 transition flex items-center gap-2 shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50"
                >
                  {state.status === 'generating_assets' ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                  {selectedVisualModel.startsWith('veo') ? 'Start High-Performance Production' : 'Generate Full Production'}
                </button>
             </div>

             <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 relative">
                {state.script.scenes.map((scene, idx) => {
                   const isHost = scene.voiceover.startsWith('Speaker 1:');
                   const hasAudio = audioBuffers.has(scene.id);
                   const hasVisual = !!(scene.imageUrl || scene.videoUrl);
                   const isActive = currentSceneIdx === idx && isPlaying;
                   const isBeingDragged = draggedItemIdx === idx;
                   const isDragTarget = dragOverIdx === idx && draggedItemIdx !== idx;
                   const isPreviewPlaying = playingPreviewId === scene.id;

                   return (
                     <div 
                       key={scene.id} 
                       draggable={!isGenerating && !isPlaying}
                       onDragStart={(e) => handleDragStart(e, idx)}
                       onDragEnd={handleDragEnd}
                       onDragOver={(e) => handleDragOver(e, idx)}
                       onDrop={(e) => handleDrop(e, idx)}
                       className={`p-6 rounded-2xl border transition-all relative group ${
                         isActive ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-900/10 scale-[1.01]' : 
                         isHost ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-slate-950 border-slate-900/50 ml-8'
                       } ${isBeingDragged ? 'opacity-20 grayscale border-dashed border-slate-600' : 'opacity-100'} 
                         ${isDragTarget ? 'border-t-4 border-t-red-500 pt-8 mt-2' : ''}`}
                     >
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                             <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 transition-colors">
                               <GripVertical size={16} />
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${isHost ? 'text-red-400' : 'text-blue-400'}`}>
                               {isHost ? 'Host' : 'Guest'}
                             </span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800" title="Scene Duration (Est)">
                                <Clock size={10} className="text-slate-500" />
                                <input 
                                  type="number" 
                                  value={scene.duration_est} 
                                  onChange={(e) => updateScene(scene.id, { duration_est: parseInt(e.target.value) || 1 })}
                                  className="w-8 bg-transparent text-[9px] font-black text-white outline-none border-none text-center p-0"
                                />
                                <span className="text-[8px] font-black text-slate-600 uppercase">s</span>
                              </div>
                              <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleRegenerateVisual(scene)}
                                  disabled={state.status === 'generating_assets' || scene.status === 'generating'}
                                  className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition"
                                  title="Regenerate Visual"
                                >
                                  <Sparkles size={10} />
                                </button>
                                <button 
                                  onClick={() => handleRegenerateAudio(scene)}
                                  disabled={state.status === 'generating_assets' || scene.status === 'generating'}
                                  className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition"
                                  title="Regenerate Audio"
                                >
                                  <RefreshCw size={10} />
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => handlePreviewAudio(scene)}
                                disabled={scene.status === 'generating'}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${
                                  isPreviewPlaying 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' 
                                    : hasAudio 
                                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                      : 'bg-slate-800 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400'
                                }`}
                                title={hasAudio ? "Play Preview" : "Generate & Play Preview"}
                              >
                                {scene.status === 'generating' ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : isPreviewPlaying ? (
                                  <Pause size={10} />
                                ) : (
                                  <Play size={10} fill="currentColor" />
                                )}
                              </button>

                              {hasAudio && (
                                <button 
                                  onClick={() => handleDownloadSceneAudio(scene)}
                                  className="p-1.5 bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                  title="Download Scene Audio"
                                >
                                  <Download size={10} />
                                </button>
                              )}

                              {hasVisual && (scene.videoUrl ? 
                                <span className="flex items-center gap-1 text-[9px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                                   <VideoIcon size={8}/> VIDEO
                                </span> : 
                                <span className="flex items-center gap-1 text-[9px] font-black text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                                   <ImageIcon size={8}/> IMAGE
                                </span>
                              )}
                              <span className="text-[9px] text-slate-700 font-mono">#{scene.id}</span>
                           </div>
                        </div>
                        <div className="flex gap-6">
                           <div className="flex-1 space-y-4">
                              <p className="text-sm text-slate-300 font-kanit leading-relaxed select-none">{scene.voiceover.replace(/^Speaker \d: /, '')}</p>
                              
                              <div className="pt-3 border-t border-slate-800/50 flex items-start gap-3">
                                 <ImageIcon size={14} className="text-slate-600 shrink-0 mt-0.5" />
                                 <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                                   {scene.visual_prompt}
                                 </p>
                              </div>
                           </div>
                           <div className="w-32 aspect-video rounded-xl overflow-hidden border border-slate-800 shrink-0 shadow-lg relative bg-slate-950 flex items-center justify-center group">
                                {scene.status === 'generating' ? (
                                   <div className="flex flex-col items-center gap-2">
                                      <Loader2 size={16} className="animate-spin text-purple-500"/>
                                      <span className="text-[8px] font-black text-slate-600 uppercase">AI Generating...</span>
                                   </div>
                                ) : scene.videoUrl ? (
                                   <video src={scene.videoUrl} className="w-full h-full object-cover" muted loop onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}} />
                                ) : scene.imageUrl ? (
                                   <img src={scene.imageUrl} className="w-full h-full object-cover" alt="Scene visual" />
                                ) : (
                                   <div className="opacity-10"><ImageIcon size={24}/></div>
                                )}
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 sticky top-12 flex flex-col items-center gap-8 shadow-2xl">
                <VideoPlayer 
                  ref={playerRef} 
                  scenes={state.script?.scenes.filter(s => s.status === 'completed') || []} 
                  isReady={state.status === 'ready' || !!state.script?.scenes.some(s => s.status === 'completed')} 
                  aspectRatio="16:9"
                  bgmUrl={bgmUrl}
                  bgmVolume={bgmVolume}
                />

                <div className="text-center space-y-2">
                   <h4 className="text-white font-black uppercase tracking-widest text-lg">{state.script?.title || "AI Visual Podcast"}</h4>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Master Production Preview</p>
                </div>

                <div className="flex items-center gap-4">
                   <button onClick={() => { stopAudio(); setCurrentSceneIdx(0); }} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white transition shadow-lg" title="Reset Episode"><SkipBack size={20}/></button>
                   <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-900/40 hover:scale-105 active:scale-95 transition transform">
                      {isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
                   </button>
                   <button onClick={() => setCurrentSceneIdx(prev => Math.min((state.script?.scenes.length || 1) - 1, prev + 1))} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white transition shadow-lg" title="Next Segment"><RefreshCw size={20}/></button>
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-slate-800">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                      <span>Sync Progress</span>
                      <span className="text-red-400">{Math.round(((currentSceneIdx + 1) / (state.script?.scenes.length || 1)) * 100)}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${((currentSceneIdx + 1) / (state.script?.scenes.length || 1)) * 100}%` }}></div>
                   </div>
                </div>

                <button 
                  onClick={async () => {
                     if (!playerRef.current) return;
                     setIsExporting(true);
                     setExportProgress(0);
                     setCurrentFrame(0);
                     try {
                       const { blob, extension } = await playerRef.current.renderVideo((p, s, f, tf) => {
                          setExportProgress(p);
                          setExportStage(s);
                          if (f) setCurrentFrame(f);
                          if (tf) setTotalFrames(tf);
                       });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `podcast-${Date.now()}.${extension}`;
                       a.click();
                     } finally { 
                       setIsExporting(false); 
                       setExportProgress(0);
                     }
                  }}
                  disabled={isExporting}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 transition-all active:scale-95 overflow-hidden relative"
                >
                   {isExporting && (
                    <div className="absolute inset-0 bg-emerald-700/50 transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
                   )}
                   <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        {isExporting ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>}
                        {isExporting ? `${exportProgress}% - ${exportStage}` : 'Export Visual Podcast Mix'}
                    </div>
                    {isExporting && totalFrames > 0 && (
                        <span className="text-[8px] mt-1 font-bold tracking-widest opacity-80">FRAME {currentFrame} / {totalFrames}</span>
                    )}
                   </div>
                </button>
                {isExporting && (
                    <div className="w-full mt-4 bg-slate-950 border border-emerald-500/20 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><Timer size={12}/> Recording Stream</span>
                           <span className="text-[10px] font-mono text-slate-400">{currentFrame} / {totalFrames}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                           <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${(currentFrame / (totalFrames || 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-[8px] text-slate-600 font-black uppercase text-center tracking-[0.2em]">FAST RENDERING MASTER STREAM • DO NOT MINIMIZE</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastCreator;
