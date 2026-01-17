
import React, { useState, useRef, useEffect } from 'react';
import { TEXT_MODELS, VISUAL_MODELS, VIDEO_MODELS } from '../utils/models';
import { ProjectState, GeneratorMode, Scene, SubtitleStyle, ScriptData, Draft } from '../types';
import { generateLongVideoScript, generateVideoForScene, generateImageForScene, generateVoiceover, ERR_INVALID_KEY, refineVisualPrompt, generateStoryboards, generateLiveImageForScene, regenerateScene } from '../services/geminiService';
import { generateScriptWithOpenAI, generateImageWithDalle, generateAudioWithOpenAI } from '../services/openaiService';
import { unifiedGenerateScript } from '../services/unifiedAiService';
import { decodeAudioData } from '../utils/audioUtils';
import { DraftService } from '../services/draftService';
import { useApp } from '../contexts/AppContext';
import { useAutomation } from '../contexts/AutomationContext';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import SceneManager from './SceneManager';
import MetadataManager from './MetadataManager';
import SubtitleEditor from './SubtitleEditor';
import ArtStyleSelector from './ArtStyleSelector';
import VoiceSelector from './VoiceSelector';
import CustomDropdown from './CustomDropdown';
import ExportSuccessModal from './ExportSuccessModal';
import { saveProject, listProjects, ProjectData, exportProjectToJson, deleteProject, addToQueue, validateYoutubeMetadata, getProject } from '../services/projectService';
import ConfirmGenerationModal from './ConfirmGenerationModal';
import {
  Video as VideoIcon, Loader2, AlertCircle, Save, History,
  Sparkles, Download, Youtube, Palette, Layers, BarChart3,
  Type, Headphones, X, Upload, Trash2, MessageCircle, Mic,
  CheckCircle2, Copy, FolderOpen, Clock, FileJson, Info, Book, Music, Play, Pause, Library, Layout, Settings, Eye, EyeOff, Rocket, VolumeX, Volume2, FileText, ChevronDown, ChevronUp, ListChecks, Tv, Activity, Send, ListPlus, ShieldCheck, Timer, Zap, Cpu, ChevronRight, Monitor, Settings2, Cloud, CloudOff, FileEdit, Wand2, FastForward, Plus, BrainCircuit, Calendar, Camera, Share2, Smartphone
} from 'lucide-react';
import MobileHandoffModal from './MobileHandoffModal';

const SaveStatusIndicator = ({ status, lastSaved }: { status: 'draft' | 'saving' | 'saved' | 'error', lastSaved?: number }) => {
  const timeStr = lastSaved ? new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  switch (status) {
    case 'saving': return (
      <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/40 text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-pulse ring-1 ring-blue-500/30">
        <Loader2 size={16} className="animate-spin" />
        <span>Saving Changes...</span>
      </div>
    );
    case 'saved': return (
      <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30">
        <CheckCircle2 size={16} className="text-emerald-500" />
        <span>All Changes Saved {timeStr && <span className="opacity-60 ml-1 font-bold">at {timeStr}</span>}</span>
      </div>
    );
    case 'error': return (
      <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-bounce ring-1 ring-red-500/30">
        <CloudOff size={16} />
        <span>Save Failed</span>
      </div>
    );
    default: return (
      <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-black uppercase tracking-widest shadow-inner ring-1 ring-slate-700/50">
        <FileEdit size={16} className="text-slate-500" />
        <span>Draft • Unsaved</span>
      </div>
    );
  }
};

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface LongVideoCreatorProps {
  initialTopic?: string;
  initialLanguage?: string;
  apiKey: string;
  initialDraft?: Draft | null;
  isActive?: boolean;
}

const LongVideoCreator: React.FC<LongVideoCreatorProps> = ({ initialTopic, initialLanguage = 'Thai', apiKey, initialDraft, isActive }) => {
  const { resetKeyStatus, licenseTier, apiKeys, openaiApiKey, userId, vertexProjectId, vertexLocation, vertexServiceKey, vertexApiKey } = useApp();

  const hasGemini = apiKeys.length > 0;
  const hasOpenAI = !!openaiApiKey;
  const hasVertex = !!vertexProjectId;
  const { addLog } = useAutomation();
  const [state, setState] = useState<ProjectState>({ id: initialDraft?.id, status: 'idle', topic: initialTopic || '', script: null, currentStep: '' });
  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage as any);
  const [duration, setDuration] = useState(10);
  const aspectRatio = '16:9';
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'vertex'>(hasGemini ? 'gemini' : (hasOpenAI ? 'openai' : (hasVertex ? 'vertex' : 'gemini')));
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  // Dynamic filter for visual models
  // Dynamic filter for visual models
  const availableVisualModels = [...VISUAL_MODELS, ...VIDEO_MODELS].filter(m => (m.provider === 'google' && hasGemini) || (m.provider === 'openai' && hasOpenAI) || (m.provider === 'vertex' && hasVertex));
  const availableTextModels = TEXT_MODELS.filter(m => (m.provider === 'google' && hasGemini) || (m.provider === 'openai' && hasOpenAI) || (m.provider === 'vertex' && hasVertex));

  const [selectedVisualModel, setSelectedVisualModel] = useState(availableVisualModels[0]?.id || VISUAL_MODELS[0].id);
  const [selectedTextModel, setSelectedTextModel] = useState(availableTextModels[0]?.id || TEXT_MODELS[0].id);
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'styling' | 'seo'>('script');
  const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false); // New
  const [saveStatus, setSaveStatus] = useState<'draft' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<number | undefined>(undefined);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [hideSubtitles, setHideSubtitles] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isRefiningAll, setIsRefiningAll] = useState(false);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isStoryboarding, setIsStoryboarding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [parallelBatchSize, setParallelBatchSize] = useState<1 | 2 | 3 | 4 | 5 | 'all'>('all');

  // Queue Specific States
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null);
  const [totalFrames, setTotalFrames] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [renderFps, setRenderFps] = useState(0);
  // Fixed: properly declare renderStartTimeRef using useRef
  const renderStartTimeRef = useRef<number>(Date.now());

  const audioContextRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '2k' | '4k'>('1080p');
  const [useHighBitrate, setUseHighBitrate] = useState(true);
  const [isQueuing, setIsQueuing] = useState(false);

  const [bgmUrl, setBgmUrl] = useState<string | undefined>(undefined);
  const [bgmFile, setBgmFile] = useState<Blob | null>(null);
  const [bgmName, setBgmName] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.12);

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 42, textColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.5, verticalOffset: 12, fontFamily: 'Inter', outlineColor: '#000000', outlineWidth: 1, shadowBlur: 2, shadowColor: 'rgba(0,0,0,0.5)', fontWeight: '400'
  });

  useEffect(() => { refreshProjectList(); }, []);
  const refreshProjectList = async () => { const projects = await listProjects('long'); setSavedProjects(projects); };

  useEffect(() => {
    if (bgmFile && !bgmUrl) {
      const url = URL.createObjectURL(bgmFile);
      setBgmUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [bgmFile]);

  // Hybrid Hydration
  const hydrateScenes = async (scenes: Scene[]) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    return Promise.all(scenes.map(async s => {
      // If we have base64 but no buffer, decode it
      if (s.audioBase64 && !s.audioBuffer) {
        try {
          const buffer = await decodeAudioData(s.audioBase64, ctx);
          return {
            ...s,
            audioBuffer: buffer || undefined,
            status: (s.imageUrl || s.videoUrl) ? 'completed' : s.status,
            statusDetail: (s.imageUrl || s.videoUrl) ? 'Ready' : s.statusDetail
          };
        } catch (err) {
          console.error("Hydration failed for scene", s.id, err);
          return s;
        }
      }
      return s;
    }));
  };

  useEffect(() => {
    const loadDraft = async () => {
      if (initialDraft) {
        let hydratedDraft = initialDraft;
        const fullProject = await getProject(initialDraft.id);
        let scriptData = fullProject?.script || initialDraft.data?.script;

        if (scriptData?.scenes) {
          const hydratedScenes = await hydrateScenes(scriptData.scenes);
          scriptData = { ...scriptData, scenes: hydratedScenes };
        }

        setState({
          id: initialDraft.id,
          status: 'idle',
          topic: initialDraft.topic,
          script: scriptData,
          currentStep: ''
        });

        const d = fullProject || hydratedDraft.data;
        if (d.config) {
          setLanguage(d.config.language || 'Thai');
          setDuration(d.config.duration || 10);
          if (d.config.selectedVoice) setSelectedVoice(d.config.selectedVoice);
          if (d.config.selectedStyle) setSelectedStyle(d.config.selectedStyle);
        }
      }
    };
    loadDraft();
  }, [initialDraft]);

  useEffect(() => {
    setSaveStatus(prev => (prev === 'saved' ? 'draft' : prev));
  }, [language, duration, selectedVoice, selectedVisualModel, selectedStyle, subtitleStyle, bgmVolume, bgmName, hideSubtitles, selectedTextModel, state.topic, state.script]);

  const handleGenerateScript = async () => {
    if (!state.topic) return;

    // License Guard
    if (licenseTier === 'free') {
      alert("Upgrade Required: Your current tier does not support AI generation.");
      return;
    }

    setIsGenerating(true); setSummary(null);
    try {
      let scriptData;
      const config = {
        openaiKey: openaiApiKey,
        vertex: { projectId: vertexProjectId, location: vertexLocation, serviceAccountKey: vertexServiceKey, apiKey: vertexApiKey }
      };

      scriptData = await unifiedGenerateScript(state.topic, selectedTextModel, config, {
        mode: selectedStyle,
        language,
        duration,
        aspectRatio,
        selectedStyle
      });
      setState(prev => ({ ...prev, script: scriptData, status: 'idle' }));
      setSaveStatus('saved');


      const projectId = state.id || `long-${Date.now()}`;
      if (!state.id) setState(prev => ({ ...prev, id: projectId }));

      // Auto-save Draft
      DraftService.save({
        id: projectId,
        type: 'long',
        title: scriptData.title || state.topic,
        subtitle: `${duration} mins • ${scriptData.scenes?.length || 0} scenes`,
        createdAt: Date.now(),
        lastModified: Date.now(),
        data: {
          script: scriptData,
          config: { language, duration, selectedVoice, selectedStyle, mode: 'long' }
        }
      });

    } catch (error: any) {
      if (error.code === ERR_INVALID_KEY) { resetKeyStatus(); }
      setState(prev => ({ ...prev, status: 'error', error: error.message }));
    } finally { setIsGenerating(false); }
  };

  const handleRefinePrompt = async (scene: Scene) => {
    try {
      updateScene(scene.id, { statusDetail: "AI Refining..." });
      const refined = await refineVisualPrompt(state.topic, selectedStyle, scene.voiceover);
      updateScene(scene.id, { visual_prompt: refined, statusDetail: "Style Optimized" });
    } catch (err) {
      console.error("Visual refinement failed", err);
    }
  };

  const handleRegenerateScene = async (scene: Scene) => {
    try {
      updateScene(scene.id, { statusDetail: "AI Regenerating...", status: 'generating' });
      const result = await regenerateScene(state.topic, selectedStyle, scene.voiceover, language);
      updateScene(scene.id, {
        voiceover: result.voiceover,
        visual_prompt: result.visual_prompt,
        status: 'pending',
        statusDetail: "Node Re-synced",
        imageUrl: undefined,
        videoUrl: undefined,
        audioBase64: undefined,
        audioBuffer: undefined
      });
    } catch (err) {
      console.error(err);
      updateScene(scene.id, { status: 'failed', statusDetail: "Regen Error" });
    }
  };

  const handleAutoStoryboard = async () => {
    if (!state.script || !state.script.scenes || isStoryboarding) return;
    setIsStoryboarding(true);
    try {
      const scenesForAi = state.script.scenes.map(s => ({ id: s.id, voiceover: s.voiceover }));
      const newPrompts = await generateStoryboards(state.topic, selectedStyle, scenesForAi);
      setState(prev => {
        if (!prev.script) return prev;
        return {
          ...prev,
          script: {
            ...prev.script,
            scenes: prev.script.scenes.map(s => ({
              ...s,
              visual_prompt: newPrompts[s.id] || s.visual_prompt
            }))
          }
        };
      });
      setSaveStatus('draft');
      addLog?.("Storyboard sequence narratively and atmospherically optimized.");
    } catch (err) {
      console.error("Storyboarding failed", err);
    } finally {
      setIsStoryboarding(false);
    }
  };

  const handlePreviewVoiceover = async (scene: Scene) => {
    updateScene(scene.id, { statusDetail: "Synthesizing VO..." });
    try {
      const audioBase64 = await generateVoiceover(scene.voiceover, selectedVoice);
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const audioBuffer = await decodeAudioData(audioBase64, audioCtx);
      updateScene(scene.id, { audioBase64, audioBuffer, statusDetail: "VO Ready" });
    } catch (err: any) {
      updateScene(scene.id, { statusDetail: "VO Error" });
    }
  };


  const processScene = async (scene: Scene) => {
    if (scene.status === 'completed') return;
    updateScene(scene.id, { status: 'generating', assetStage: 'audio', processingProgress: 5, statusDetail: "Syncing Voice..." });
    try {
      const audioBase64 = await generateVoiceover(scene.voiceover, selectedVoice);
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const audioBuffer = await decodeAudioData(audioBase64, audioCtx);
      updateScene(scene.id, { assetStage: 'visual', processingProgress: 35, audioBase64, audioBuffer, statusDetail: "Generating Visual..." });
      let activePrompt = scene.visual_prompt;
      const isVideo = selectedVisualModel.startsWith('veo') || selectedVisualModel.startsWith('banana');
      const isLive = selectedVisualModel === 'live-images';
      let visualResult: string;
      if (isVideo) {
        visualResult = await generateVideoForScene(activePrompt, aspectRatio, selectedVisualModel, selectedStyle, (polls) => {
          const p = Math.min(98, 35 + (polls * 4));
          updateScene(scene.id, { processingProgress: p, statusDetail: `Rendering...` });
        });
      } else if (isLive) {
        visualResult = await generateLiveImageForScene(activePrompt, aspectRatio, selectedStyle);
      } else {
        if (selectedProvider === 'openai') {
          // OpenAI Image
          visualResult = await generateImageWithDalle(activePrompt) as string;
        } else {
          // Gemini Image
          visualResult = await generateImageForScene(activePrompt, selectedVisualModel, aspectRatio, selectedStyle);
        }
      }
      updateScene(scene.id, { status: 'completed', assetStage: undefined, processingProgress: 100, statusDetail: "Synced", videoUrl: (visualResult && (isVideo || isLive)) ? visualResult : undefined, imageUrl: (visualResult && !isVideo && !isLive) ? visualResult : undefined });

      // Auto-save
      setTimeout(() => handleSaveProject(), 500);

    } catch (err: any) {
      updateScene(scene.id, { status: 'failed', processingProgress: 0, error: err.message, statusDetail: "Node Error" });
    }
  };

  const handleGenerateAll = async () => {
    if (!state.script || isProcessingAll) return;
    setIsProcessingAll(true);
    try {
      const pendingScenes = (state.script.scenes || []).filter(s => s.status !== 'completed' && s.status !== 'skipped');

      if (parallelBatchSize === 'all') {
        // Process ALL scenes in parallel
        pendingScenes.forEach(s => updateScene(s.id, { status: 'generating', statusDetail: 'Queued...' }));
        await Promise.allSettled(pendingScenes.map(scene => processScene(scene)));
      } else {
        // Process in batches of N
        const batchSize = parallelBatchSize;
        for (let i = 0; i < pendingScenes.length; i += batchSize) {
          const chunk = pendingScenes.slice(i, i + batchSize);
          chunk.forEach(s => updateScene(s.id, { status: 'generating', statusDetail: 'Queued...' }));
          await Promise.allSettled(chunk.map(scene => processScene(scene)));
        }
      }
      await handleSaveProject();
    } finally {
      setIsProcessingAll(false);
    }
  };

  const updateScene = (sceneId: number, updates: Partial<Scene>) => {
    console.log(`Updating Scene ${sceneId}:`, Object.keys(updates));
    setState(prev => { if (!prev.script) return prev; return { ...prev, script: { ...prev.script, scenes: (prev.script.scenes || []).map(s => String(s.id) === String(sceneId) ? { ...s, ...updates } : s) } }; });
    setSaveStatus('draft'); // This sets to 'draft'.
  };

  const handleReorderScenes = (startIndex: number, endIndex: number) => {
    setState(prev => {
      if (!prev.script || !prev.script.scenes) return prev;
      const scenes = [...prev.script.scenes];
      const [removed] = scenes.splice(startIndex, 1);
      scenes.splice(endIndex, 0, removed);
      return { ...prev, script: { ...prev.script, scenes } };
    });
    setSaveStatus('draft');
  };

  const handleStepReorder = (sceneId: number, direction: 'up' | 'down') => {
    setState(prev => {
      if (!prev.script || !prev.script.scenes) return prev;
      const scenes = [...prev.script.scenes];
      const idx = scenes.findIndex(s => s.id === sceneId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= scenes.length) return prev;
      const [removed] = scenes.splice(idx, 1);
      scenes.splice(newIdx, 0, removed);
      return { ...prev, script: { ...prev.script, scenes } };
    });
    setSaveStatus('draft');
  };

  const handleDeleteScene = (sceneId: number) => {
    if (!confirm("Remove this scene?")) return;
    setState(prev => {
      if (!prev.script || !prev.script.scenes) return prev;
      return { ...prev, script: { ...prev.script, scenes: prev.script.scenes.filter(s => s.id !== sceneId) } };
    });
    setSaveStatus('draft');
  };

  const handleAddScene = () => {
    setState(prev => {
      if (!prev.script) return prev;
      const newScene: Scene = { id: Date.now(), voiceover: "New segment...", visual_prompt: "Visual...", duration_est: 5, status: 'pending' };
      return { ...prev, script: { ...prev.script, scenes: [...(prev.script.scenes || []), newScene] } };
    });
    setSaveStatus('draft');
  };

  const handleSaveProject = async () => {
    if (!state.script && !state.topic) return;
    setSaveStatus('saving');
    const project: ProjectData = {
      id: state.id || `long-${Date.now()}`,
      userId: userId || 'anonymous',
      type: 'long',
      title: state.script?.title || state.topic || "Untilted Documentary",
      topic: state.topic,
      lastUpdated: Date.now(),
      config: { language, duration, aspectRatio, selectedVoice, selectedVisualModel, selectedTextModel, selectedStyle, subtitleStyle, bgmVolume, bgmName, bgmFile, hideSubtitles },
      script: state.script
    };
    try {
      await saveProject(project);

      // Extract Preview Image explicitly
      const validScene = state.script.scenes?.find(s => s.imageUrl || s.videoUrl);
      const previewImageUrl = validScene ? (validScene.imageUrl || validScene.videoUrl) : undefined;

      DraftService.save({
        id: project.id,
        userId: project.userId,
        type: 'long',
        title: project.title,
        subtitle: `${duration} mins`,
        previewImageUrl,
        createdAt: Date.now(),
        lastModified: Date.now(),
        data: {
          script: state.script,
          config: project.config
        }
      });

      setLastSavedTime(project.lastUpdated); setState(prev => ({ ...prev, id: project.id })); setSaveStatus('saved'); refreshProjectList();
    } catch (e) { setSaveStatus('error'); }
  };

  const handleLoadProject = async (project: ProjectData) => {
    const ctx = getAudioContext();
    const updatedScenes = project.script?.scenes ? await Promise.all(project.script.scenes.map(async (scene: any) => {
      if (scene.audioBase64) { try { const buffer = await decodeAudioData(scene.audioBase64, ctx); return { ...scene, audioBuffer: buffer }; } catch (e) { return scene; } }
      return scene;
    })) : [];
    setState({ id: project.id, status: 'idle', topic: project.topic, script: project.script ? { ...project.script, scenes: updatedScenes } : null, currentStep: '' });
    if (project.config) {
      setLanguage(project.config.language || 'Thai'); setDuration(project.config.duration || 10); setSelectedVoice(project.config.selectedVoice || 'Kore'); setSelectedVisualModel(project.config.selectedVisualModel || VISUAL_MODELS[0].id); setSelectedTextModel(project.config.selectedTextModel || TEXT_MODELS[0].id); setSelectedStyle(project.config.selectedStyle || 'Cinematic'); setSubtitleStyle(project.config.subtitleStyle || subtitleStyle); setBgmVolume(project.config.bgmVolume || 0.12); setBgmName(project.config.bgmName || null); setBgmFile(project.config.bgmFile || null); setHideSubtitles(project.config.hideSubtitles || false);
    }
    setShowHistory(false); setSummary(null); setShowSummary(false);
    setTimeout(() => { setSaveStatus('saved'); setLastSavedTime(project.lastUpdated); }, 100);
  };

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgmName(file.name);
    setBgmFile(file);
  };

  const handleExport = async () => {
    if (!playerRef.current) return;
    setIsExporting(true); setExportProgress(0); setExportStage('Initializing...');
    setCurrentFrame(0); setTotalFrames(0); setEtaSeconds(0); setRenderFps(0);
    renderStartTimeRef.current = Date.now();
    let bitrate = 18000000;
    if (exportResolution === '4k') bitrate = 45000000;
    else if (exportResolution === '720p') bitrate = 8000000;
    try {
      const { blob, extension } = await playerRef.current.renderVideo((p, stage, cf, tf) => {
        setExportProgress(p); if (stage) setExportStage(stage);
        if (cf !== undefined) setCurrentFrame(cf); if (tf !== undefined) setTotalFrames(tf);
        if (cf && tf && cf > 0) {
          const elapsed = (Date.now() - renderStartTimeRef.current) / 1000;
          const fps = cf / elapsed; setRenderFps(fps);
          const remainingFrames = tf - cf; setEtaSeconds(remainingFrames / fps);
        }
      }, { resolution: exportResolution as any, bitrate: useHighBitrate ? bitrate : bitrate / 2 });
      setCurrentVideoBlob(blob);

      const filename = `documentary-${Date.now()}.${extension}`;

      if (window.electron) {
        setExportStage('Saving to Desktop...');
        const arrayBuffer = await blob.arrayBuffer();
        const result = await window.electron.video.saveVideo(arrayBuffer, filename);

        if (result.success) {
          setExportProgress(100);
          setExportStage('Production Complete');
          setShowSuccessModal(result.path);
        } else if (!result.canceled) {
          alert("Native Save Failed: " + result.error);
        }
      } else {
        // Auto-download the video in browser
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setExportProgress(100);
        setExportStage('Export Complete!');
      }
    } catch (err: any) {
      alert("Render Failed: " + err.message);
    } finally { setIsExporting(false); }
  };

  const completedScenesCount = (state.script?.scenes || []).filter(s => s.status === 'completed').length || 0;
  const totalScenesCount = (state.script?.scenes || []).length || 0;

  const handleClearAll = () => {
    setState({ id: undefined, status: 'idle', topic: '', script: null, currentStep: '' });
    setBgmUrl(undefined);
    setBgmFile(null);
    setBgmName(null);
    setSummary(null);
    setShowSummary(false);
    setSaveStatus('draft');
    setShowClearConfirmModal(false);
  };

  return (
    <div className="flex flex-col gap-10 pb-20 relative">
      {showStyleSelector && <ArtStyleSelector selectedId={selectedStyle} onSelect={setSelectedStyle} onClose={() => setShowStyleSelector(false)} />}
      {showVoiceSelector && <VoiceSelector selectedId={selectedVoice} onSelect={setSelectedVoice} onClose={() => setShowVoiceSelector(false)} />}

      {/* Clear Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-10 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Clear All Data?</h3>
            <p className="text-neutral-400 text-sm mb-8">This will delete your topic, script, generated scenes, and audio. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowClearConfirmModal(false)} className="flex-1 py-4 bg-white/5 text-neutral-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleClearAll} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all">Clear All</button>
            </div>
          </div>
        </div>
      )}


      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/5">
            {/* Provider Selector */}
            {/* Provider Selector Removed - Gemini Enforced */}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#C5A059]/20">
                  <Book size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Narrative Engine</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">System Ready</p>
                  </div>
                </div>
              </div>
              {(state.topic || state.script) && (
                <button
                  onClick={() => setShowClearConfirmModal(true)}
                  className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all active:scale-95"
                  title="Clear All Data"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Input */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="relative group flex-1">
                  <textarea
                    placeholder="Describe your documentary topic..."
                    className="w-full h-full min-h-[140px] bg-black/40 border border-white/10 rounded-3xl p-6 text-white text-lg font-kanit outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner placeholder:text-neutral-700 resize-none"
                    value={state.topic}
                    onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-neutral-700 uppercase tracking-widest pointer-events-none">
                    AI Prompt
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isGenerating || !state.topic}
                  className="w-full py-4 bg-[#C5A059] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#d4af37] shadow-lg shadow-[#C5A059]/20 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center gap-3"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Generate Script</>}
                </button>
              </div>

              {/* Right Column: Settings */}
              <div className="lg:col-span-5 grid grid-cols-1 gap-3 overflow-visible">

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">TimeFrame</label>
                  <CustomDropdown
                    value={duration.toString()}
                    onChange={(val) => setDuration(parseInt(val))}
                    placeholder="Select Duration"
                    options={[5, 10, 15, 20, 30].map(opt => ({ value: opt.toString(), label: `${opt} Minutes`, icon: <Clock size={14} className="text-white" /> }))}
                  />
                </div>

                {/* AI Model */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Intelligence</label>
                  <CustomDropdown
                    value={selectedTextModel}
                    onChange={setSelectedTextModel}
                    options={availableTextModels.map(m => ({ value: m.id, label: m.name, icon: <BrainCircuit size={14} className="text-emerald-500" /> }))}
                  />
                </div>

                {/* Art Style */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Visual DNA</label>
                  <button
                    onClick={() => setShowStyleSelector(true)}
                    className="w-full bg-black/40 border border-white/10 hover:border-[#C5A059] rounded-2xl px-5 py-3 flex items-center justify-between transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <Palette size={14} className="text-[#C5A059]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-[#C5A059] transition-colors">{selectedStyle}</span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-600" />
                  </button>
                </div>

                {/* Visual Engine (Image/Video Model) */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Visual Engine</label>
                  <CustomDropdown
                    value={selectedVisualModel}
                    onChange={(val) => setSelectedVisualModel(val)}
                    options={availableVisualModels.map(m => ({ value: m.id, label: m.name, icon: <Sparkles size={14} /> }))}
                  />
                </div>

                {/* Voice */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Narrator</label>
                  <button
                    onClick={() => setShowVoiceSelector(true)}
                    className="w-full bg-black/40 border border-white/10 hover:border-[#C5A059] rounded-2xl px-5 py-3 flex items-center justify-between transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <Mic size={14} className="text-[#C5A059]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-[#C5A059] transition-colors">{selectedVoice}</span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-600" />
                  </button>
                </div>

              </div>
            </div>
          </div>

          {state.script && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/5">
              <div className="flex border-b border-white/5 bg-black/20 p-2 gap-2">{[{ id: 'script', label: 'Timeline', icon: <Layers size={16} /> }, { id: 'styling', label: 'Aesthetics', icon: <Palette size={16} /> }, { id: 'seo', label: 'Distribution', icon: <BarChart3 size={16} /> }].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-[#C5A059] text-black shadow-xl' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`}>{t.icon} {t.label}</button>))}</div>
              <div className="p-10 animate-in fade-in duration-500">
                {activeTab === 'script' && (
                  <div className="space-y-8">
                    <div className="p-8 bg-black rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059] border border-white/10"><Rocket size={28} /></div>
                        <div>
                          <h4 className="text-base font-black text-white uppercase tracking-tight">Production Orchestrator</h4>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase">{completedScenesCount} of {totalScenesCount} Ready</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                        <button onClick={handleAutoStoryboard} disabled={isStoryboarding} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 active:scale-95 ${isStoryboarding ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white/5 text-neutral-300 border border-white/10'}`}>
                          <Wand2 size={16} className="text-indigo-500" /> Storyboard
                        </button>
                        {/* Parallel Batch Size Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Parallel</span>
                          <select
                            value={parallelBatchSize}
                            onChange={(e) => setParallelBatchSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                            className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest focus:border-[#C5A059] outline-none cursor-pointer"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="all">ALL</option>
                          </select>
                        </div>
                        <button onClick={handleGenerateAll} disabled={isProcessingAll} className={`px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all shadow-xl flex items-center gap-4 group active:scale-95 ${isProcessingAll ? 'bg-orange-600 text-white animate-pulse' : 'bg-[#C5A059] text-black hover:bg-[#d4af37]'}`}>
                          {isProcessingAll ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                          Synthesize All
                        </button>
                      </div>
                    </div>
                    <SceneManager scenes={state.script.scenes || []} onRegenerate={processScene} onRegenerateScene={handleRegenerateScene} onRefinePrompt={handleRefinePrompt} onAutoStoryboard={handleAutoStoryboard} onGenerateAudio={handlePreviewVoiceover} onToggleSkip={(id) => updateScene(id, { status: 'skipped' })} onUpdateScene={updateScene} onDragReorder={handleReorderScenes} onReorder={handleStepReorder} onDelete={handleDeleteScene} onAddScene={handleAddScene} isProcessingAll={isProcessingAll} />
                  </div>
                )}
                {activeTab === 'styling' && (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3"><Music size={18} className="text-[#C5A059]" /> Audio Production</h4>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="audio/*" onChange={handleBgmUpload} className="hidden" id="long-bgm-up" />
                            <label htmlFor="long-bgm-up" className="px-5 py-2 bg-white/5 text-[#C5A059] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2"><Upload size={12} /> BGM</label>
                          </div>
                        </div>
                        <div className="bg-black p-8 rounded-[2rem] border border-white/5 space-y-8 shadow-inner">
                          <div className="flex justify-between text-[10px] font-black text-neutral-600 uppercase tracking-widest"><span>Atmosphere Level</span><span className="text-[#C5A059]">{Math.round(bgmVolume * 100)}%</span></div>
                          <div className="flex items-center gap-4"><VolumeX size={14} className="text-neutral-800" /><input type="range" min="0" max="0.3" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full accent-[#C5A059] h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer" /><Volume2 size={14} className="text-neutral-600" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between"><h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3"><Type size={18} className="text-[#C5A059]" /> Subtitle Master</h4><button onClick={() => setHideSubtitles(!hideSubtitles)} className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${hideSubtitles ? 'bg-neutral-800' : 'bg-[#C5A059]'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all transform ${hideSubtitles ? 'translate-x-0' : 'translate-x-6'}`}></div></button></div>
                        <div className="p-6 bg-black/50 border border-white/5 rounded-[2.5rem]">
                          <SubtitleEditor style={subtitleStyle} onChange={(upd) => setSubtitleStyle(p => ({ ...p, ...upd }))} presetType="long" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'seo' && (
                  <div className="space-y-12">
                    {/* Mobile Handoff Header */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <Smartphone size={24} className="text-[#C5A059]" />
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Distribution</h4>
                        </div>
                        <button
                          onClick={() => setShowHandoffModal(true)}
                          className="px-6 py-3 bg-[#C5A059] hover:bg-[#d4af37] text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                          <Share2 size={14} /> Mobile Handoff
                        </button>
                      </div>
                    </div>
                    <MetadataManager metadata={state.script} topic={state.topic} style={selectedStyle} onUpdateMetadata={(upd) => setState(p => p.script ? { ...p, script: { ...p.script, ...upd } } : p)} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="xl:w-[450px] shrink-0">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-8 sticky top-12 ring-1 ring-white/5 overflow-hidden">
            {isExporting && (
              <div className="absolute inset-0 bg-black/98 z-50 flex flex-col items-center justify-center p-10 text-center backdrop-blur-3xl animate-in fade-in">
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-white/5 stroke-current" strokeWidth="4" fill="transparent" r="46" cx="50" cy="50" />
                    <circle className="text-[#C5A059] stroke-current transition-all duration-300 shadow-[0_0_30px_rgba(197,160,89,0.3)]" strokeWidth="4" strokeLinecap="round" fill="transparent" r="46" cx="50" cy="50" style={{ strokeDasharray: 289, strokeDashoffset: 289 - (289 * exportProgress) / 100 }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white font-mono">{Math.round(exportProgress)}%</span>
                  </div>
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-[11px] mb-2">{exportStage}</h4>
              </div>
            )}
            <div className="w-full space-y-3">
              <div className="rounded-[2rem] overflow-hidden bg-black shadow-3xl border border-white/5 aspect-video">
                <VideoPlayer ref={playerRef} scenes={(state.script?.scenes || []).filter(s => s.status === 'completed')} isReady={completedScenesCount > 0} aspectRatio="16:9" subtitleStyle={subtitleStyle} bgmVolume={bgmVolume} bgmUrl={bgmUrl} hideSubtitles={hideSubtitles} />
              </div>
            </div>
            {state.script && (
              <div className="w-full space-y-6">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4 shadow-inner">
                  <div className="grid grid-cols-4 gap-2">
                    {(['720p', '1080p', '2k', '4k'] as const).map(res => (
                      <button key={res} onClick={() => setExportResolution(res)} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${exportResolution === res ? 'bg-[#C5A059] border-[#C5A059] text-black' : 'bg-white/5 border-white/10 text-neutral-500'}`}>{res}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleExport} disabled={completedScenesCount === 0 || isExporting} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${completedScenesCount > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white/5 text-neutral-600 border border-white/5'}`}>
                    <Download size={20} /> Master Render
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showHistory && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in fade-in duration-300"><div className="bg-[#0a0a0a] border border-white/5 w-full max-w-4xl rounded-[4rem] p-12 relative shadow-3xl overflow-hidden ring-1 ring-white/5"><button onClick={() => setShowHistory(false)} className="absolute top-10 right-10 text-neutral-600 hover:text-white transition p-2 active:scale-90"><X size={36} /></button><h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-12">Archives</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">{savedProjects.map(proj => (<div key={proj.id} onClick={() => { handleLoadProject(proj); }} className="bg-black border border-white/5 p-8 rounded-[2.5rem] hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all cursor-pointer group shadow-xl"><span className="text-[10px] font-black text-[#C5A059] uppercase block mb-3">{new Date(proj.lastUpdated).toLocaleDateString()}</span><h4 className="text-lg font-bold text-white line-clamp-1 uppercase tracking-tight group-hover:text-[#C5A059] transition-colors">{proj.title}</h4></div>))}{savedProjects.length === 0 && <div className="col-span-full py-20 text-center text-neutral-800 font-black uppercase tracking-[0.4em]">Empty Cluster</div>}</div></div></div>)}

      {/* Confirmation Modal */}
      <ConfirmGenerationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          handleGenerateScript();
        }}
        projectType="long"
        scenesCount={duration * 2}
        isLoading={isGenerating}
      />

      <ExportSuccessModal
        isOpen={!!showSuccessModal}
        onClose={() => setShowSuccessModal(null)}
        filePath={showSuccessModal || ''}
      />
      <MobileHandoffModal
        isOpen={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
        caption={state.script?.longDescription || state.script?.description}
        hashtags={state.script?.hashtags}
      />
    </div>
  );
};

export default LongVideoCreator;
