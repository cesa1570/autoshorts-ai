import React, { useState, useRef } from 'react';
import { Mic, Radio, Play, Sparkles, Loader2, Download, MessageCircle, User, Users, Image as ImageIcon, Zap, Share2, Smartphone, Trash2, Volume2, Globe, Palette, Clock } from 'lucide-react';
import MobileHandoffModal from './MobileHandoffModal';
import { generatePodcastScript, generatePodcastImage, generateVoiceover } from '../services/geminiService';
import { generateScriptWithOpenAI, generateAudioWithOpenAI } from '../services/openaiService';
import { unifiedGenerateScript } from '../services/unifiedAiService';
import { decodeAudioData } from '../utils/audioUtils';
import { DraftService } from '../services/draftService';
import VideoPlayer, { VideoPlayerRef } from './VideoPlayer';
import CustomDropdown from './CustomDropdown';
import { TEXT_MODELS, VISUAL_MODELS } from '../utils/models';
import VoiceSelector from './VoiceSelector';
import { useApp } from '../contexts/AppContext';
import { Draft } from '../types';
import ConfirmGenerationModal from './ConfirmGenerationModal';
import UpgradeRequiredModal from './UpgradeRequiredModal';
import PricingModal from './PricingModal';
import CreatorInputBar from './CreatorInputBar';

// Helper function to convert AudioBuffer to WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    // RIFF header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
};

interface PodcastLine {
    speaker: 1 | 2;
    text: string;
    emotion?: 'happy' | 'sad' | 'sarcastic' | 'excited' | 'neutral' | 'angry' | 'curious';
    hostName?: string;
}

interface PodcastScript {
    title: string;
    dialogue: PodcastLine[];
}

const VISUAL_MODELS_LIST = VISUAL_MODELS.map(m => ({ value: m.id, label: m.name, icon: <ImageIcon size={14} className="text-secondary" /> }));

interface PodcastCreatorProps {
    initialDraft?: Draft | null;
    isActive?: boolean;
}

// Podcast Style Templates
const PODCAST_STYLES = [
    { id: 'interview', name: 'Interview', description: 'Host asks questions, Guest answers', icon: '🎤' },
    { id: 'debate', name: 'Debate', description: 'Two opposing viewpoints', icon: '⚔️' },
    { id: 'storytelling', name: 'Storytelling', description: 'Narrative story with dramatic pauses', icon: '📖' },
    { id: 'news', name: 'News Broadcast', description: 'Formal, informative tone', icon: '📺' },
    { id: 'casual', name: 'Casual Chat', description: 'Friendly conversation between friends', icon: '☕' },
];

const PodcastCreator: React.FC<PodcastCreatorProps> = ({ initialDraft, isActive }) => {
    const { resetKeyStatus, licenseTier, apiKeys, openaiApiKey, userId, vertexProjectId, vertexLocation, vertexServiceKey, vertexApiKey } = useApp();

    // Determine Key Availability
    const hasGemini = apiKeys.length > 0;
    const hasOpenAI = !!openaiApiKey;
    const hasVertex = !!vertexProjectId;

    const [draftId, setDraftId] = useState<string | null>(initialDraft?.id || null);
    const [topic, setTopic] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'vertex'>(hasGemini ? 'gemini' : (hasOpenAI ? 'openai' : (hasVertex ? 'vertex' : 'gemini')));

    // Filter Models based on Keys
    const availableVisualModels = VISUAL_MODELS.filter(m => {
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
    const [language, setLanguage] = useState<string>('Auto');
    const [duration, setDuration] = useState<string>('Short');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [script, setScript] = useState<PodcastScript | null>(null);

    // Host Settings
    const [host1Name, setHost1Name] = useState('Host A');
    const [host2Name, setHost2Name] = useState('Host B');
    const [guest1Voice, setGuest1Voice] = useState('Kore');
    const [guest2Voice, setGuest2Voice] = useState('Fenrir');
    const [selectedVisualModel, setSelectedVisualModel] = useState(availableVisualModels[0]?.id || VISUAL_MODELS[0].id);
    const [selectedTextModel, setSelectedTextModel] = useState(availableTextModels[0]?.id || TEXT_MODELS[0].id);

    // Podcast Style
    const [podcastStyle, setPodcastStyle] = useState('casual');

    // Background Music
    const [bgmFile, setBgmFile] = useState<File | null>(null);
    const [bgmUrl, setBgmUrl] = useState<string | undefined>(undefined);
    const [bgmVolume, setBgmVolume] = useState(0.15);
    const [introFile, setIntroFile] = useState<File | null>(null);
    const [outroFile, setOutroFile] = useState<File | null>(null);

    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [scenes, setScenes] = useState<any[]>([]);
    const [studioImage, setStudioImage] = useState<string | null>(null);
    const [progress, setProgress] = useState('');

    const [showVoice1Selector, setShowVoice1Selector] = useState(false);
    const [showVoice2Selector, setShowVoice2Selector] = useState(false);

    const playerRef = useRef<VideoPlayerRef>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
    const [showHandoffModal, setShowHandoffModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // BGM URL Effect
    React.useEffect(() => {
        if (bgmFile && !bgmUrl) {
            const url = URL.createObjectURL(bgmFile);
            setBgmUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [bgmFile]);

    // Hydrate
    const hydrateScenes = async (scenes: any[]) => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        return Promise.all(scenes.map(async s => {
            if (s.audioBase64 && !s.audioBuffer) {
                try {
                    const buffer = await decodeAudioData(s.audioBase64, audioCtx);
                    return { ...s, audioBuffer: buffer };
                } catch (err) {
                    console.error("Hydration failed", err);
                    return s;
                }
            }
            return s;
        }));
    };

    React.useEffect(() => {
        const loadDraft = async () => {
            if (initialDraft) {
                setDraftId(initialDraft.id);
                const d = initialDraft.data;
                if (d.topic) setTopic(d.topic);
                if (d.script) setScript(d.script);

                if (d.scenes) {
                    const hydrated = await hydrateScenes(d.scenes);
                    setScenes(hydrated);
                    // If scenes exist and have images, restore the studio image
                    const studioImg = hydrated.find(s => s.imageUrl)?.imageUrl;
                    if (studioImg) setStudioImage(studioImg);
                }

                if (d.config) {
                    if (d.config.language) setLanguage(d.config.language);
                    if (d.config.guest1Voice) setGuest1Voice(d.config.guest1Voice);
                    if (d.config.guest2Voice) setGuest2Voice(d.config.guest2Voice);
                    if (d.config.selectedVisualModel) setSelectedVisualModel(d.config.selectedVisualModel);
                }
            }
        };
        loadDraft();
    }, [initialDraft]);

    const saveDraft = (currentScript: PodcastScript | null, currentScenes?: any[]) => {
        if (!currentScript) return;
        const id = draftId || `podcast-${Date.now()}`;
        if (!draftId) setDraftId(id);

        const activeScenes = currentScenes || scenes;
        const validScene = activeScenes.find(s => s.imageUrl);
        const previewImageUrl = validScene ? validScene.imageUrl : undefined;

        DraftService.save({
            id: id,
            userId: userId || 'anonymous',
            type: 'podcast',
            title: currentScript.title,
            subtitle: `${currentScript.dialogue.length} lines • ${topic}`,
            previewImageUrl,
            createdAt: Date.now(),
            lastModified: Date.now(),
            data: {
                topic,
                script: currentScript,
                scenes: activeScenes,
                config: { language, guest1Voice, guest2Voice, selectedVisualModel, selectedTextModel }
            }
        });
    };

    const handleGenerateScript = async () => {
        if (!topic) return;

        // License Guard
        if (licenseTier === 'free') {
            setShowUpgradeModal(true);
            return;
        }

        setIsGeneratingScript(true);
        try {
            const config = {
                openaiKey: openaiApiKey,
                vertex: { projectId: vertexProjectId, location: vertexLocation, serviceAccountKey: vertexServiceKey, apiKey: vertexApiKey }
            };

            const result = await unifiedGenerateScript(topic, selectedTextModel, config, {
                language,
                mode: 'podcast',
                podcastStyle,
                host1Name,
                host2Name,
                duration
            });
            setScript(result);
            saveDraft(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleSynthesize = async () => {
        if (!script || isSynthesizing) return;
        setIsSynthesizing(true);
        setProgress('Initializing Studio...');

        try {
            // 1. Generate Image based on topic
            let imageUrl = studioImage;
            if (!imageUrl) {
                setProgress('Designing Studio Environment...');
                imageUrl = await generatePodcastImage('Cinematic', selectedVisualModel, topic);
                setStudioImage(imageUrl);
            }

            // 2. Synthesize Audio
            const newScenes: any[] = [];
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            for (let i = 0; i < script.dialogue.length; i++) {
                const line = script.dialogue[i];
                setProgress(`Recording Line ${i + 1} of ${script.dialogue.length}...`);

                let audioBase64;
                if (selectedProvider === 'openai') {
                    const voice = line.speaker === 1 ? 'alloy' : 'echo';
                    const dataUrl = await generateAudioWithOpenAI(line.text, voice);
                    audioBase64 = dataUrl?.split(',')[1] || '';
                } else {
                    const voice = line.speaker === 1 ? guest1Voice : guest2Voice;
                    audioBase64 = await generateVoiceover(line.text, voice);
                }

                if (audioCtx.state === 'suspended') await audioCtx.resume();
                const audioBuffer = await decodeAudioData(audioBase64, audioCtx);

                newScenes.push({
                    id: Date.now() + i,
                    visual_prompt: "Podcast Studio",
                    imageUrl: imageUrl,
                    voiceover: line.text,
                    audioBase64: audioBase64,
                    audioBuffer: audioBuffer,
                    duration_est: audioBuffer.duration,
                    status: 'completed'
                });
            }

            setScenes(newScenes);
            setProgress('Mixing Complete!');
            saveDraft(script, newScenes);

        } catch (err) {
            console.error(err);
            alert("Synthesis Failed");
        } finally {
            setIsSynthesizing(false);
        }
    };

    const calculateDuration = () => {
        if (scenes.length === 0) return 0;
        return scenes.reduce((acc, s) => acc + (s.audioBuffer?.duration || 0), 0);
    };

    return (
        <div className="flex flex-col gap-10 pb-20 relative">
            {showVoice1Selector && <VoiceSelector selectedId={guest1Voice} onSelect={setGuest1Voice} onClose={() => setShowVoice1Selector(false)} />}
            {showVoice2Selector && <VoiceSelector selectedId={guest2Voice} onSelect={setGuest2Voice} onClose={() => setShowVoice2Selector(false)} />}

            {/* Clear Confirmation Modal */}
            {showClearConfirmModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-10 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Clear All Data?</h3>
                        <p className="text-neutral-400 text-sm mb-8">This will delete your topic, script, generated audio, and episode. This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowClearConfirmModal(false)} className="flex-1 py-4 bg-white/5 text-neutral-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={() => { setTopic(''); setScript(null); setScenes([]); setStudioImage(null); setDraftId(null); setShowClearConfirmModal(false); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 transition-all">Clear All</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl ring-1 ring-white/5">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 pr-8 border-r border-white/5">
                        <Radio className="text-[#C5A059]" size={24} />
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Podcast Studio</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                            Multi-Speaker Engine Active
                        </span>
                    </div>
                </div>
                {(topic || script || scenes.length > 0) && (
                    <button
                        onClick={() => setShowClearConfirmModal(true)}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all active:scale-95"
                        title="Clear All Data"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Left: Input & Script */}
                <div className="xl:col-span-7 flex flex-col gap-8">
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/5 space-y-8">

                        {/* Provider Selector - Only show if both or valid keys exist */}
                        {(hasGemini || hasOpenAI) && (
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-2 flex gap-2">
                                {hasGemini && (
                                    <button onClick={() => setSelectedProvider('gemini')} className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedProvider === 'gemini' ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/50' : 'text-neutral-500'}`}><Sparkles size={14} /> Gemini 2.0</button>
                                )}
                                {hasOpenAI && (
                                    <button onClick={() => setSelectedProvider('openai')} className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedProvider === 'openai' ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/50' : 'text-neutral-500'}`}><Zap size={14} /> OpenAI</button>
                                )}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059]">
                                <MessageCircle size={20} />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Episode Concept</h2>
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Podcast Topic (e.g., Future of AI, Healthy Eating)..."
                                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-white font-kanit outline-none focus:border-[#C5A059] transition-all"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                            <div className="w-40 flex flex-col gap-2">
                                <div className="w-full">
                                    <CustomDropdown
                                        value={language}
                                        onChange={(val) => setLanguage(val as any)}
                                        placeholder="Language"
                                        options={[
                                            { value: 'Auto', label: 'Auto Detect', icon: <Sparkles size={12} className="text-emerald-500" /> },
                                            { value: 'Thai', label: 'Thai' },
                                            { value: 'English', label: 'English' },
                                            { value: 'Japanese', label: 'Japanese' },
                                            { value: 'Chinese', label: 'Chinese' },
                                        ]}
                                    />
                                </div>
                                <div className="w-full">
                                    <CustomDropdown
                                        value={duration}
                                        onChange={(val) => setDuration(val as any)}
                                        placeholder="Duration"
                                        options={[
                                            { value: 'Short', label: 'Short (1-2m)' },
                                            { value: 'Medium', label: 'Medium (5m)' },
                                            { value: 'Long', label: 'Long (10m+)' },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Style Template Selector */}
                        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">📋</div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">Podcast Style</span>
                                    <span className="text-xs font-bold text-white">Template</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {PODCAST_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setPodcastStyle(style.id)}
                                        className={`p-3 rounded-xl text-center transition-all ${podcastStyle === style.id
                                            ? 'bg-[#C5A059]/20 border border-[#C5A059] text-[#C5A059]'
                                            : 'bg-black/40 border border-white/5 text-neutral-400 hover:border-white/20'}`}
                                    >
                                        <span className="text-xl block mb-1">{style.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{style.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Host Names */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2 mb-2"><User size={12} className="text-blue-400" /> Host 1 Name</label>
                                <input
                                    type="text"
                                    value={host1Name}
                                    onChange={(e) => setHost1Name(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold outline-none focus:border-[#C5A059] transition-all"
                                    placeholder="Host A"
                                />
                            </div>
                            <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2 mb-2"><User size={12} className="text-pink-400" /> Host 2 Name</label>
                                <input
                                    type="text"
                                    value={host2Name}
                                    onChange={(e) => setHost2Name(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold outline-none focus:border-[#C5A059] transition-all"
                                    placeholder="Host B"
                                />
                            </div>
                        </div>

                        {/* Audio Controls */}
                        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">🎵</div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">Audio Production</span>
                                        <span className="text-xs font-bold text-white">BGM & Jingles</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Intro Jingle</label>
                                    <input type="file" accept="audio/*" onChange={(e) => setIntroFile(e.target.files?.[0] || null)} className="hidden" id="intro-up" />
                                    <label htmlFor="intro-up" className={`w-full py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 ${introFile ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-black border border-white/10 text-neutral-500 hover:text-white hover:border-white/20'}`}>
                                        {introFile ? '✓ Loaded' : '+ Upload'}
                                    </label>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Background Music</label>
                                    <input type="file" accept="audio/*" onChange={(e) => setBgmFile(e.target.files?.[0] || null)} className="hidden" id="bgm-up" />
                                    <label htmlFor="bgm-up" className={`w-full py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 ${bgmFile ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-black border border-white/10 text-neutral-500 hover:text-white hover:border-white/20'}`}>
                                        {bgmFile ? '✓ Loaded' : '+ Upload'}
                                    </label>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-2">Outro Jingle</label>
                                    <input type="file" accept="audio/*" onChange={(e) => setOutroFile(e.target.files?.[0] || null)} className="hidden" id="outro-up" />
                                    <label htmlFor="outro-up" className={`w-full py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 ${outroFile ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-black border border-white/10 text-neutral-500 hover:text-white hover:border-white/20'}`}>
                                        {outroFile ? '✓ Loaded' : '+ Upload'}
                                    </label>
                                </div>
                            </div>
                            {bgmFile && (
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">BGM Volume</span>
                                    <input type="range" min="0" max="0.5" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="flex-1 accent-[#C5A059] h-1 bg-neutral-900 rounded-full appearance-none cursor-pointer" />
                                    <span className="text-[10px] font-black text-[#C5A059] w-10 text-right">{Math.round(bgmVolume * 100)}%</span>
                                </div>
                            )}
                        </div>

                        {/* Model Settings */}
                        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">Studio Visuals</span>
                                    <span className="text-xs font-bold text-white">Visual Engine</span>
                                </div>
                            </div>
                            <div className="w-56">
                                <CustomDropdown
                                    value={selectedVisualModel}
                                    onChange={(val) => setSelectedVisualModel(val)}
                                    options={availableVisualModels.map(m => ({ value: m.id, label: m.name, icon: <ImageIcon size={14} className="text-secondary" /> }))}
                                />
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">Script Analysis</span>
                                    <span className="text-xs font-bold text-white">LLM Engine</span>
                                </div>
                            </div>
                            <div className="w-56">
                                <CustomDropdown
                                    value={selectedTextModel}
                                    onChange={(val) => setSelectedTextModel(val)}
                                    options={availableTextModels.map(m => ({ value: m.id, label: m.name, icon: <Sparkles size={14} className="text-emerald-500" /> }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-white/10 p-5 rounded-2xl flex flex-col gap-3">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2"><User size={12} className="text-blue-400" /> Host A Voice</label>
                                <button onClick={() => setShowVoice1Selector(true)} className="text-left text-sm font-bold text-white hover:text-[#C5A059] transition-colors">{guest1Voice}</button>
                            </div>
                            <div className="bg-black/40 border border-white/10 p-5 rounded-2xl flex flex-col gap-3">
                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2"><User size={12} className="text-pink-400" /> Host B Voice</label>
                                <button onClick={() => setShowVoice2Selector(true)} className="text-left text-sm font-bold text-white hover:text-[#C5A059] transition-colors">{guest2Voice}</button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isGeneratingScript || !topic}
                            className="w-full py-4 bg-[#C5A059] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#d4af37] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isGeneratingScript ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Generate Script</>}
                        </button>
                    </div>

                    {script && (
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl ring-1 ring-white/5 flex-1 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{script.title}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowHandoffModal(true)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-[#C5A059] rounded-lg transition-colors active:scale-95"
                                        title="Send to Phone"
                                    >
                                        <Smartphone size={16} />
                                    </button>
                                    <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">
                                        {(script.dialogue || []).length} Lines
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                                {(script.dialogue || []).map((line, idx) => {
                                    const emotionColors: Record<string, string> = {
                                        happy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                        sad: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                        sarcastic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                        excited: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                        neutral: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
                                        angry: 'bg-red-500/20 text-red-400 border-red-500/30',
                                        curious: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                                    };
                                    const emotionEmoji: Record<string, string> = {
                                        happy: '😊', sad: '😢', sarcastic: '😏', excited: '🤩', neutral: '😐', angry: '😠', curious: '🤔'
                                    };
                                    return (
                                        <div key={idx} className={`p-4 rounded-2xl border ${line.speaker === 1 ? 'bg-blue-500/5 border-blue-500/20 ml-0 mr-12' : 'bg-pink-500/5 border-pink-500/20 ml-12 mr-0'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${line.speaker === 1 ? 'text-blue-400' : 'text-pink-400'}`}>
                                                    {line.hostName || (line.speaker === 1 ? host1Name : host2Name)}
                                                </span>
                                                {line.emotion && (
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${emotionColors[line.emotion] || emotionColors.neutral}`}>
                                                        {emotionEmoji[line.emotion] || '😐'} {line.emotion}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-neutral-300 font-kanit text-sm leading-relaxed">{line.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Preview & Synthesis */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl ring-1 ring-white/5 sticky top-8">
                        <div className="aspect-video bg-black rounded-[2rem] border border-white/10 overflow-hidden mb-6 relative shadow-2xl group">
                            {scenes.length > 0 ? (
                                <VideoPlayer
                                    ref={playerRef}
                                    scenes={scenes}
                                    isReady={true}
                                    aspectRatio="16:9"
                                    bgmVolume={0.1}
                                    hideSubtitles={false}
                                    subtitleStyle={{
                                        fontSize: 32,
                                        textColor: '#FFFFFF',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        fontFamily: 'Inter',
                                        verticalOffset: 12
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 space-y-4">
                                    {isSynthesizing ? (
                                        <div className="flex flex-col items-center gap-4 animate-in fade-in">
                                            <div className="w-16 h-16 rounded-full border-4 border-[#C5A059]/30 border-t-[#C5A059] animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-widest text-[#C5A059] animate-pulse">{progress}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Mic size={48} className="opacity-20" />
                                            <p className="text-[10px] uppercase tracking-[0.2em] font-black">Ready to Record</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleSynthesize}
                                disabled={!script || isSynthesizing || scenes.length > 0}
                                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all ${scenes.length > 0 ? 'bg-white/5 text-neutral-500 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'}`}
                            >
                                {scenes.length > 0 ? <><Users size={16} /> Episode Ready</> : <><Mic size={16} /> Synthesize Episode</>}
                            </button>

                            {scenes.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Audio Export */}
                                    <button
                                        onClick={async () => {
                                            // Combine all audio buffers into one
                                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                            const totalDuration = scenes.reduce((acc, s) => acc + (s.audioBuffer?.duration || 0), 0);
                                            const offlineCtx = new OfflineAudioContext(1, audioCtx.sampleRate * totalDuration, audioCtx.sampleRate);

                                            let offset = 0;
                                            for (const scene of scenes) {
                                                if (scene.audioBuffer) {
                                                    const source = offlineCtx.createBufferSource();
                                                    source.buffer = scene.audioBuffer;
                                                    source.connect(offlineCtx.destination);
                                                    source.start(offset);
                                                    offset += scene.audioBuffer.duration;
                                                }
                                            }

                                            const renderedBuffer = await offlineCtx.startRendering();
                                            const wavBlob = audioBufferToWav(renderedBuffer);
                                            const url = URL.createObjectURL(wavBlob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `podcast-audio-${Date.now()}.wav`;
                                            a.click();
                                        }}
                                        className="py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-500 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Volume2 size={14} /> Audio Only
                                    </button>

                                    {/* Video Export */}
                                    <button
                                        onClick={async () => {
                                            if (!playerRef.current) return;
                                            const filename = `podcast-${Date.now()}.mp4`;
                                            try {
                                                const { blob } = await playerRef.current.renderVideo(undefined, { resolution: '1080p', bitrate: 8000000 });
                                                if (window.electron) {
                                                    const arrayBuffer = await blob.arrayBuffer();
                                                    const result = await window.electron.video.saveVideo(arrayBuffer, filename);
                                                    if (result.success) alert(`Saved to: ${result.path}`);
                                                } else {
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = filename;
                                                    a.click();
                                                }
                                            } catch (e: any) {
                                                alert("Export Failed: " + e.message);
                                            }
                                        }}
                                        className="py-4 bg-[#C5A059] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#d4af37] shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Video 1080p
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Confirmation Modal */}
            <ConfirmGenerationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => {
                    setShowConfirmModal(false);
                    handleGenerateScript();
                }}
                projectType="podcast"
                scenesCount={10}
                isLoading={isGeneratingScript}
            />

            {showHandoffModal && (
                <MobileHandoffModal
                    isOpen={showHandoffModal}
                    onClose={() => setShowHandoffModal(false)}
                    title={script?.title}
                    hashtags={[topic.replace(/\s+/g, ''), 'podcast', 'ai']}
                />
            )}

            {showUpgradeModal && (
                <UpgradeRequiredModal
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={() => {
                        setShowUpgradeModal(false);
                        setShowPricingModal(true);
                    }}
                    description="Neural broadcasting pipelines are reserved for premium operators. Upgrade to CINEMA PRO to activate the Podcast Studio."
                />
            )}

            {showPricingModal && (
                <PricingModal
                    onClose={() => setShowPricingModal(false)}
                    currentTier={licenseTier}
                />
            )}

            {/* Gemini-style Bottom Input Bar */}
            <CreatorInputBar
                topic={topic}
                onTopicChange={setTopic}
                onGenerate={() => setShowConfirmModal(true)}
                isGenerating={isGeneratingScript}
                placeholder="อธิบายหัวข้อ Podcast ที่คุณต้องการ..."
                language={language}
                onLanguageChange={setLanguage}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                hasGemini={hasGemini}
                hasOpenAI={hasOpenAI}
                hasVertex={hasVertex}
                selectedVoice={guest1Voice}
                onVoiceClick={() => setShowVoice1Selector(true)}
                selectedStyle={podcastStyle}
                onStyleClick={() => { }}
            />
        </div>
    );
};
export default PodcastCreator;
