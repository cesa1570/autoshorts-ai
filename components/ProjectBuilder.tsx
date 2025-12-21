
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, GeneratorMode, ScriptData, Scene, SubtitleStyle, OptimizationConfig } from '../types';
import { generateScript, generateImageForScene, generateVoiceover, generateVideoForScene, generatePodcastAudio, ERR_INVALID_KEY } from '../services/geminiService';
import { getCachedScript, setCachedScript, clearScriptCache } from '../services/cacheService';
import { decodeAudioData } from '../utils/audioUtils';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import SceneManager from './SceneManager';
import MetadataManager from './MetadataManager';
import { useApp } from '../App';
import { saveProject, listProjects, deleteProject, ProjectData, exportProjectToJson } from '../services/projectService';
import {
  Wand2, AlertCircle, RefreshCw, Download, Play, Mic, Layout,
  Smartphone, Monitor, Loader2, Key, Coffee, Palette, Type, Move,
  Zap, Video as VideoIcon, PlusCircle, Save, FolderOpen, History,
  Clock, FileJson, Cloud, FileEdit, X, CheckCircle2, Sparkles, BarChart3, Layers,
  Trash2, Timer, Leaf, Image, Database, Music, Volume2, PlayCircle, Youtube
} from 'lucide-react';
import { STOCK_BGM, AudioTrack } from '../services/mockAudioService';
import YouTubeUploadModal from './YouTubeUploadModal';
import CloudSaveManager from './CloudSaveManager';
import { ELEVENLABS_VOICES, generateElevenLabsAudio } from '../services/elevenLabsService';

interface ProjectBuilderProps {
  initialTopic?: string;
  initialLanguage?: 'Thai' | 'English';
}

const ProjectBuilder: React.FC<ProjectBuilderProps> = ({ initialTopic, initialLanguage = 'Thai' }) => {
  const { openKeySelection, hasSelectedKey, resetKeyStatus } = useApp();
  const [state, setState] = useState<ProjectState>({
    status: 'idle',
    topic: initialTopic || '',
    script: null,
    currentStep: '',
  });

  const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.FACTS);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedVisualModel, setSelectedVisualModel] = useState<string>('gemini-2.0-flash');
  const [cooldown, setCooldown] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<'timeline' | 'style' | 'seo' | 'audio'>('timeline');
  const [selectedBgmTrack, setSelectedBgmTrack] = useState<AudioTrack>(STOCK_BGM[0]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [finalVideoBlob, setFinalVideoBlob] = useState<Blob | null>(null);

  // Project Management States
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'draft' | 'saving' | 'saved'>('draft');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const lastSaveRef = useRef<number>(Date.now());

  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [watermarkUrl, setWatermarkUrl] = useState<string | undefined>(undefined);

  // API Optimization States
  const [optimization, setOptimization] = useState<OptimizationConfig>({
    economyMode: true,      // Default ON for cost saving
    imageOnly: true,        // Default ON - no Veo
    enableCache: true       // Default ON
  });
  const [isCachedScript, setIsCachedScript] = useState(false);

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 84,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.75,
    verticalOffset: 30,
    fontFamily: 'Kanit'
  });

  const playerRef = useRef<VideoPlayerRef>(null);

  const refreshProjectList = async () => {
    const projects = await listProjects('shorts');
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

  // Track changes for auto-save
  useEffect(() => {
    if (state.script || state.topic) {
      setSaveStatus(prev => prev === 'saved' ? 'draft' : prev);
    }
  }, [state.topic, state.script, mode, aspectRatio, language, selectedVoice, selectedVisualModel, subtitleStyle, bgmVolume]);

  useEffect(() => {
    if (!autoSaveEnabled || !state.script) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current > 30000 && saveStatus === 'draft') {
        handleSaveProject();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, state, saveStatus, mode, aspectRatio, language, selectedVoice, selectedVisualModel]);

  const handleSaveProject = async () => {
    if (!state.script && !state.topic) return;
    setSaveStatus('saving');

    const projectId = state.id || `shorts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const projectTitle = state.script?.title || state.topic || "Untitled Short";

    const project: ProjectData = {
      id: projectId,
      type: 'shorts',
      title: projectTitle,
      topic: state.topic,
      lastUpdated: Date.now(),
      config: {
        mode,
        aspectRatio,
        language,
        selectedVoice,
        selectedVisualModel,
        subtitleStyle,
        bgmVolume,
        watermarkUrl
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
    setState({
      id: project.id,
      status: 'idle',
      topic: project.topic,
      script: project.script,
      currentStep: ''
    });

    setMode(project.config.mode || GeneratorMode.FACTS);
    setAspectRatio(project.config.aspectRatio || '9:16');
    setLanguage(project.config.language || 'Thai');
    setSelectedVoice(project.config.selectedVoice || 'Kore');
    setSelectedVoice(project.config.selectedVoice || 'Kore');
    setSelectedVisualModel(project.config.selectedVisualModel || 'gemini-2.0-flash');
    if (project.config.subtitleStyle) setSubtitleStyle(project.config.subtitleStyle);
    setBgmVolume(project.config.bgmVolume || 0.2);
    setWatermarkUrl(project.config.watermarkUrl);

    // Restore audio buffers from base64
    if (project.script?.scenes) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const updatedScenes = await Promise.all(project.script.scenes.map(async (s: Scene) => {
        if (s.audioBase64) {
          try {
            const buffer = await decodeAudioData(s.audioBase64, ctx);
            return { ...s, audioBuffer: buffer };
          } catch (e) { return s; }
        }
        return s;
      }));
      setState(prev => ({
        ...prev,
        script: prev.script ? { ...prev.script, scenes: updatedScenes } : null
      }));
    }

    setShowHistory(false);
    setSaveStatus('saved');
    lastSaveRef.current = Date.now();
  };

  const handleNewProject = () => {
    if (state.script && saveStatus !== 'saved' && !confirm("Discard current work and start a new short?")) return;
    setState({ status: 'idle', topic: '', script: null, currentStep: '' });
    setSaveStatus('draft');
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this short project?")) return;
    await deleteProject(id);
    if (state.id === id) handleNewProject();
    await refreshProjectList();
  };

  const handleError = async (error: any) => {
    if (error.code === ERR_INVALID_KEY) {
      resetKeyStatus();
      await openKeySelection();
    }
    setState(prev => ({ ...prev, status: 'error', error: error.message }));
  };

  const handleGenerateScript = async () => {
    if (!state.topic) return;

    // Check cache first if enabled (skip for Manual)
    if (optimization.enableCache && mode !== GeneratorMode.MANUAL) {
      const cached = getCachedScript(state.topic, mode, language, optimization.economyMode);
      if (cached) {
        cached.scenes = cached.scenes.map(s => ({ ...s, status: 'pending' }));
        setState(prev => ({ ...prev, script: cached, status: 'idle' }));
        setIsCachedScript(true);
        return;
      }
    }

    setIsCachedScript(false);
    try {
      if (mode === GeneratorMode.MANUAL) {
        const initialScene: Scene = { id: 1, visual_prompt: '', voiceover: '', duration_est: 5, status: 'pending', mediaSource: 'ai' };
        const emptyScript: ScriptData = {
          title: state.topic,
          seoTitle: state.topic,
          description: 'Manual Creation',
          longDescription: '',
          hashtags: [],
          seoKeywords: '',
          scenes: [initialScene]
        };
        setState(prev => ({ ...prev, script: emptyScript, status: 'ready', currentStep: '' }));
        return;
      }

      setState(prev => ({ ...prev, status: 'generating_script', error: undefined }));
      const scriptData = await generateScript(
        state.topic,
        mode,
        aspectRatio,
        language,
        1, // duration
        selectedVisualModel,
        undefined,
        undefined,
        optimization.economyMode
      );
      scriptData.scenes = scriptData.scenes.map(s => ({ ...s, status: 'pending' }));

      // Cache the result if caching enabled
      if (optimization.enableCache) {
        setCachedScript(state.topic, mode, language, optimization.economyMode, scriptData);
      }

      setState(prev => ({ ...prev, script: scriptData, status: 'idle' }));
    } catch (error: any) {
      handleError(error);
    }
  };

  const processScene = async (scene: Scene): Promise<void> => {
    updateScene(scene.id, { status: 'generating', error: undefined });
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      const isVideoModel = selectedVisualModel.startsWith('veo');

      // Only generate visuals if NOT using stock/upload
      if (scene.mediaSource !== 'stock' && scene.mediaSource !== 'upload') {
        if (isVideoModel) {
          videoUrl = await generateVideoForScene(scene.visual_prompt, aspectRatio, selectedVisualModel);
        } else {
          imageUrl = await generateImageForScene(scene.visual_prompt, selectedVisualModel, aspectRatio);
        }
      } else {
        // Prepare assets for Stock/Upload (ensure URLs stick)
        if (scene.stockUrl) videoUrl = scene.stockUrl;
      }

      let audioBase64: string;
      const xiKey = localStorage.getItem('elevenlabs_api_key');
      const isElevenLabs = ELEVENLABS_VOICES.some(v => v.id === selectedVoice);

      if (isElevenLabs && xiKey) {
        const audioBuffer = await generateElevenLabsAudio(scene.voiceover, selectedVoice, xiKey);
        // Convert ArrayBuffer to Base64
        let binary = '';
        const bytes = new Uint8Array(audioBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        audioBase64 = window.btoa(binary);
      } else if (mode === GeneratorMode.PODCAST) {
        // Podcast Mode: Use dual-speaker generation
        // Default pair: Journey-F (Fem) + Journey-D (Male)
        audioBase64 = await generatePodcastAudio(scene.voiceover, 'en-US-Journey-F', 'en-US-Journey-D');
      } else {
        audioBase64 = await generateVoiceover(scene.voiceover, selectedVoice);
      }

      updateScene(scene.id, {
        imageUrl,
        videoUrl,
        audioBase64,
        audioBuffer: undefined, // Will be decoded by player
        status: 'completed'
      });
    } catch (err: any) {
      updateScene(scene.id, { status: 'failed', error: err.message || "Generation failed" });
      handleError(err);
      throw err;
    }
  };

  const updateScene = (sceneId: number, updates: Partial<Scene>) => {
    setState(prev => {
      if (!prev.script) return prev;
      return { ...prev, script: { ...prev.script, scenes: prev.script.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s) } };
    });
  };

  const handleGenerateAllAssets = async () => {
    if (selectedVisualModel.includes('pro') || selectedVisualModel.includes('veo')) {
      if (!hasSelectedKey) { await openKeySelection(); return; }
    }
    if (!state.script) return;
    setState(prev => ({ ...prev, status: 'generating_assets' }));
    const scenesToProcess = state.script.scenes.filter(s => s.status !== 'completed' && s.status !== 'skipped');

    try {
      for (let i = 0; i < scenesToProcess.length; i++) {
        if (i > 0) {
          setCooldown(45);
          await new Promise(resolve => setTimeout(resolve, 45000));
        }
        await processScene(scenesToProcess[i]);
      }
      setState(prev => ({ ...prev, status: 'ready' }));
      handleSaveProject();
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleExport = async () => {
    if (!playerRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    setCurrentFrame(0);
    try {
      const { blob, extension } = await playerRef.current.renderVideo((p, s, f, tf) => {
        setExportProgress(p);
        setExportStage(s);
        if (f !== undefined) setCurrentFrame(f);
        if (tf !== undefined) setTotalFrames(tf);
      });

      setFinalVideoBlob(blob); // Store for upload

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viral-short-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      alert("ดาวน์โหลดล้มเหลว: " + (err.message || "เกิดข้อผิดพลาดในการบันทึกวิดีโอ"));
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleAddScene = () => {
    if (!state.script) return;
    const newId = (state.script.scenes.length > 0 ? Math.max(...state.script.scenes.map(s => s.id)) : 0) + 1;
    const newScene: Scene = {
      id: newId, visual_prompt: '', voiceover: '', duration_est: 5, status: 'pending', mediaSource: 'ai'
    };
    setState(prev => ({
      ...prev,
      script: prev.script ? { ...prev.script, scenes: [...prev.script.scenes, newScene] } : null
    }));
  };

  const handleDeleteScene = (id: number) => {
    if (!state.script) return;
    if (!confirm("Delete this scene?")) return;
    setState(prev => ({
      ...prev,
      script: prev.script ? { ...prev.script, scenes: prev.script.scenes.filter(s => s.id !== id) } : null
    }));
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Watermark image must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setWatermarkUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Workspace Controls Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800/50 backdrop-blur-sm z-30">
        <button
          onClick={handleNewProject}
          className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-lg border border-slate-700"
        >
          <PlusCircle size={14} /> New Short
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProject}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition shadow-lg ${saveStatus === 'saved' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' :
              saveStatus === 'saving' ? 'bg-purple-800 text-purple-300 cursor-wait' :
                'bg-purple-600 text-white hover:bg-purple-500'
              }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Project Saved' : 'Save Project'}
          </button>

          <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border transition-all duration-500 ${saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
            saveStatus === 'saving' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse' :
              'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
            {saveStatus === 'saved' ? <Cloud size={12} /> : saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <FileEdit size={12} />}
            {saveStatus === 'saved' ? 'Synced to Studio' : saveStatus === 'saving' ? 'Syncing...' : 'Local Draft'}
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${showHistory ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <History size={14} /> Recent Shorts {savedProjects.length > 0 && <span className="ml-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{savedProjects.length}</span>}
        </button>

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
                type: 'shorts',
                title: state.script?.title || 'Untitled',
                topic: state.topic,
                lastUpdated: Date.now(),
                config: { mode, aspectRatio, language, selectedVoice, selectedVisualModel, subtitleStyle, bgmVolume, watermarkUrl },
                script: state.script
              })}
              className="p-2 text-slate-500 hover:text-white transition"
              title="Export Project to JSON"
            >
              <FileJson size={18} />
            </button>
          )}
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 mb-8 overflow-hidden relative z-40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <FolderOpen size={16} className="text-purple-400" /> My Shorts Drafts
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white transition p-2"><X size={20} /></button>
          </div>

          {savedProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest italic">No saved shorts found in your studio.</p>
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
                      <Clock size={10} /> {new Date(proj.lastUpdated).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); exportProjectToJson(proj); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition">
                        <FileJson size={12} />
                      </button>
                      <button onClick={(e) => handleDeleteProject(proj.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-white line-clamp-1 mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{proj.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 italic">{proj.topic}</p>
                  <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase">
                    <span>{proj.config.language}</span>
                    <span>•</span>
                    <span>{proj.config.mode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl flex items-start gap-4">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div className="flex-1">
            <p className="text-red-400 font-black uppercase text-xs tracking-widest mb-1">Attention Required</p>
            <p className="text-red-200/80 text-xs font-medium leading-relaxed mb-3">{state.error}</p>
            <button onClick={openKeySelection} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Update Key</button>
          </div>
        </div>
      )}

      {cooldown > 0 && state.status === 'generating_assets' && (
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4">
          <Coffee size={20} className="text-blue-400 animate-bounce" />
          <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Cooldown: Waiting {cooldown}s for API stability...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-3 space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-20">

          <CloudSaveManager
            currentProject={state.script ? {
              id: state.id || `shorts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'shorts',
              title: state.script?.title || state.topic || "Untitled Short",
              topic: state.topic,
              lastUpdated: Date.now(),
              config: {
                mode,
                aspectRatio,
                language,
                selectedVoice,
                selectedVisualModel,
                subtitleStyle,
                bgmVolume,
                watermarkUrl
              },
              script: state.script
            } : null}
            onLoadProject={handleLoadProject}
          />

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Layout className="text-purple-400" size={24} />
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Shorts Creator</h2>
                  {state.id && <p className="text-[8px] text-slate-600 font-black uppercase mt-1">ID: {state.id}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-black uppercase text-slate-500">
                Language: <span className="text-purple-400 ml-1">{language}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <input type="text" placeholder="Topic..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-32 text-white text-sm font-kanit outline-none shadow-inner focus:ring-2 focus:ring-purple-600/30 transition-all font-medium" value={state.topic} onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))} />
                <button onClick={handleGenerateScript} disabled={!state.topic || state.status === 'generating_script'} className="absolute right-2 top-2 bottom-2 px-4 bg-purple-600 text-white rounded-xl font-black transition flex items-center gap-2 uppercase tracking-wide text-[9px] shadow-lg hover:bg-purple-500 active:scale-95 disabled:opacity-50">
                  {state.status === 'generating_script' ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                  <span>{mode === GeneratorMode.MANUAL ? 'CREATE' : 'GO'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Genre</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value as GeneratorMode)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none">
                    {Object.entries(GeneratorMode).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Format</label>
                  <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 h-[48px]">
                    <button onClick={() => setAspectRatio('9:16')} className={`flex-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${aspectRatio === '9:16' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}><Smartphone size={14} /></button>
                    <button onClick={() => setAspectRatio('16:9')} className={`flex-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${aspectRatio === '16:9' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}><Monitor size={14} /></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Narrator</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                  >
                    <optgroup label="Google AI Voices">
                      <option value="en-US-Journey-F">Journey (Fem)</option>
                      <option value="en-US-Journey-D">Journey (Male)</option>
                      <option value="en-US-Neural2-C">Business (Fem)</option>
                      <option value="en-US-Neural2-J">Business (Male)</option>
                      <option value="en-US-News-K">News (Fem)</option>
                      <option value="en-US-News-N">News (Male)</option>
                    </optgroup>
                    {localStorage.getItem('elevenlabs_api_key') && (
                      <optgroup label="ElevenLabs Premium (Pro)">
                        {ELEVENLABS_VOICES.map(v => (
                          <option key={v.id} value={v.id}>EL: {v.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Visual Engine</label>
                  <select value={selectedVisualModel} onChange={(e) => setSelectedVisualModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-white outline-none">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Free)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Backup)</option>
                  </select>
                </div>
              </div>

              {/* Optimization Controls */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOptimization(prev => ({ ...prev, economyMode: !prev.economyMode }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${optimization.economyMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                  >
                    <Leaf size={14} />
                    Economy Mode {optimization.economyMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOptimization(prev => ({ ...prev, imageOnly: !prev.imageOnly }));
                      // Reset to image model if turning on imageOnly and currently on Veo
                      if (!optimization.imageOnly && selectedVisualModel.startsWith('veo')) {
                        setSelectedVisualModel('gemini-2.5-flash-image');
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${optimization.imageOnly ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                  >
                    <Image size={14} />
                    Image Only {optimization.imageOnly ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOptimization(prev => ({ ...prev, enableCache: !prev.enableCache }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${optimization.enableCache ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                  >
                    <Database size={14} />
                    Cache {optimization.enableCache ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isCachedScript && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                    <Sparkles size={12} /> Cached Script
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center">
          <VideoPlayer
            ref={playerRef}
            scenes={state.script?.scenes.filter(s => s.status === 'completed') || []}
            isReady={state.status === 'ready' || !!state.script?.scenes.some(s => s.status === 'completed')}
            aspectRatio={aspectRatio}
            subtitleStyle={subtitleStyle}
            onBgmChange={() => { }}
            onVolumeChange={setBgmVolume}
            bgmUrl={selectedBgmTrack?.url}
            watermarkUrl={watermarkUrl}
          />
          {state.script && state.script.scenes.some(s => s.status === 'completed') && (
            <div className="mt-8 w-full space-y-4">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all overflow-hidden relative"
              >
                {isExporting && (
                  <div className="absolute inset-0 bg-emerald-700/50 transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                  {isExporting ? `${exportProgress}% - ${exportStage}` : 'Download Export'}
                </span>
              </button>
              {isExporting && (
                <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><Timer size={12} /> Recording Frames</span>
                    <span className="text-[10px] font-mono text-slate-400">{currentFrame} / {totalFrames}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(currentFrame / (totalFrames || 1)) * 100}%` }}></div>
                  </div>
                  <p className="text-[8px] text-slate-600 font-black uppercase text-center tracking-[0.2em]">FAST RENDERING • DO NOT MINIMIZE</p>
                </div>
              )}

              {finalVideoBlob && !isExporting && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full py-4 bg-red-600 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 hover:bg-red-500 transition-all animate-in zoom-in"
                >
                  <Youtube size={16} fill="currentColor" /> Upload to YouTube
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <YouTubeUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          script={state.script}
          videoBlob={finalVideoBlob}
        />
      )}

      {state.script && (
        <div className="mt-12 space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveBottomTab('timeline')}
                className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'timeline' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Layers size={14} /> Timeline
                {activeBottomTab === 'timeline' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveBottomTab('style')}
                className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'style' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Palette size={14} /> Subtitle Style
                {activeBottomTab === 'style' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveBottomTab('seo')}
                className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'seo' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <BarChart3 size={14} /> SEO & Marketing
                {activeBottomTab === 'seo' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full"></div>}
              </button>
              <button
                onClick={() => setActiveBottomTab('audio')}
                className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'audio' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Music size={14} /> Audio & BGM
                {activeBottomTab === 'audio' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full"></div>}
              </button>
            </div>

            {activeBottomTab === 'timeline' && (
              <button onClick={handleGenerateAllAssets} disabled={state.status === 'generating_assets'} className="px-10 py-4 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[10px] flex items-center gap-3 active:scale-95 transition-transform shadow-lg shadow-purple-900/20">
                {state.status === 'generating_assets' ? <Loader2 className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
                Generate Production Assets
              </button>
            )}
          </div>

          {activeBottomTab === 'timeline' && (
            <SceneManager
              scenes={state.script.scenes}
              onRegenerate={processScene}
              onToggleSkip={(id) => {
                const updatedScenes = state.script?.scenes.map(s => s.id === id ? { ...s, status: (s.status === 'skipped' ? 'pending' : 'skipped') as any } : s) || [];
                if (state.script) setState(prev => ({ ...prev, script: { ...prev.script!, scenes: updatedScenes } }));
              }}
              onUpdateScene={updateScene}
              isProcessingAll={state.status === 'generating_assets'}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
            />
          )}

          {activeBottomTab === 'style' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <Type size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Typography</h4>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Font Family</label>
                    <select
                      value={subtitleStyle.fontFamily}
                      onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none focus:ring-1 focus:ring-pink-500/50 transition-all"
                    >
                      <option value="Kanit">Kanit (Thai Optimized)</option>
                      <option value="Inter">Inter (Global)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Font Size</label>
                      <span className="text-[10px] font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">{subtitleStyle.fontSize}px</span>
                    </div>
                    <input
                      type="range" min="40" max="150" step="1"
                      value={subtitleStyle.fontSize}
                      onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Palette size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Color & Opacity</h4>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Text</label>
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <input
                          type="color"
                          value={subtitleStyle.textColor}
                          onChange={(e) => setSubtitleStyle(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{subtitleStyle.textColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Box</label>
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <input
                          type="color"
                          value={subtitleStyle.backgroundColor}
                          onChange={(e) => setSubtitleStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{subtitleStyle.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Box Opacity</label>
                      <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{Math.round(subtitleStyle.backgroundOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={subtitleStyle.backgroundOpacity}
                      onChange={(e) => setSubtitleStyle(prev => ({ ...prev, backgroundOpacity: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Move size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Positioning</h4>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vertical Offset</label>
                      <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{subtitleStyle.verticalOffset}%</span>
                    </div>
                    <input
                      type="range" min="5" max="90" step="1"
                      value={subtitleStyle.verticalOffset}
                      onChange={(e) => setSubtitleStyle(prev => ({ ...prev, verticalOffset: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeBottomTab === 'seo' && (
            <MetadataManager metadata={state.script} />
          )}

          {activeBottomTab === 'audio' && (
            <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <Music size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Background Music</h4>
                  <p className="text-[10px] text-slate-500">Select a royalty-free track to enhance your short's vibe.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STOCK_BGM.map(track => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedBgmTrack(track)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 group ${selectedBgmTrack.id === track.id
                      ? 'bg-teal-500/10 border-teal-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedBgmTrack.id === track.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800 group-hover:text-white'}`}>
                      {selectedBgmTrack.id === track.id ? <Volume2 size={18} /> : <PlayCircle size={18} />}
                    </div>
                    <div className="flex-1">
                      <h5 className={`text-xs font-black uppercase tracking-wide ${selectedBgmTrack.id === track.id ? 'text-white' : 'text-slate-300'}`}>{track.title}</h5>
                      <span className="text-[10px] text-slate-500">{track.genre} • {track.duration > 0 ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'Silent'}</span>
                    </div>
                    {selectedBgmTrack.id === track.id && <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>}
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Music Volume</label>
                  <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectBuilder;
