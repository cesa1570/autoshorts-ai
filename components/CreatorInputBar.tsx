import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, Settings2, Send, ChevronDown, ChevronUp, Sparkles, Zap,
    Globe, Bot, Palette, Mic, Volume2, X, Loader2
} from 'lucide-react';

interface CreatorInputBarProps {
    topic: string;
    onTopicChange: (topic: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    placeholder?: string;
    // Settings
    language: 'Thai' | 'English';
    onLanguageChange: (lang: 'Thai' | 'English') => void;
    selectedProvider: 'gemini' | 'openai' | 'vertex';
    onProviderChange: (provider: 'gemini' | 'openai' | 'vertex') => void;
    hasGemini?: boolean;
    hasOpenAI?: boolean;
    hasVertex?: boolean;
    selectedVoice: string;
    onVoiceClick: () => void;
    selectedStyle: string;
    onStyleClick: () => void;
    // Speed mode
    speedMode?: 'fast' | 'quality';
    onSpeedModeChange?: (mode: 'fast' | 'quality') => void;
}

const CreatorInputBar: React.FC<CreatorInputBarProps> = ({
    topic,
    onTopicChange,
    onGenerate,
    isGenerating,
    placeholder = "อธิบายหัวข้อวิดีโอของคุณ...",
    language,
    onLanguageChange,
    selectedProvider,
    onProviderChange,
    hasGemini = true,
    hasOpenAI = false,
    hasVertex = false,
    selectedVoice,
    onVoiceClick,
    selectedStyle,
    onStyleClick,
    speedMode = 'fast',
    onSpeedModeChange
}) => {
    const [showTools, setShowTools] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const toolsRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
        }
    }, [topic]);

    // Close tools panel on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
                setShowTools(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (topic.trim() && !isGenerating) {
                onGenerate();
            }
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto">
                {/* Tools Panel (Collapsible) */}
                {showTools && (
                    <div
                        ref={toolsRef}
                        className="mb-4 p-6 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Settings2 size={16} className="text-[#C5A059]" />
                                เครื่องมือ
                            </h3>
                            <button
                                onClick={() => setShowTools(false)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-neutral-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Language */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Globe size={10} /> ภาษา
                                </label>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl">
                                    {(['Thai', 'English'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => onLanguageChange(lang)}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${language === lang
                                                    ? 'bg-[#C5A059] text-black'
                                                    : 'text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            {lang === 'Thai' ? '🇹🇭 TH' : '🇺🇸 EN'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AI Provider */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Bot size={10} /> AI Model
                                </label>
                                <div className="flex gap-1 bg-black/50 p-1 rounded-xl">
                                    {hasGemini && (
                                        <button
                                            onClick={() => onProviderChange('gemini')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedProvider === 'gemini'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            Gemini
                                        </button>
                                    )}
                                    {hasOpenAI && (
                                        <button
                                            onClick={() => onProviderChange('openai')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${selectedProvider === 'openai'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            GPT-4
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Voice */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Volume2 size={10} /> เสียงบรรยาย
                                </label>
                                <button
                                    onClick={onVoiceClick}
                                    className="w-full py-2 px-3 bg-black/50 border border-white/10 hover:border-[#C5A059] rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all flex items-center justify-between"
                                >
                                    <span className="truncate">{selectedVoice}</span>
                                    <Mic size={12} className="text-[#C5A059] shrink-0" />
                                </button>
                            </div>

                            {/* Style */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Palette size={10} /> สไตล์ภาพ
                                </label>
                                <button
                                    onClick={onStyleClick}
                                    className="w-full py-2 px-3 bg-black/50 border border-white/10 hover:border-[#C5A059] rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all flex items-center justify-between"
                                >
                                    <span className="truncate">{selectedStyle}</span>
                                    <Palette size={12} className="text-[#C5A059] shrink-0" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Input Bar */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-end gap-2 p-3">
                        {/* Add Button */}
                        <button
                            className="shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all"
                            title="Add Scene"
                        >
                            <Plus size={20} />
                        </button>

                        {/* Tools Button */}
                        <button
                            onClick={() => setShowTools(!showTools)}
                            className={`shrink-0 h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${showTools
                                    ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30'
                                    : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                                }`}
                        >
                            <Settings2 size={14} />
                            <span className="hidden sm:inline">เครื่องมือ</span>
                        </button>

                        {/* Input Field */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={topic}
                                onChange={(e) => onTopicChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                rows={1}
                                className="w-full bg-transparent text-white placeholder-neutral-600 resize-none outline-none py-2.5 px-3 text-sm leading-relaxed max-h-[150px]"
                                style={{ minHeight: '40px' }}
                            />
                        </div>

                        {/* Speed Mode Selector */}
                        {onSpeedModeChange && (
                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    {speedMode === 'fast' ? (
                                        <>
                                            <Zap size={12} className="text-yellow-500" />
                                            <span className="hidden sm:inline">รวดเร็ว</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={12} className="text-purple-500" />
                                            <span className="hidden sm:inline">คุณภาพ</span>
                                        </>
                                    )}
                                    <ChevronDown size={12} />
                                </button>

                                {showSpeedMenu && (
                                    <div className="absolute bottom-full mb-2 right-0 w-40 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-150">
                                        <button
                                            onClick={() => { onSpeedModeChange('fast'); setShowSpeedMenu(false); }}
                                            className={`w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${speedMode === 'fast' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <Zap size={14} className="text-yellow-500" />
                                            รวดเร็ว
                                        </button>
                                        <button
                                            onClick={() => { onSpeedModeChange('quality'); setShowSpeedMenu(false); }}
                                            className={`w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${speedMode === 'quality' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <Sparkles size={14} className="text-purple-500" />
                                            คุณภาพสูง
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={onGenerate}
                            disabled={!topic.trim() || isGenerating}
                            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${topic.trim() && !isGenerating
                                    ? 'bg-[#C5A059] text-black hover:bg-[#d4af37] shadow-lg shadow-[#C5A059]/20'
                                    : 'bg-white/5 text-neutral-600 cursor-not-allowed'
                                }`}
                        >
                            {isGenerating ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorInputBar;
