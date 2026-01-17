
import React from 'react';
import { SubtitleStyle } from '../types';
import {
  Type, Move, Palette, Layers, Sparkles,
  LayoutTemplate, CheckCircle2, BoxSelect,
  Zap, MousePointer2, AlignJustify, ArrowRightCircle
} from 'lucide-react';

interface SubtitleEditorProps {
  style: SubtitleStyle;
  onChange: (updates: Partial<SubtitleStyle>) => void;
  presetType?: string;
}

const PRESETS: Record<string, SubtitleStyle> = {
  'Viral Neon': {
    fontSize: 84, textColor: '#FFFF00', backgroundColor: '#000000', backgroundOpacity: 0.0,
    verticalOffset: 35, fontFamily: 'Kanit', outlineColor: '#000000', outlineWidth: 8,
    shadowBlur: 15, shadowColor: 'rgba(0,0,0,1)', fontWeight: '900', animation: 'pop'
  },
  'Netflix Clean': {
    fontSize: 56, textColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.0,
    verticalOffset: 15, fontFamily: 'Inter', outlineColor: '#000000', outlineWidth: 3,
    shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.8)', fontWeight: '600', animation: 'fade'
  },
  'Boxed Highlight': {
    fontSize: 64, textColor: '#FFFFFF', backgroundColor: '#F97316', backgroundOpacity: 1.0,
    verticalOffset: 25, fontFamily: 'Kanit', outlineColor: '#000000', outlineWidth: 0,
    shadowBlur: 0, shadowColor: 'rgba(0,0,0,0)', fontWeight: '700', animation: 'sentence'
  }
};

const ANIMATION_OPTIONS = [
  { id: 'pop', label: 'Viral Pop', icon: Sparkles, desc: 'Word-by-word punchy reveal' },
  { id: 'sentence', label: 'Bounce', icon: Zap, desc: 'Dynamic sentence entry' },
  { id: 'line', label: 'One Line', icon: AlignJustify, desc: 'Single line at a time' },
  { id: 'word', label: 'One Word', icon: Type, desc: 'Single word popup (คำเดียว)' },
  { id: 'typewriter', label: 'Typing', icon: ArrowRightCircle, desc: 'Classic character sequence' },
  { id: 'fade', label: 'Fluid Fade', icon: AlignJustify, desc: 'Elegant smooth transitions' },
  { id: 'none', label: 'Static', icon: MousePointer2, desc: 'No movement' }
];

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({ style, onChange, presetType }) => {

  const getShadowString = () => {
    return `0px 2px ${style.shadowBlur}px ${style.shadowColor || 'rgba(0,0,0,0.5)'}`;
  };

  const getTextStroke = () => {
    return (style.outlineWidth ?? 0) > 0
      ? `${(style.outlineWidth ?? 4) * 0.5}px ${style.outlineColor}`
      : 'none';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-slate-200">

      {/* 1. Live Preview Box */}
      <div className="w-full h-36 bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5 shadow-inner relative group flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-orange-500/5 opacity-50" />
        <div className="z-10 text-center">
          <span
            style={{
              fontFamily: style.fontFamily,
              fontSize: `${style.fontSize * 0.5}px`,
              fontWeight: style.fontWeight,
              color: style.textColor,
              WebkitTextStroke: getTextStroke(),
              textShadow: getShadowString(),
              backgroundColor: style.backgroundOpacity > 0 ? style.backgroundColor : 'transparent',
              padding: style.backgroundOpacity > 0 ? '4px 16px' : '0',
              borderRadius: '12px',
              display: 'inline-block'
            }}
            className="transition-all duration-300 leading-tight select-none font-kanit"
          >
            ตัวอย่างข้อความ
            <br />
            Preview Text
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="px-3 py-1 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/20 flex items-center gap-2">
              <Zap size={10} className="text-[#C5A059]" />
              <span className="text-[8px] font-black uppercase text-[#C5A059] tracking-widest">{style.animation || 'pop'} active</span>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 rounded-full text-[8px] font-black text-neutral-500 uppercase tracking-widest border border-white/5">
          Master UI Preview
        </div>
      </div>

      {/* 2. Text Motion Grid */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-[#C5A059]" /> Text Motion & Physics
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ANIMATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange({ animation: opt.id as any })}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 active:scale-95 group ${style.animation === opt.id
                ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.1)]'
                : 'bg-black/40 border-white/5 text-neutral-600 hover:border-white/20 hover:text-neutral-400'
                }`}
            >
              <opt.icon size={20} strokeWidth={style.animation === opt.id ? 2.5 : 1.5} className="group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-widest block">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Presets */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <LayoutTemplate size={14} className="text-indigo-400" /> LazyAuto Presets
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(PRESETS).map(([name, s]) => {
            const isActive = style.textColor === s.textColor && style.fontFamily === s.fontFamily && style.animation === s.animation;
            return (
              <button
                key={name}
                onClick={() => onChange(s)}
                className={`py-4 px-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${isActive
                  ? 'bg-white/5 border-[#C5A059] text-white shadow-xl'
                  : 'bg-black/40 border-white/5 text-neutral-600 hover:bg-white/5'
                  }`}
              >
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <CheckCircle2 size={16} className={`transition-all ${isActive ? 'text-[#C5A059] scale-110' : 'text-neutral-800'}`} />
                  {name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-white/5">

        {/* Typography Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2"><Type size={16} className="text-blue-400" /> Typography Core</span>
            <span className="text-white bg-white/5 border border-white/10 px-3 py-1 rounded-lg">{style.fontSize}px</span>
          </div>

          <input
            type="range" min="20" max="150" value={style.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-[#C5A059] h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-1">Font Family</label>
              <select
                value={style.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value as any })}
                className="w-full bg-black border border-white/5 p-3 rounded-xl text-white font-bold text-[11px] outline-none focus:border-[#C5A059]/30 transition-all cursor-pointer"
              >
                <option value="Kanit">Kanit (Standard)</option>
                <option value="Prompt">Prompt (Modern)</option>
                <option value="Inter">Inter (Swiss)</option>
                <option value="Sarabun">Sarabun (Classic)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-1">Weight</label>
              <select
                value={style.fontWeight}
                onChange={(e) => onChange({ fontWeight: e.target.value })}
                className="w-full bg-black border border-white/5 p-3 rounded-xl text-white font-bold text-[11px] outline-none focus:border-[#C5A059]/30 transition-all cursor-pointer"
              >
                <option value="400">Normal</option>
                <option value="600">Medium</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-6">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Palette size={16} className="text-pink-400" /> Spectrum Calibration
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] text-neutral-600 uppercase font-black tracking-widest ml-1">Fill</label>
              <div className="flex items-center gap-3 bg-black p-2.5 rounded-xl border border-white/5">
                <input type="color" value={style.textColor} onChange={(e) => onChange({ textColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">{style.textColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] text-neutral-600 uppercase font-black tracking-widest ml-1">Outline</label>
              <div className="flex items-center gap-3 bg-black p-2.5 rounded-xl border border-white/5">
                <input type="color" value={style.outlineColor} onChange={(e) => onChange({ outlineColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">{style.outlineColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[9px] text-neutral-600 font-black uppercase tracking-widest">
              <span>Thickness</span>
              <span className="text-white">{style.outlineWidth}px</span>
            </div>
            <input
              type="range" min="0" max="20" value={style.outlineWidth}
              onChange={(e) => onChange({ outlineWidth: parseInt(e.target.value) })}
              className="w-full accent-blue-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Layer Section */}
        <div className="space-y-6">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BoxSelect size={16} className="text-orange-400" /> Layer Atmosphere
          </label>

          <div className="grid grid-cols-[auto_1fr] gap-6 items-end">
            <div className="bg-black p-2 rounded-xl border border-white/5">
              <input type="color" value={style.backgroundColor} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[9px] text-neutral-600 font-black uppercase tracking-widest">
                <span>Backdrop Density</span>
                <span className="text-white">{Math.round((style.backgroundOpacity ?? 0) * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.1" value={style.backgroundOpacity}
                onChange={(e) => onChange({ backgroundOpacity: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[9px] text-neutral-600 font-black uppercase tracking-widest">
              <span className="flex items-center gap-2">Atmospheric Shadow</span>
              <span className="text-white">{style.shadowBlur}px</span>
            </div>
            <input
              type="range" min="0" max="50" value={style.shadowBlur}
              onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Position Section */}
        <div className="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 space-y-6 flex flex-col justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.02] text-white"><Move size={100} /></div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10">
            <span className="flex items-center gap-2"><Move size={14} className="text-emerald-400" /> Vertical Offset</span>
            <span className="text-white font-mono">{style.verticalOffset}%</span>
          </div>
          <input
            type="range" min="5" max="90" value={style.verticalOffset}
            onChange={(e) => onChange({ verticalOffset: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer relative z-10"
          />
          <p className="text-[9px] text-neutral-700 font-bold uppercase text-center tracking-[0.2em] relative z-10">Adjust focus point from baseline</p>
        </div>

      </div>
    </div>
  );
};

export default SubtitleEditor;
