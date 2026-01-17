import React, { useState, useRef, useEffect } from 'react';
import { TEXT_MODELS, VISUAL_MODELS, VIDEO_MODELS } from '../utils/models';
import { ProjectState, GeneratorMode, Scene, SubtitleStyle, ScriptData, Draft } from '../types';
import { generateShortsScript, generateImageForScene, generateVoiceover, generateVideoForScene, ERR_INVALID_KEY, refineVisualPrompt, generateLiveImageForScene, regenerateScene, generateStoryboards } from '../services/geminiService';
import { generateScriptWithOpenAI, generateImageWithDalle, generateAudioWithOpenAI } from '../services/openaiService';
import { unifiedGenerateScript } from '../services/unifiedAiService';
import { decodeAudioData } from '../utils/audioUtils';
import { DraftService } from '../services/draftService';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import SceneManager from './SceneManager';
import MetadataManager from './MetadataManager';
import SubtitleEditor from './SubtitleEditor';
import YoutubeUploadModal from './YoutubeUploadModal';
import CustomDropdown from './CustomDropdown';
import ArtStyleSelector, { StyleOption } from './ArtStyleSelector';
import VoiceSelector, { VOICES } from './VoiceSelector';
import ExportSuccessModal from './ExportSuccessModal';
import MobileHandoffModal from './MobileHandoffModal';
import UpgradeRequiredModal from './UpgradeRequiredModal';
import PricingModal from './PricingModal';
import { useApp } from '../contexts/AppContext';
import { saveProject, listProjects, ProjectData, getProject, addToQueue, validateYoutubeMetadata } from '../services/projectService';
import ConfirmGenerationModal from './ConfirmGenerationModal';
import {
  Wand2, Loader2, Save, History, X, Sparkles, Youtube,
  Smartphone, Bot, CheckCircle2, Zap, Download, Type, Move, Palette, Layers, BarChart3, Clock, Eye, EyeOff, Music, PlusCircle, Trash2, ChevronRight, Info,
  Mic, VolumeX, Volume2, Play, Rocket, Upload, FileAudio, ToggleLeft, ToggleRight, Share2,
  Anchor, BookOpen, Lightbulb, TrendingUp, Megaphone, Send, ListPlus, ShieldCheck,
  Paintbrush, Activity, Check, BrainCircuit, Camera, Calendar, AlertTriangle
} from 'lucide-react';

const SaveStatusIndicator = ({ status }: { status: 'draft' | 'saving' | 'saved' | 'error' }) => {
  switch (status) {
    case 'saving': return <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]"><Loader2 size={10} className="animate-spin" /> Syncing Node</div>;
    case 'saved': return <div className="flex items-center gap-2 text-[9px] font-black text-[#C5A059] uppercase tracking-[0.2em]"><CheckCircle2 size={10} /> Master Secured</div>;
    case 'error': return <div className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Protocol Failure</div>;
    default: return <div className="flex items-center gap-2 text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Local Cache</div>;
  }
};

interface ShortsCreatorProps {
  initialTopic?: string;
  initialLanguage?: 'Thai' | 'English';
  apiKey: string;
  initialDraft?: Draft | null;
  isActive?: boolean;
}

const ShortsCreator: React.FC<ShortsCreatorProps> = ({ initialTopic, initialLanguage = 'Thai', apiKey, initialDraft, isActive }) => {
  // Retrieve API Keys from Context
  const { resetKeyStatus, userTier, licenseTier, apiKeys, openaiApiKey, userId, vertexProjectId, vertexLocation, vertexServiceKey, vertexApiKey } = useApp();

  // Determine Key Availability
  const hasGemini = apiKeys.length > 0;
  const hasOpenAI = !!openaiApiKey;
  const hasVertex = !!vertexProjectId;

  // Initial Provider Logic
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'vertex'>((hasGemini) ? 'gemini' : (hasOpenAI ? 'openai' : (hasVertex ? 'vertex' : 'gemini')));

  // Filter Models based on Keys
  const availableVisualModels = [...VISUAL_MODELS, ...VIDEO_MODELS].filter(m => {
    if (m.provider === 'openai' && !hasOpenAI) return false;
    if (m.provider === 'google' && !hasGemini) return false;
    if (m.provider === 'vertex' && !hasVertex) return false;
    return true;
  });
  const availableTextModels = TEXT_MODELS.filter(m => {
    if (m.provider === 'openai' && !hasOpenAI) return false;
    if (m.provider === 'google' && !hasGemini) return false;
    if (m.provider === 'vertex' && !hasVertex) return false;
    return true;
  });
  const [state, setState] = useState<ProjectState>({
    id: initialDraft?.id,
    status: 'idle',
    topic: initialTopic || '',
    script: null,
    currentStep: ''
  });
  const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.FACTS);
  const aspectRatio = '9:16';
  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedVisualModel, setSelectedVisualModel] = useState(availableVisualModels[0]?.id || VISUAL_MODELS[0].id);
  const [selectedTextModel, setSelectedTextModel] = useState(availableTextModels[0]?.id || TEXT_MODELS[0].id);
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  // selectedProvider is already declared above with key check logic
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('Initializing');
  const [activeTab, setActiveTab] = useState<'scenes' | 'viral' | 'seo'>('scenes');
  const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false); // New
  const [saveStatus, setSaveStatus] = useState<'draft' | 'saving' | 'saved' | 'error'>('saved');
  const [hideSubtitles, setHideSubtitles] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [isQueuing, setIsQueuing] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '2k' | '4k'>('1080p');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [parallelBatchSize, setParallelBatchSize] = useState<1 | 2 | 3 | 4 | 5 | 'all'>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const RESOLUTIONS = {
    '720p': { width: 720, height: 1280 },
    '1080p': { width: 1080, height: 1920 },
    '2k': { width: 1440, height: 2560 },
    '4k': { width: 2160, height: 3840 }
  };

  const audioContextRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const [bgmUrl, setBgmUrl] = useState<string | undefined>(undefined);
  const [bgmFile, setBgmFile] = useState<Blob | null>(null);
  const [bgmName, setBgmName] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.12);

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 84, textColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.0, verticalOffset: 35, fontFamily: 'Kanit', outlineColor: '#000000', outlineWidth: 6, shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.8)', fontWeight: '900'
  });

  // Hydrate from Draft
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
        // Try getting full data from IndexedDB
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
          if (d.config.selectedVoice) setSelectedVoice(d.config.selectedVoice);
          if (d.config.selectedStyle) setSelectedStyle(d.config.selectedStyle);
        }
      }
    };
    loadDraft();
  }, [initialDraft]);

  useEffect(() => {
    if (bgmFile && !bgmUrl) {
      const url = URL.createObjectURL(bgmFile); setBgmUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [bgmFile]);

  useEffect(() => { setSaveStatus('draft'); }, [selectedVoice, selectedStyle, subtitleStyle, bgmVolume, voiceSpeed, hideSubtitles, selectedTextModel, selectedProvider, state.topic, state.script]);

  const toggleProvider = () => {
    setSelectedProvider(prev => prev === 'gemini' ? 'openai' : 'gemini');
  };

  const handleGenerateScript = async () => {
    if (!state.topic) return;

    // License Guard
    if (licenseTier === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'generating_script' }));
      let scriptData;

      const config = {
        openaiKey: openaiApiKey,
        vertex: { projectId: vertexProjectId, location: vertexLocation, serviceAccountKey: vertexServiceKey, apiKey: vertexApiKey }
      };

      scriptData = await unifiedGenerateScript(state.topic, selectedTextModel, config, {
        mode,
        language,
        aspectRatio,
        selectedStyle
      });

      setState(prev => ({ ...prev, script: scriptData, status: 'idle' }));
      setSaveStatus('saved');

      const projectId = state.id || `short - ${Date.now()} `;
      if (!state.id) setState(prev => ({ ...prev, id: projectId }));

      // Auto-save Draft
      DraftService.save({
        id: projectId,
        type: 'shorts',
        title: scriptData.title || state.topic,
        subtitle: `${scriptData.scenes?.length || 5} scenes`,
        createdAt: Date.now(),
        lastModified: Date.now(),
        data: {
          script: scriptData,
          config: { language, selectedVoice, selectedStyle, mode }
        }
      });

    } catch (error: any) {
      if (error.code === ERR_INVALID_KEY) { resetKeyStatus(); }
      setState(prev => ({ ...prev, status: 'error', error: error.message }));
    }
  };

  const handleRefinePrompt = async (scene: Scene) => {
    try {
      updateScene(scene.id, { statusDetail: "AI Refining..." });
      const refined = await refineVisualPrompt(state.topic, selectedStyle, scene.voiceover);
      updateScene(scene.id, { visual_prompt: refined, statusDetail: "Style Optimized" });
    } catch (err) { console.error(err); }
  };

  const handleAutoStoryboard = async () => {
    if (!state.script?.scenes) return;
    try {
      setIsProcessingAll(true);
      const scenes = state.script.scenes.map(s => ({ id: s.id, voiceover: s.voiceover }));
      const storyboards = await generateStoryboards(state.topic, selectedStyle, scenes);

      Object.entries(storyboards).forEach(([id, prompt]) => {
        updateScene(parseInt(id), { visual_prompt: prompt as string });
      });
      setIsProcessingAll(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setIsProcessingAll(false);
      setSaveStatus('error');
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
        // Reset assets if text changed significantly? 
        // User probably expects new assets if they re-generate.
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

  const processScene = async (scene: Scene) => {
    if (scene.status === 'completed') return;
    updateScene(scene.id, { status: 'generating', processingProgress: 5, statusDetail: "Authenticating..." });
    try {
      let audioBase64;
      if (selectedProvider === 'openai') {
        // OpenAI TTS (Audio is binary, need to convert to base64 or blob url)
        // The service returns data url
        const dataUrl = await generateAudioWithOpenAI(scene.voiceover);
        // Extract base64 part
        audioBase64 = dataUrl?.split(',')[1] || '';
      } else {
        audioBase64 = await generateVoiceover(scene.voiceover, selectedVoice);
      }
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const audioBuffer = await decodeAudioData(audioBase64, audioCtx);
      updateScene(scene.id, { processingProgress: 30, audioBase64, audioBuffer, statusDetail: "Synthesizing Layers..." });
      const isVideo = selectedVisualModel.startsWith('veo') || selectedVisualModel.startsWith('banana');
      const isLive = selectedVisualModel === 'live-images';
      let result: string;
      if (isVideo) {
        result = await generateVideoForScene(scene.visual_prompt, aspectRatio, selectedVisualModel, selectedStyle, (p) => {
          updateScene(scene.id, { processingProgress: 30 + (p * 5), statusDetail: `Mastering Frames...` });
        });
      } else if (isLive) {
        result = await generateLiveImageForScene(scene.visual_prompt, aspectRatio, selectedStyle);
      } else {
        // Image Generation
        if (selectedProvider === 'openai') {
          result = await generateImageWithDalle(scene.visual_prompt) as string;
        } else {
          result = await generateImageForScene(scene.visual_prompt, selectedVisualModel, aspectRatio, selectedStyle);
        }
      }
      updateScene(scene.id, { status: 'completed', processingProgress: 100, statusDetail: "Verified", imageUrl: (!isVideo && !isLive) ? result : undefined, videoUrl: (isVideo || isLive) ? result : undefined });

      // Auto-save to Disk (IndexedDB) and Draft (LocalStorage)
      // We use a timeout to avoid rapid sequential saves blocking UI
      setTimeout(() => handleSaveProject(), 500);

    } catch (err: any) {
      updateScene(scene.id, { status: 'failed', error: err.message, statusDetail: "Sync Error" });
      throw err;
    }
  };

  const handleGenerateAll = async () => {
    if (!state.script || isProcessingAll) return;
    setIsProcessingAll(true);
    try {
      const pending = state.script.scenes.filter(s => s.status !== 'completed' && s.status !== 'skipped');

      if (parallelBatchSize === 'all') {
        // Process ALL scenes in parallel
        await Promise.all(pending.map(s => processScene(s)));
      } else {
        // Process in batches of N
        const batchSize = parallelBatchSize;
        for (let i = 0; i < pending.length; i += batchSize) {
          const batch = pending.slice(i, i + batchSize);
          await Promise.all(batch.map(s => processScene(s)));
        }
      }

      handleSaveProject();
    } catch (e) { console.error(e); } finally { setIsProcessingAll(false); }
  };

  const updateScene = (sceneId: number, updates: Partial<Scene>) => {
    setState(prev => ({ ...prev, script: prev.script ? { ...prev.script, scenes: prev.script.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s) } : null }));
  };

  const handleReorderScenes = (startIndex: number, endIndex: number) => {
    setState(prev => {
      if (!prev.script) return prev;
      const scenes = [...prev.script.scenes];
      const [removed] = scenes.splice(startIndex, 1);
      scenes.splice(endIndex, 0, removed);
      return { ...prev, script: { ...prev.script, scenes } };
    });
    setSaveStatus('draft');
  };

  const handleStepReorder = (sceneId: number, direction: 'up' | 'down') => {
    setState(prev => {
      if (!prev.script) return prev;
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
    if (!confirm("Terminate scene node?")) return;
    setState(prev => {
      if (!prev.script) return prev;
      return { ...prev, script: { ...prev.script, scenes: prev.script.scenes.filter(s => s.id !== sceneId) } };
    });
    setSaveStatus('draft');
  };

  const handleAddScene = () => {
    setState(prev => {
      if (!prev.script) return prev;
      const newScene: Scene = { id: Date.now(), voiceover: "New segment core...", visual_prompt: "Visual DNA...", duration_est: 5, status: 'pending' };
      return { ...prev, script: { ...prev.script, scenes: [...prev.script.scenes, newScene] } };
    });
    setSaveStatus('draft');
  };

  const handleExport = async () => {
    if (!state.script) return;

    const pendingCount = state.script.scenes.filter(s => s.status !== 'completed' && s.status !== 'skipped').length;
    if (pendingCount > 0) {
      if (confirm(`Unfinished nodes detected(${pendingCount}).Synthesize all before master render ? `)) {
        await handleGenerateAll();
      } else { return; }
    }

    setIsExporting(true); setExportProgress(0); setExportStage('Initializing Stealth Render...');

    // Use Browser Canvas Render (handles blob URLs properly)
    // Native FFmpeg is disabled because it cannot process blob: URLs from API responses
    if (!playerRef.current) {
      alert("Player not ready. Please wait for preview to load.");
      setIsExporting(false);
      return;
    }

    try {
      setExportStage('Rendering Video (Browser Engine)...');
      const { blob } = await playerRef.current.renderVideo((p, stage) => {
        setExportProgress(p);
        setExportStage(stage);
      });
      setCurrentVideoBlob(blob);

      const filename = `lazyautocreator - shorts - ${Date.now()}.mp4`;

      if (window.electron) {
        setExportStage('Saving to Desktop...');
        const arrayBuffer = await blob.arrayBuffer();
        const result = await window.electron.video.saveVideo(arrayBuffer, filename);

        if (result.success) {
          setExportProgress(100);
          setExportStage('Production Complete');
          // alert(`Master Production Saved: \n${ result.path } `);
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
      alert("Render Error: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveProject = async () => {
    if (!state.script) return; setSaveStatus('saving');
    const project: ProjectData = {
      id: state.id || `shorts - ${Date.now()} `,
      userId: userId || 'anonymous',
      type: 'shorts',
      title: state.script.title,
      topic: state.topic,
      lastUpdated: Date.now(),
      config: { mode, aspectRatio, language, selectedVoice, selectedVisualModel, selectedTextModel, selectedStyle, subtitleStyle, bgmName, bgmVolume, hideSubtitles, voiceSpeed },
      script: state.script
    };
    try {
      await saveProject(project);

      // Extract Preview Image explicitly to survive storage stripping
      const validScene = state.script.scenes.find(s => s.imageUrl || s.videoUrl);
      const previewImageUrl = validScene ? (validScene.imageUrl || validScene.videoUrl) : undefined;

      DraftService.save({
        id: project.id,
        userId: project.userId,
        type: 'shorts',
        title: project.title,
        subtitle: `${state.script.scenes.length} scenes • ${mode} `,
        previewImageUrl,
        createdAt: Date.now(),
        lastModified: Date.now(),
        data: {
          script: state.script,
          config: project.config
        }
      });

      setState(prev => ({ ...prev, id: project.id }));
      setSaveStatus('saved');
    } catch (e) { setSaveStatus('error'); }
  };

  const completedScenes = (state.script?.scenes || []).filter(s => s.status === 'completed');
  const completedCount = completedScenes.length;
  const totalCount = (state.script?.scenes || []).length;

  const handleClearAll = () => {
    setState({ id: undefined, status: 'idle', topic: '', script: null, currentStep: '' });
    setBgmUrl(undefined);
    setBgmFile(null);
    setBgmName(null);
    setSaveStatus('draft');
    setShowClearConfirmModal(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-12 max-w-[1500px] mx-auto pb-32">
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

      {/* Clean Preview - Right Side / Center Floating */}
      <div className="xl:w-[420px] shrink-0 sticky top-12 self-start flex flex-col items-center">
        <div className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
          <VideoPlayer ref={playerRef} scenes={completedScenes} isReady={completedCount > 0} aspectRatio="9:16" subtitleStyle={subtitleStyle} hideSubtitles={hideSubtitles} onToggleSubtitles={() => setHideSubtitles(!hideSubtitles)} bgmUrl={bgmUrl} bgmVolume={bgmVolume} voiceSpeed={voiceSpeed} />

          {isExporting && (
            <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-12 text-center backdrop-blur-2xl animate-in fade-in duration-700">
              <div className="relative w-40 h-40 mb-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-white/5 stroke-current" strokeWidth="2" fill="transparent" r="48" cx="50" cy="50" />
                  <circle className="text-[#C5A059] stroke-current transition-all duration-300 shadow-[0_0_30px_rgba(197,160,89,0.4)]" strokeWidth="3" strokeLinecap="round" fill="transparent" r="48" cx="50" cy="50" style={{ strokeDasharray: 301.6, strokeDashoffset: 301.6 - (301.6 * exportProgress) / 100 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white font-mono tracking-tighter">{Math.round(exportProgress)}%</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
                  {exportStage}
                </h4>
                <p className="text-neutral-600 text-[8px] font-black uppercase tracking-widest">High-Fidelity Output • Phase III</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col gap-4 w-full px-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">Output Quality</span>
            <div className="w-32">
              <CustomDropdown
                value={exportResolution}
                onChange={(val) => setExportResolution(val as any)}
                options={[
                  { value: '720p', label: 'HD 720p', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> },
                  { value: '1080p', label: 'FHD 1080p', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
                  { value: '2k', label: 'QHD 2K', icon: <div className="w-2 h-2 rounded-full bg-orange-500" /> },
                  { value: '4k', label: 'UHD 4K', icon: <div className="w-2 h-2 rounded-full bg-purple-500" /> },
                ]}
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={totalCount === 0 || isExporting}
            className={`w - full py - 5 rounded - 2xl font - black uppercase text - [10px] tracking - [0.3em] shadow - 2xl flex items - center justify - center gap - 4 transition - all active: scale - 95 ${completedCount < totalCount ? 'bg-white/5 text-neutral-500 border border-white/5' : 'bg-[#C5A059] text-black hover:bg-[#d4af37]'} `}
          >
            <Download size={18} />
            {completedCount < totalCount ? 'System Standby' : 'Generate Master MP4'}
          </button>

        </div>
      </div>

      {/* Control Surface */}
      {/* Control Surface */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#C5A059]/20">
                <Sparkles size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Create Short</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">AI Video Generator</p>
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
            {/* Left: Input */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative group flex-1">
                <textarea
                  placeholder="Describe your video topic..."
                  className="w-full h-full min-h-[140px] bg-black/40 border border-white/10 rounded-3xl p-6 text-white text-lg font-kanit outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner placeholder:text-neutral-600 resize-none"
                  value={state.topic}
                  onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-neutral-700 uppercase tracking-widest pointer-events-none">
                  Shorts Prompt
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={state.status !== 'idle' || !state.topic}
                className="w-full py-4 bg-[#C5A059] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#d4af37] shadow-lg shadow-[#C5A059]/20 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center gap-3"
              >
                {state.status === 'generating_script' ? (
                  <><Loader2 className="animate-spin" size={16} /> Generating Script...</>
                ) : (
                  <><Wand2 size={16} /> Generate Script</>
                )}
              </button>
            </div>

            {/* Right: Settings */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-3">

              {/* Provider Selector - Only show if both or valid keys exist */}
              {(hasGemini || hasOpenAI) && (
                <div className="bg-black/40 p-1 rounded-xl flex gap-1 mb-6 relative z-20">
                  {hasGemini && (
                    <button
                      onClick={() => setSelectedProvider('gemini')}
                      className={`flex - 1 py - 3 rounded - lg flex items - center justify - center gap - 2 text - [10px] font - black uppercase tracking - widest transition - all ${selectedProvider === 'gemini'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                        } `}
                    >
                      <Sparkles size={14} /> Gemini 2.0 Flash
                    </button>
                  )}
                  {hasOpenAI && (
                    <button
                      onClick={() => setSelectedProvider('openai')}
                      className={`flex - 1 py - 3 rounded - lg flex items - center justify - center gap - 2 text - [10px] font - black uppercase tracking - widest transition - all ${selectedProvider === 'openai'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                        } `}
                    >
                      <Zap size={14} /> OpenAI GPT-4o
                    </button>
                  )}
                  {hasVertex && (
                    <button
                      onClick={() => setSelectedProvider('vertex')}
                      className={`flex - 1 py - 3 rounded - lg flex items - center justify - center gap - 2 text - [10px] font - black uppercase tracking - widest transition - all ${selectedProvider === 'vertex'
                          ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/50'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                        } `}
                    >
                      <Sparkles size={14} /> Vertex AI
                    </button>
                  )}
                </div>
              )}

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Language</label>
                <CustomDropdown
                  value={language}
                  onChange={(val) => setLanguage(val as any)}
                  options={[{ value: 'Thai', label: 'Thai' }, { value: 'English', label: 'English' }]}
                />
              </div>

              {/* Intelligence */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Script Engine</label>
                <CustomDropdown
                  value={selectedTextModel}
                  onChange={(val) => setSelectedTextModel(val as string)}
                  placeholder="Script Model"
                  options={availableTextModels.map(m => ({ value: m.id, label: m.name, icon: <Bot size={14} className="text-emerald-500" /> }))}
                />
              </div>

              {/* Visual Model */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Visual Engine</label>
                <CustomDropdown
                  value={selectedVisualModel}
                  onChange={(val) => setSelectedVisualModel(val as string)}
                  placeholder="Visual Engine"
                  options={availableVisualModels.map(m => ({
                    value: m.id,
                    label: m.name,
                    icon: m.type === 'live' ? <Zap size={14} className="text-yellow-400" /> : <Palette size={14} className="text-pink-400" />
                  }))}
                />
              </div>

              {/* Narrator */}
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

              {/* Style */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-2">Visual Style</label>
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

            </div>
          </div>
        </div>

        {state.script && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex border-b border-white/5 bg-black/40 p-3 gap-3">
              {[{ id: 'scenes', label: 'Timeline', icon: <Layers size={16} /> }, { id: 'viral', label: 'Aesthetics', icon: <Type size={16} /> }, { id: 'seo', label: 'Distribution', icon: <BarChart3 size={16} /> }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex - 1 py - 5 rounded - [2rem] flex items - center justify - center gap - 4 text - [11px] font - black uppercase tracking - [0.3em] transition - all duration - 500 ${activeTab === t.id ? 'bg-[#C5A059] text-black shadow-2xl' : 'text-neutral-500 hover:bg-white/5 hover:text-white'} `}>{t.icon} {t.label}</button>
              ))}
            </div>
            <div className="p-12">
              {activeTab === 'scenes' && (
                <div className="space-y-12">
                  <div className="bg-black p-10 rounded-[3rem] border border-white/5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059] border border-white/5"><Rocket size={28} /></div>
                      <div><h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">Production Cluster</h4><p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">{completedCount} of {totalCount} Sync Ready</p></div>
                    </div>
                    <div className="flex items-center gap-4">
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
                      <button onClick={handleGenerateAll} disabled={isProcessingAll} className={`px - 12 py - 5 rounded - 2xl text - [11px] font - black uppercase tracking - [0.3em] transition - all shadow - 2xl flex items - center gap - 4 active: scale - 95 ${isProcessingAll ? 'bg-white/10 text-white animate-pulse' : 'bg-[#C5A059] text-black hover:bg-[#d4af37]'} `}>
                        {isProcessingAll ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {isProcessingAll ? 'Processing Cluster' : 'Initialize All Nodes'}
                      </button>
                    </div>
                  </div>
                  <SceneManager scenes={state.script.scenes} onRegenerate={processScene} onRegenerateScene={handleRegenerateScene} onRefinePrompt={handleRefinePrompt} onAutoStoryboard={handleAutoStoryboard} onToggleSkip={(id) => updateScene(id, { status: 'skipped' })} onUpdateScene={updateScene} onDragReorder={handleReorderScenes} onReorder={handleStepReorder} onDelete={handleDeleteScene} onAddScene={handleAddScene} isProcessingAll={isProcessingAll} />
                </div>
              )}
              {activeTab === 'viral' && (
                <div className="bg-black p-12 rounded-[3rem] border border-white/5 space-y-12 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-10"><div className="flex items-center gap-4"><Music size={24} className="text-[#C5A059]" /><h4 className="text-2xl font-black text-white uppercase tracking-tighter">Acoustics</h4></div><div className="flex items-center gap-4"><input type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBgmName(f.name); setBgmFile(f); } }} className="hidden" id="bgm-up" /><label htmlFor="bgm-up" className="flex items-center gap-4 px-8 py-4 bg-white/5 text-[#C5A059] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition cursor-pointer shadow-lg"><Upload size={16} />{bgmName || 'Source Audio'}</label></div></div>
                  <div className="space-y-6"><div className="flex justify-between text-[11px] font-black text-neutral-600 uppercase tracking-[0.4em]"><span>Ambient Gain</span><span className="text-[#C5A059]">{Math.round(bgmVolume * 100)}%</span></div><input type="range" min="0" max="0.5" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full accent-[#C5A059] h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer" /></div>
                  <div className="pt-10 border-t border-white/5">
                    <SubtitleEditor style={subtitleStyle} onChange={(upd) => setSubtitleStyle(p => ({ ...p, ...upd }))} presetType="LazyAuto" />
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

      {/* Confirmation Modal */}
      <ConfirmGenerationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          handleGenerateScript();
        }}
        projectType="shorts"
        scenesCount={5}
        isLoading={state.status === 'generating_script'}
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
      // videoUrl={...} // Not available until export, can pass if we have last exported path, but file:// won't work on mobile.
      />

      {showUpgradeModal && (
        <UpgradeRequiredModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            setShowPricingModal(true);
          }}
          description="Your current Operator Identity is restricted to basic observation. Upgrade to CINEMA PRO to enable AI automation and neural rendering."
        />
      )}

      {showPricingModal && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          currentTier={licenseTier}
        />
      )}
    </div>
  );
};

export default ShortsCreator;
