
import React, { useState, useRef } from 'react';
import {
  X, Mic, Play, Pause, Check, Loader2, Sparkles,
  Volume2, VolumeX, Radio, Zap, Headphones, Info
} from 'lucide-react';
import { generateVoiceover } from '../services/geminiService';
import { decodeAudioData } from '../utils/audioUtils';

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  tags: string[];
  gender: 'Male' | 'Female';
  style: string;
}

export const VOICES: VoiceProfile[] = [
  { id: 'Kore', name: 'Kore', description: 'Deep, professional, and authoritative. Best for tech and news.', style: 'Professional', gender: 'Male', tags: ['Deep', 'Clear', 'Strong'] },
  { id: 'Charon', name: 'Charon', description: 'Mysterious, deep, and cinematic. Perfect for horror and thrillers.', style: 'Dramatic', gender: 'Male', tags: ['Dark', 'Whispery', 'Cinematic'] },
  { id: 'Zephyr', name: 'Zephyr', description: 'Bright, energetic, and engaging. Ideal for marketing and lifestyle.', style: 'Commercial', gender: 'Male', tags: ['Upbeat', 'Friendly', 'Modern'] },
  { id: 'Puck', name: 'Puck', description: 'Calm, soothing, and gentle. Best for ASMR and bedtime stories.', style: 'Chill', gender: 'Female', tags: ['Soft', 'Gentle', 'Warm'] },
  { id: 'Fenrir', name: 'Fenrir', description: 'Bold, narrational, and gritty. Great for epic history and adventure.', style: 'Narrative', gender: 'Male', tags: ['Bold', 'Gravely', 'Epic'] },
  { id: 'Aoede', name: 'Aoede', description: 'Soft, melodic, and musical. Perfect for poetry and philosophy.', style: 'Ethereal', gender: 'Female', tags: ['Musical', 'Sweet', 'Flowy'] },
  // OpenAI Pro Voices
  { id: 'alloy', name: 'Alloy', description: 'Versatile, neutral, and balanced OpenAI voice.', style: 'Balanced', gender: 'Female', tags: ['Natural', 'Pro', 'OpenAI'] },
  { id: 'echo', name: 'Echo', description: 'Confident and warm OpenAI voice.', style: 'Warm', gender: 'Male', tags: ['Confident', 'Clear', 'OpenAI'] },
  { id: 'fable', name: 'Fable', description: 'British-inflected narrative OpenAI voice.', style: 'Storyteller', gender: 'Male', tags: ['British', 'Unique', 'OpenAI'] },
  { id: 'onyx', name: 'Onyx', description: 'Deep, low-frequency OpenAI voice.', style: 'Deep', gender: 'Male', tags: ['Bassey', 'Authoritative', 'OpenAI'] },
  { id: 'nova', name: 'Nova', description: 'Friendly and youthful OpenAI voice.', style: 'Friendly', gender: 'Female', tags: ['Sweet', 'Bright', 'OpenAI'] },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear and articulate OpenAI voice.', style: 'Professional', gender: 'Female', tags: ['Articulate', 'Crisp', 'OpenAI'] },
];

interface VoiceSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedId, onSelect, onClose }) => {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPreview = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) { }
      activeSourceRef.current = null;
    }
    setPreviewingId(null);
  };

  const handlePreview = async (voice: VoiceProfile) => {
    if (previewingId === voice.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewingId(voice.id);

    try {
      const sampleText = `Hello, I am ${voice.name}. System signal synchronized. This is a preview of my synthetic vocal output.`;
      const base64 = await generateVoiceover(sampleText, voice.id);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const buffer = await decodeAudioData(base64, ctx);
      if (!buffer) throw new Error("Decode failed");

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setPreviewingId(null);
      activeSourceRef.current = source;
      source.start();
    } catch (e) {
      console.error("Preview failed", e);
      setPreviewingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-6xl rounded-[4rem] p-12 relative shadow-4xl overflow-hidden ring-1 ring-white/5">

        {/* Background Atmosphere */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C5A059]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
          <Radio size={400} className="mx-auto" />
        </div>

        <button onClick={onClose} className="absolute top-10 right-10 text-neutral-600 hover:text-white transition p-2 active:scale-90 z-20">
          <X size={32} />
        </button>

        {/* Header */}
        <div className="mb-12 relative z-10">
          <div className="flex items-center gap-5 mb-3">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Mic size={28} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Vocal Architecture</h3>
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 ml-0.5">Neural Speech Synthesis Roster</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[55vh] overflow-y-auto pr-4 custom-scrollbar">
          {VOICES.map((voice) => (
            <div
              role="button"
              key={voice.id}
              onClick={() => onSelect(voice.id)}
              className={`group relative flex flex-col text-left rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden active:scale-[0.98] ${selectedId === voice.id
                ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-[0_0_40px_rgba(197,160,89,0.15)]'
                : 'border-white/5 bg-black/40 hover:border-white/20'
                }`}
            >
              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${selectedId === voice.id ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'bg-white/5 text-neutral-500 border-white/10 group-hover:text-white group-hover:border-white/30'}`}>
                    <Headphones size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-neutral-500 border border-white/5">
                      {voice.gender} • {voice.style}
                    </span>
                    {selectedId === voice.id && (
                      <div className="flex items-center gap-1.5 text-emerald-500 animate-in zoom-in duration-300">
                        <Check size={14} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Active Node</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className={`text-2xl font-black uppercase tracking-tight transition-colors ${selectedId === voice.id ? 'text-[#C5A059]' : 'text-white group-hover:text-[#C5A059]'}`}>
                    {voice.name}
                  </h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-medium font-kanit italic mt-2 line-clamp-2">
                    {voice.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {voice.tags.map((tag, i) => (
                    <span key={i} className="text-[7px] font-black uppercase bg-black/60 px-2 py-0.5 rounded-md text-neutral-600 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePreview(voice); }}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${previewingId === voice.id
                      ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      : 'bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {previewingId === voice.id ? (
                      <>
                        <div className="flex items-end gap-0.5 h-3">
                          <div className="w-1 bg-white animate-pulse" style={{ height: '60%' }}></div>
                          <div className="w-1 bg-white animate-pulse" style={{ height: '100%', animationDelay: '0.1s' }}></div>
                          <div className="w-1 bg-white animate-pulse" style={{ height: '40%', animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Listening...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Test Signal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-[#C5A059]" fill="currentColor" />
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Real-time PCM Synthesis v2.5</span>
            </div>
            <div className="flex items-center gap-3">
              <Info size={18} className="text-neutral-600" />
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Latency Optimization: Active</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-16 py-5 bg-[#C5A059] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#d4af37] transition shadow-2xl active:scale-95"
          >
            Lock Vocal Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
