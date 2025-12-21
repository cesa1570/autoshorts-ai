
import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, GeneratorMode, Scene, SubtitleStyle } from '../types';
import { generateScript, generateVideoForScene, generateImageForScene, generateVoiceover, ERR_INVALID_KEY } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';
import { useApp } from '../App';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import SceneManager from './SceneManager';
import MetadataManager from './MetadataManager';
import { saveProject, listProjects, deleteProject, ProjectData, exportProjectToJson } from '../services/projectService';
import { 
  Video, Wand2, Play, Pause, SkipBack, Loader2, AlertCircle, 
  Coffee, Clapperboard, MessageSquare, Volume2, Download,
  CheckCircle2, RefreshCw, Layout, Layers, Monitor, Smartphone,
  Sparkles, History, Zap, Settings2, Music, Trash2, Volume1,
  Video as VideoIcon, Palette, Type, Move, Search, BarChart3,
  PlusCircle, Save, FolderOpen, Clock, FileJson, Cloud, FileEdit, X,
  Timer
} from 'lucide-react';

interface LongVideoCreatorProps {
  initialTopic?: string;
  initialLanguage?: 'Thai' | 'English';
}

const LongVideoCreator: React.FC<LongVideoCreatorProps> = ({ initialTopic, initialLanguage = 'Thai' }) => {
  const { openKeySelection, hasSelectedKey, resetKeyStatus } = useApp();
  const [state, setState] = useState<ProjectState>({
    status: 'idle',
    topic: initialTopic || '',
    script: null,
    currentStep: '',
  });

  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage);
  const [duration, setDuration] = useState(3); 
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedVisualModel, setSelectedVisualModel] = useState('veo-3.1-fast-generate-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<'timeline' | 'style' | 'seo'>('timeline');
  const [cooldown, setCooldown] = useState(0);

  // Project Management States
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'draft' | 'saving' | 'saved'>('draft');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const lastSaveRef = useRef<number>(Date.now());

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 84,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.75,
    verticalOffset: 30,
    fontFamily: 'Kanit'
  });

  // BGM States
  const [bgmUrl, setBgmUrl] = useState<string | undefined>(undefined);
  const [bgmName, setBgmName] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.2);

  const playerRef = useRef<VideoPlayerRef>(null);

  const refreshProjectList = async () => {
    const projects = await listProjects('long');
    setSavedProjects(projects);
  };

  useEffect(() => {
    refreshProjectList();
  }, [saveStatus]);

  useEffect(() => {
    if (initialTopic) setState(prev => ({ ...prev, topic: initialTopic }));
  }, [initialTopic]);

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
  }, [state.topic, state.script, language, duration, aspectRatio, selectedVoice, selectedVisualModel, subtitleStyle, bgmName, bgmVolume]);

  // Auto-save logic
  useEffect(() => {
    if (!autoSaveEnabled || !state.script) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current > 30000 && saveStatus === 'draft') {
        handleSaveProject();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, state, language, duration, aspectRatio, selectedVoice, selectedVisualModel, saveStatus]);

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
    
    const projectId = state.id || `long-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const projectTitle = state.script?.title || state.topic || "Untitled Long Video";
    
    const project: ProjectData = {
      id: projectId,
      type: 'long',
      title: projectTitle,
      topic: state.topic,
      lastUpdated: Date.now(),
      config: {
        language,
        duration,
        aspectRatio,
        selectedVoice,
        selectedVisualModel,
        subtitleStyle,
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
    setState({
      id: project.id,
      status: 'idle',
      topic: project.topic,
      script: project.script,
      currentStep: ''
    });

    setLanguage(project.config.language);
    setDuration(project.config.duration);
    setAspectRatio(project.config.aspectRatio);
    setSelectedVoice(project.config.selectedVoice);
    setSelectedVisualModel(project.config.selectedVisualModel);
    if (project.config.subtitleStyle) setSubtitleStyle(project.config.subtitleStyle);
    setBgmName(project.config.bgmName);
    setBgmVolume(project.config.bgmVolume);
    setBgmUrl(undefined);
    
    // Process script scenes to restore audio buffers
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
    if (state.script && saveStatus !== 'saved' && !confirm("Discard current work and start a new project?")) return;
    setState({ status: 'idle', topic: '', script: null, currentStep: '' });
    setSaveStatus('draft');
  };

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgmName(file.name);
    const url = URL.createObjectURL(file);
    setBgmUrl(url);
  };

  const clearBgm = () => {
    if (bgmUrl) URL.revokeObjectURL(bgmUrl);
    setBgmUrl(undefined);
    setBgmName(null);
  };

  const handleGenerateScript = async () => {
    if (!state.topic) return;
    setIsGenerating(true);
    setState(prev => ({ ...prev, status: 'generating_script', error: undefined }));
    try {
      const scriptData = await generateScript(state.topic, GeneratorMode.LONG_VIDEO, aspectRatio, language, duration);
      scriptData.scenes = scriptData.scenes.map(s => ({ ...s, status: 'pending' }));
      setState(prev => ({ ...prev, script: scriptData, status: 'idle' }));
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const processScene = async (scene: Scene): Promise<void> => {
    updateScene(scene.id, { status: 'generating', error: undefined });
    try {
      let videoUrl: string | undefined;
      let imageUrl: string | undefined;
      
      const isVideoModel = selectedVisualModel.startsWith('veo');
      
      if (isVideoModel) {
        videoUrl = await generateVideoForScene(scene.visual_prompt, aspectRatio, selectedVisualModel);
      } else {
        imageUrl = await generateImageForScene(scene.visual_prompt, selectedVisualModel, aspectRatio);
      }

      const audioBase64 = await generateVoiceover(scene.voiceover, selectedVoice);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(audioBase64, audioCtx);
      updateScene(scene.id, { status: 'completed', videoUrl, imageUrl, audioBase64, audioBuffer });
    } catch (err: any) {
      updateScene(scene.id, { status: 'failed', error: err.message || "Visual Generation Failed" });
      handleError(err);
      throw err;
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

  const handleGenerateAllAssets = async () => {
    const isPaidModel = selectedVisualModel.includes('pro') || selectedVisualModel.includes('veo');
    if (isPaidModel && !hasSelectedKey) { 
      await openKeySelection(); 
      return; 
    }

    if (!state.script) return;
    setState(prev => ({ ...prev, status: 'generating_assets' }));
    const pending = state.script.scenes.filter(s => s.status !== 'completed' && s.status !== 'skipped');
    
    try {
      for (let i = 0; i < pending.length; i++) {
        if (i > 0) {
          setCooldown(45);
          await new Promise(resolve => setTimeout(resolve, 45000));
        }
        await processScene(pending[i]);
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
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinematic-master-${Date.now()}.${extension}`;
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

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Workspace Controls Overlay */}
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
              {saveStatus === 'saved' ? 'Cloud Sync Ready' : saveStatus === 'saving' ? 'Syncing...' : 'Local Draft'}
            </div>
         </div>

         <button 
           onClick={() => setShowHistory(!showHistory)} 
           className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${showHistory ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
         >
           <History size={14}/> Recent Work {savedProjects.length > 0 && <span className="ml-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{savedProjects.length}</span>}
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
                   type: 'long',
                   title: state.script?.title || 'Untitled',
                   topic: state.topic,
                   lastUpdated: Date.now(),
                   config: { language, duration, aspectRatio, selectedVoice, selectedVisualModel, subtitleStyle, bgmName, bgmVolume },
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
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in duration-300">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <div className="flex-1">
                <p className="text-red-400 font-black uppercase text-xs tracking-widest mb-1">Attention Required</p>
                <p className="text-red-200/80 text-xs font-medium leading-relaxed mb-3">{state.error}</p>
                <button onClick={openKeySelection} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">Configure Key</button>
            </div>
        </div>
      )}

      {cooldown > 0 && state.status === 'generating_assets' && (
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
           <Coffee size={20} className="text-blue-400 animate-bounce" />
           <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Cooldown: Waiting {cooldown}s for API stability...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Clapperboard size={120} /></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/20"><Video size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Long Video Studio</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cinema Engine • 1080p Master Output</p>
                    </div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter a deep topic (e.g., The Secret History of the Moon)..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 pr-44 text-white text-xl font-kanit outline-none shadow-inner focus:ring-2 focus:ring-purple-600/50 transition-all" 
                      value={state.topic} 
                      onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))} 
                    />
                    <button 
                      onClick={handleGenerateScript} 
                      disabled={!state.topic || isGenerating} 
                      className="absolute right-3 top-3 bottom-3 px-8 bg-purple-600 text-white rounded-2xl font-black transition flex items-center gap-2 uppercase tracking-widest text-xs hover:bg-purple-500 active:scale-95 shadow-xl shadow-purple-900/40"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>}
                      <span>Compose Script</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Target Duration</label>
                        <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-xs">
                            <option value={3}>3 Minutes</option>
                            <option value={5}>5 Minutes</option>
                            <option value={10}>10 Minutes</option>
                        </select>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Master Format</label>
                        <div className="flex gap-4">
                            <button onClick={() => setAspectRatio('16:9')} className={aspectRatio === '16:9' ? 'text-purple-400' : 'text-slate-600'} title="Landscape 16:9"><Monitor size={18}/></button>
                            <button onClick={() => setAspectRatio('9:16')} className={aspectRatio === '9:16' ? 'text-purple-400' : 'text-slate-600'} title="Portrait 9:16"><Smartphone size={18}/></button>
                        </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Narrator Voice</label>
                        <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none text-xs">
                            <option value="Kore">Professional</option>
                            <option value="Charon">Narrator</option>
                            <option value="Zephyr">Bright</option>
                            <option value="Puck">Friendly</option>
                        </select>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 flex items-center gap-1.5"><Settings2 size={10}/> Visual Engine</label>
                        <select value={selectedVisualModel} onChange={(e) => setSelectedVisualModel(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none text-[10px]">
                            <option value="gemini-2.5-flash-image">Flash Image (Free)</option>
                            <option value="gemini-3-pro-image-preview">Pro Image (Paid)</option>
                            <option value="veo-3.1-fast-generate-preview">Veo Fast (Paid)</option>
                            <option value="veo-3.1-generate-preview">Veo Pro (Paid)</option>
                        </select>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 flex items-center gap-1.5"><Music size={10}/> BG Music</label>
                        <div className="relative">
                            <input type="file" accept="audio/*" onChange={handleBgmUpload} className="hidden" id="long-bgm-upload" />
                            <label htmlFor="long-bgm-upload" className="w-full h-full bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer flex items-center justify-between gap-1">
                                <span className="truncate max-w-[50px]">{bgmName || "Select"}</span>
                                {bgmName ? <Trash2 size={10} className="text-red-500" onClick={(e) => { e.preventDefault(); clearBgm(); }} /> : <Music size={10} />}
                            </label>
                        </div>
                    </div>
                  </div>

                  {bgmUrl && (
                    <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-6 animate-in fade-in slide-in-from-top-2">
                        <Volume1 size={18} className="text-slate-500 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BGM Master Volume</span>
                            <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase">{Math.round(bgmVolume * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={bgmVolume} 
                            onChange={(e) => setBgmVolume(parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>
                        <Volume2 size={18} className="text-slate-500 shrink-0" />
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
              bgmUrl={bgmUrl}
              bgmVolume={bgmVolume}
            />
            {state.script && state.script.scenes.some(s => s.status === 'completed') && (
              <div className="mt-8 w-full space-y-4">
                 <button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all overflow-hidden relative"
                >
                  {isExporting && <div className="absolute inset-0 bg-emerald-700/50 transition-all duration-500" style={{ width: `${exportProgress}%` }}></div>}
                  <span className="relative z-10 flex items-center gap-3">
                    {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                    {isExporting ? `${exportProgress}% - ${exportStage}` : 'Export 1080p Master'}
                  </span>
                </button>
                {isExporting && (
                    <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><Timer size={12}/> Recording Frames</span>
                           <span className="text-[10px] font-mono text-slate-400">{currentFrame} / {totalFrames}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                           <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${(currentFrame / (totalFrames || 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-[8px] text-slate-600 font-black uppercase text-center tracking-[0.2em]">FAST RENDERING MASTER STREAM • DO NOT MINIMIZE</p>
                    </div>
                )}
              </div>
            )}
        </div>
      </div>

      {state.script && (
        <div className="mt-12 space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex gap-6">
                <button onClick={() => setActiveBottomTab('timeline')} className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'timeline' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Layers size={14} /> Timeline
                  {activeBottomTab === 'timeline' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full"></div>}
                </button>
                <button onClick={() => setActiveBottomTab('style')} className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'style' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Palette size={14} /> Subtitle Style
                  {activeBottomTab === 'style' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full"></div>}
                </button>
                <button onClick={() => setActiveBottomTab('seo')} className={`text-sm font-black uppercase tracking-widest pb-4 transition-all relative flex items-center gap-2 ${activeBottomTab === 'seo' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <BarChart3 size={14} /> SEO & Marketing
                  {activeBottomTab === 'seo' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full"></div>}
                </button>
              </div>
              
              {activeBottomTab === 'timeline' && (
                <button onClick={handleGenerateAllAssets} disabled={state.status === 'generating_assets'} className="px-12 py-4 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-xs flex items-center gap-3 active:scale-95 transition-transform shadow-lg shadow-purple-900/50">
                  {state.status === 'generating_assets' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {state.status === 'generating_assets' ? 'Production in Progress...' : 'Render All Scenes'}
                </button>
              )}
           </div>

           {activeBottomTab === 'timeline' && <SceneManager scenes={state.script.scenes} onRegenerate={processScene} onToggleSkip={() => {}} onUpdateScene={updateScene} isProcessingAll={state.status === 'generating_assets'} />}
           {activeBottomTab === 'style' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-8">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400"><Type size={18} /></div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Typography</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Font Family</label>
                        <select value={subtitleStyle.fontFamily} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontFamily: e.target.value as any }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none focus:ring-1 focus:ring-pink-500/50 transition-all">
                          <option value="Kanit">Kanit (Thai Optimized)</option>
                          <option value="Inter">Inter (Global)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Font Size</label>
                          <span className="text-[10px] font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">{subtitleStyle.fontSize}px</span>
                        </div>
                        <input type="range" min="40" max="150" step="1" value={subtitleStyle.fontSize} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"/>
                      </div>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><Palette size={18} /></div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Color & Opacity</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Text</label>
                          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <input type="color" value={subtitleStyle.textColor} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, textColor: e.target.value }))} className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden"/>
                             <span className="text-[10px] font-mono text-slate-400 uppercase">{subtitleStyle.textColor}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Box</label>
                          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <input type="color" value={subtitleStyle.backgroundColor} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, backgroundColor: e.target.value }))} className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden"/>
                             <span className="text-[10px] font-mono text-slate-400 uppercase">{subtitleStyle.backgroundColor}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Box Opacity</label>
                          <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{Math.round(subtitleStyle.backgroundOpacity * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={subtitleStyle.backgroundOpacity} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, backgroundOpacity: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                      </div>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400"><Move size={18} /></div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Positioning</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vertical Offset</label>
                          <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{subtitleStyle.verticalOffset}%</span>
                        </div>
                        <input type="range" min="5" max="90" step="1" value={subtitleStyle.verticalOffset} onChange={(e) => setSubtitleStyle(prev => ({ ...prev, verticalOffset: parseInt(e.target.value) }))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                      </div>
                   </div>
                </div>
             </div>
           )}
           {activeBottomTab === 'seo' && <MetadataManager metadata={state.script} />}
        </div>
      )}
    </div>
  );
};

export default LongVideoCreator;
