import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, GeneratorMode, ScriptData, Scene, SavedProject } from '../types';
import { generateScript, generateImageForScene, generateVoiceover } from '../services/geminiService';
import { uploadVideoToYouTube } from '../services/youtubeService';
import { saveProject, markProjectUploaded } from '../services/storageService';
import { decodeAudioData } from '../utils/audioUtils';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import { useToast } from './ToastContext';
import { Wand2, FileText, Image as ImageIcon, Music, CheckCircle2, AlertCircle, RefreshCw, Youtube, Upload, Loader2, Download, Volume2, Copy, Search, Hash, Mic, Palette, Save, Edit3, X, RotateCcw, FolderOpen } from 'lucide-react';

// Reliable Public Domain Tracks from Internet Archive
const BGM_OPTIONS = [
  { id: 'ambient', name: 'Ambient (Gymnopedie No. 1)', url: 'https://ia800504.us.archive.org/15/items/ErikSatieGymnopediesGnossiennes/06SatieGymnopdie1.mp3' },
  { id: 'upbeat', name: 'Upbeat (Cheerful)', url: 'https://ia800905.us.archive.org/19/items/jamendo-097430/01.mp3' },
  { id: 'cinematic', name: 'Cinematic (Epic)', url: 'https://ia802609.us.archive.org/26/items/jamendo-017233/01.mp3' },
  { id: 'dark', name: 'Dark (Suspense)', url: 'https://ia800500.us.archive.org/30/items/jamendo-017979/01.mp3' },
  { id: 'none', name: 'No Background Music', url: '' },
];

const VOICE_OPTIONS = [
  { id: 'Kore', name: 'Kore (Female - Calm)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Male - Soft)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Male - Deep)', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Male - Energetic)', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr (Female - Bright)', gender: 'Female' },
];

const IMAGE_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (High Quality)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Fast)' },
];

interface ProjectBuilderProps {
  initialTopic?: string;
  apiKey?: string;
  youtubeToken?: string | null;
  loadedProject?: SavedProject;
}

const ProjectBuilder: React.FC<ProjectBuilderProps> = ({ initialTopic, apiKey, youtubeToken, loadedProject }) => {
  const { addToast } = useToast();

  const [state, setState] = useState<ProjectState>({
    status: 'idle',
    topic: initialTopic || '',
    script: null,
    currentStep: '',
  });

  // Project metadata
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');

  // Progress tracking
  const [progressSteps, setProgressSteps] = useState<{ name: string; status: 'pending' | 'active' | 'done' | 'error' }[]>([]);
  const [currentSceneProgress, setCurrentSceneProgress] = useState({ current: 0, total: 0 });

  // Scene Editor
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editedVoiceover, setEditedVoiceover] = useState('');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [regeneratingScene, setRegeneratingScene] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setState(prev => ({ ...prev, topic: initialTopic }));
    }
  }, [initialTopic]);

  // Load saved project
  useEffect(() => {
    if (loadedProject) {
      setState({
        status: loadedProject.script ? 'ready' : 'idle',
        topic: loadedProject.topic,
        script: loadedProject.script,
        currentStep: '',
      });
      setProjectId(loadedProject.id);
      setProjectName(loadedProject.name);
      setMode(loadedProject.mode);
      addToast('success', `Loaded project: ${loadedProject.name}`);
    }
  }, [loadedProject]);

  const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.FACTS);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'rendering' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');

  // Settings
  const [selectedBgm, setSelectedBgm] = useState<string>(BGM_OPTIONS[0].url);
  const [bgmVolume, setBgmVolume] = useState<number>(0.15);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedImageModel, setSelectedImageModel] = useState<string>('gemini-3-pro-image-preview');

  const playerRef = useRef<VideoPlayerRef>(null);

  const updateProgress = (stepName: string, status: 'pending' | 'active' | 'done' | 'error') => {
    setProgressSteps(prev => {
      const existing = prev.find(s => s.name === stepName);
      if (existing) {
        return prev.map(s => s.name === stepName ? { ...s, status } : s);
      }
      return [...prev, { name: stepName, status }];
    });
  };

  const handleGenerate = async () => {
    if (!state.topic) {
      addToast('warning', 'Please enter a topic first');
      return;
    }

    try {
      setUploadStatus('idle');
      setProgressSteps([]);

      // Step 1: Generate Script
      updateProgress('Script Generation', 'active');
      setState(prev => ({ ...prev, status: 'generating_script', currentStep: 'Writing viral script & SEO...' }));

      const scriptData = await generateScript(state.topic, mode, apiKey);
      updateProgress('Script Generation', 'done');

      setCurrentSceneProgress({ current: 0, total: scriptData.scenes.length });

      setState(prev => ({
        ...prev,
        script: scriptData,
        status: 'generating_assets',
        currentStep: 'Generating AI Voiceovers & Visuals...'
      }));

      // Step 2: Generate Assets
      updateProgress('Visual & Audio Assets', 'active');
      const processedScenes: Scene[] = [];

      for (let i = 0; i < scriptData.scenes.length; i++) {
        const scene = scriptData.scenes[i];
        setCurrentSceneProgress({ current: i + 1, total: scriptData.scenes.length });
        setState(prev => ({ ...prev, currentStep: `Scene ${i + 1}/${scriptData.scenes.length}: Generating...` }));

        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        try {
          const [base64Image, base64Audio] = await Promise.all([
            generateImageForScene(scene.visual_prompt, apiKey, selectedImageModel),
            generateVoiceover(scene.voiceover, apiKey, selectedVoice)
          ]);

          const audioBuffer = await decodeAudioData(base64Audio);

          processedScenes.push({
            ...scene,
            imageUrl: base64Image,
            audioBuffer: audioBuffer
          });
        } catch (sceneError) {
          console.error(`Failed scene ${scene.id}`, sceneError);
          addToast('warning', `Scene ${scene.id} had issues, continuing...`);
        }
      }

      if (processedScenes.length === 0) {
        throw new Error("Failed to generate any scenes. Check API Key/Quota.");
      }

      updateProgress('Visual & Audio Assets', 'done');

      setState(prev => ({
        ...prev,
        status: 'ready',
        currentStep: 'Complete!',
        script: { ...scriptData, scenes: processedScenes }
      }));

      addToast('success', `Generated ${processedScenes.length} scenes successfully!`);

    } catch (error: any) {
      console.error(error);
      updateProgress('Script Generation', 'error');
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || "An unexpected error occurred."
      }));
      addToast('error', error.message || 'Generation failed');
    }
  };

  const handleSaveProject = () => {
    if (!state.topic) {
      addToast('warning', 'Nothing to save yet');
      return;
    }

    const name = projectName || `${state.topic.substring(0, 30)}...`;
    const saved = saveProject(name, state.topic, mode, state.script, projectId || undefined);
    setProjectId(saved.id);
    setProjectName(saved.name);
    addToast('success', 'Project saved!');
  };

  const handleYouTubeUpload = async () => {
    if (state.status !== 'ready' || !state.script) return;

    const token = youtubeToken;
    if (!token) {
      addToast('warning', 'Please connect YouTube in Settings first');
      return;
    }

    try {
      setUploadStatus('rendering');

      if (!playerRef.current) throw new Error("Player not ready");
      const videoBlob = await playerRef.current.renderVideo();

      setUploadStatus('uploading');
      await uploadVideoToYouTube(
        videoBlob,
        state.script.seoTitle || state.script.title,
        state.script.longDescription || state.script.description,
        token
      );

      setUploadStatus('success');

      if (projectId) {
        markProjectUploaded(projectId);
      }

      addToast('success', 'Video uploaded to YouTube!');
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setUploadError(err.message || "Upload failed");
      addToast('error', err.message || 'Upload failed');
    }
  };

  const handleDownload = async () => {
    if (!playerRef.current) return;
    try {
      setUploadStatus('rendering');
      addToast('info', 'Rendering video...');
      const blob = await playerRef.current.renderVideo();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      a.download = `autoshorts-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setUploadStatus('idle');
      addToast('success', 'Video downloaded!');
    } catch (err) {
      console.error(err);
      setUploadStatus('idle');
      addToast('error', 'Download failed');
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label || 'Text'} copied!`);
  };

  // Scene Editor Functions
  const startEditingScene = (sceneIndex: number) => {
    if (!state.script) return;
    const scene = state.script.scenes[sceneIndex];
    setEditingScene(sceneIndex);
    setEditedVoiceover(scene.voiceover);
    setEditedPrompt(scene.visual_prompt);
  };

  const cancelEditing = () => {
    setEditingScene(null);
    setEditedVoiceover('');
    setEditedPrompt('');
  };

  const regenerateScene = async (regenerateImage: boolean, regenerateVoice: boolean) => {
    if (editingScene === null || !state.script) return;

    setRegeneratingScene(true);
    const scene = state.script.scenes[editingScene];

    try {
      let newImageUrl = scene.imageUrl;
      let newAudioBuffer = scene.audioBuffer;

      if (regenerateImage) {
        addToast('info', 'Regenerating image...');
        newImageUrl = await generateImageForScene(editedPrompt, apiKey, selectedImageModel);
      }

      if (regenerateVoice) {
        addToast('info', 'Regenerating voice...');
        const base64Audio = await generateVoiceover(editedVoiceover, apiKey, selectedVoice);
        newAudioBuffer = await decodeAudioData(base64Audio);
      }

      // Update scene in script
      const updatedScenes = [...state.script.scenes];
      updatedScenes[editingScene] = {
        ...scene,
        voiceover: editedVoiceover,
        visual_prompt: editedPrompt,
        imageUrl: newImageUrl,
        audioBuffer: newAudioBuffer
      };

      setState(prev => ({
        ...prev,
        script: { ...prev.script!, scenes: updatedScenes }
      }));

      addToast('success', 'Scene updated!');
      cancelEditing();
    } catch (err: any) {
      addToast('error', err.message || 'Regeneration failed');
    } finally {
      setRegeneratingScene(false);
    }
  };

  const progressPercentage = state.status === 'generating_assets' && currentSceneProgress.total > 0
    ? Math.round((currentSceneProgress.current / currentSceneProgress.total) * 100)
    : state.status === 'generating_script' ? 20 : state.status === 'ready' ? 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Panel: Controls */}
      <div className="flex flex-col gap-6">

        {/* Input Section */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wand2 className="text-purple-400" /> Content Generator
            </h2>
            <button
              onClick={handleSaveProject}
              disabled={!state.topic}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> Save
            </button>
          </div>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="My Viral Short"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none transition text-sm"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Topic / Keyword</label>
              <input
                type="text"
                placeholder="e.g. Ancient Egyptian Mysteries, Coding Facts..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none transition"
                value={state.topic}
                onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                disabled={state.status !== 'idle' && state.status !== 'ready' && state.status !== 'error'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Vibe / Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(GeneratorMode).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${mode === m ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Settings */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Palette size={12} /> Image Model
                </label>
                <select
                  value={selectedImageModel}
                  onChange={(e) => setSelectedImageModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {IMAGE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Mic size={12} /> Narrator Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {VOICE_OPTIONS.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="pt-2 border-t border-slate-700 mt-2">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Music size={16} /> Background Music
              </label>

              <select
                value={selectedBgm}
                onChange={(e) => setSelectedBgm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none mb-3"
              >
                {BGM_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.url}>{opt.name}</option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                <Volume2 size={16} className="text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={!selectedBgm}
                />
                <span className="text-xs text-slate-400 w-8">{Math.round(bgmVolume * 100)}%</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!state.topic || (state.status !== 'idle' && state.status !== 'ready' && state.status !== 'error')}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition mt-2
                ${!state.topic ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                  state.status === 'idle' || state.status === 'ready' || state.status === 'error' ?
                    'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20' :
                    'bg-slate-700 text-slate-400 cursor-wait'}`}
            >
              {state.status === 'idle' || state.status === 'ready' || state.status === 'error' ? (
                <><Wand2 size={20} /> Generate Content</>
              ) : (
                <>
                  <RefreshCw className="animate-spin" /> Processing...
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex-1 overflow-y-auto max-h-[400px]">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Workflow Status</h3>

          {/* Progress Bar */}
          {state.status !== 'idle' && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{state.currentStep}</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {progressSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`p-1 rounded-full ${step.status === 'done' ? 'bg-green-500 text-black' :
                  step.status === 'active' ? 'bg-purple-500 text-white animate-pulse' :
                    step.status === 'error' ? 'bg-red-500 text-white' :
                      'bg-slate-700 text-slate-400'}`}>
                  {step.status === 'done' ? <CheckCircle2 size={14} /> :
                    step.status === 'active' ? <Loader2 size={14} className="animate-spin" /> :
                      step.status === 'error' ? <AlertCircle size={14} /> :
                        <FileText size={14} />}
                </div>
                <span className={`text-sm ${step.status === 'done' ? 'text-green-400' : step.status === 'active' ? 'text-purple-400' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
            ))}

            {state.status === 'error' && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3 text-red-400">
                <AlertCircle className="shrink-0" />
                <div>
                  <p className="font-bold text-sm">Error</p>
                  <p className="text-xs">{state.error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Preview & Upload */}
      <div className="flex flex-col h-full gap-6">

        {/* Video Player Container */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="bg-black/40 px-3 py-1 rounded text-xs text-slate-400 border border-slate-700">9:16 Shorts</span>
          </div>

          <VideoPlayer
            ref={playerRef}
            scenes={state.script?.scenes || []}
            isReady={state.status === 'ready'}
            bgmUrl={selectedBgm}
            bgmVolume={bgmVolume}
          />

          {/* Export Actions */}
          {state.status === 'ready' && (
            <div className="mt-6 w-full max-w-[320px] space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={uploadStatus === 'rendering' || uploadStatus === 'uploading'}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={handleYouTubeUpload}
                  disabled={!youtubeToken || uploadStatus === 'rendering' || uploadStatus === 'uploading'}
                  className="flex-[2] flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#CC0000] text-white py-2.5 rounded-lg text-sm font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Youtube size={18} /> {youtubeToken ? 'Upload' : 'Connect First'}
                </button>
              </div>

              {uploadStatus === 'rendering' && (
                <div className="flex items-center justify-center gap-2 text-purple-400 bg-purple-500/10 py-2 rounded-lg border border-purple-500/20 text-sm">
                  <Loader2 className="animate-spin" size={16} /> Rendering...
                </div>
              )}

              {uploadStatus === 'uploading' && (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 py-2 rounded-lg border border-blue-500/20 text-sm">
                  <Upload className="animate-bounce" size={16} /> Uploading...
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="flex items-center justify-center gap-2 text-green-400 bg-green-500/10 py-2 rounded-lg border border-green-500/20 text-xs">
                  <CheckCircle2 size={14} /> Upload Successful!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400 bg-red-500/10 py-2 rounded-lg border border-red-500/20 text-xs">
                    <AlertCircle size={14} /> {uploadError}
                  </div>
                  <button onClick={() => setUploadStatus('idle')} className="text-xs text-slate-500 mt-1 underline">Reset</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scene Editor */}
        {state.script && state.status === 'ready' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Edit3 size={14} className="text-purple-400" /> Scene Editor
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {state.script.scenes.map((scene, idx) => (
                <div key={scene.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg">
                  {scene.imageUrl && (
                    <img src={scene.imageUrl} className="w-12 h-16 object-cover rounded" alt="" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-medium text-white truncate">Scene {idx + 1}</p>
                    <p className="text-[10px] text-slate-400 truncate">{scene.voiceover.substring(0, 50)}...</p>
                  </div>
                  <button
                    onClick={() => startEditingScene(idx)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scene Edit Modal */}
        {editingScene !== null && state.script && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Edit Scene {editingScene + 1}</h3>
                <button onClick={cancelEditing} className="text-slate-500 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Voiceover Text</label>
                  <textarea
                    value={editedVoiceover}
                    onChange={(e) => setEditedVoiceover(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Image Prompt (English)</label>
                  <textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => regenerateScene(false, true)}
                  disabled={regeneratingScene}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Voice Only
                </button>
                <button
                  onClick={() => regenerateScene(true, false)}
                  disabled={regeneratingScene}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Image Only
                </button>
                <button
                  onClick={() => regenerateScene(true, true)}
                  disabled={regeneratingScene}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {regeneratingScene ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Both
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEO Data Section */}
        {state.script && state.status === 'ready' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="text-blue-400" /> SEO Metadata
              </h3>
            </div>

            <div className="space-y-4">
              {/* SEO Title */}
              <div className="group relative">
                <label className="text-xs text-slate-500 font-semibold uppercase mb-1 block">Title</label>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-white pr-10">
                  {state.script.seoTitle}
                </div>
                <button
                  onClick={() => copyToClipboard(state.script!.seoTitle, 'Title')}
                  className="absolute right-2 top-7 p-1 text-slate-500 hover:text-white bg-slate-800 rounded hover:bg-slate-700"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Long Description */}
              <div className="group relative">
                <label className="text-xs text-slate-500 font-semibold uppercase mb-1 block">Description</label>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300 pr-10 h-24 overflow-y-auto">
                  {state.script.longDescription}
                </div>
                <button
                  onClick={() => copyToClipboard(state.script!.longDescription, 'Description')}
                  className="absolute right-2 top-7 p-1 text-slate-500 hover:text-white bg-slate-800 rounded hover:bg-slate-700"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Hashtags */}
              <div className="group relative">
                <label className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1">
                  <Hash size={12} /> Hashtags
                </label>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-blue-300 pr-10">
                  {state.script.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')}
                </div>
                <button
                  onClick={() => copyToClipboard(state.script!.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' '), 'Hashtags')}
                  className="absolute right-2 top-7 p-1 text-slate-500 hover:text-white bg-slate-800 rounded hover:bg-slate-700"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Copy All */}
              <button
                onClick={() => {
                  if (!state.script) return;
                  const fullData = `TITLE:\n${state.script.seoTitle}\n\nDESCRIPTION:\n${state.script.longDescription}\n\nTAGS:\n${state.script.seoKeywords}\n\nHASHTAGS:\n${state.script.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')}`;
                  copyToClipboard(fullData, 'All Metadata');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Copy All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBuilder;