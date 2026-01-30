import React, { useState } from 'react';
import { X, Smartphone, Video, Mic, ArrowRight, Sparkles } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (type: 'shorts' | 'long' | 'podcast', topic: string, language: 'Thai' | 'English') => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [selectedType, setSelectedType] = useState<'shorts' | 'long' | 'podcast' | null>(null);
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState<'Thai' | 'English'>('Thai');

    const handleCreate = () => {
        if (selectedType) {
            onCreate(selectedType, topic, language);
            setSelectedType(null);
            setTopic('');
            onClose();
        }
    };

    if (!isOpen) return null;

    const projectTypes = [
        {
            id: 'shorts' as const,
            icon: Smartphone,
            title: 'Shorts',
            subtitle: 'Vertical 9:16',
            description: 'TikTok, Reels, YouTube Shorts',
            gradient: 'from-pink-500 to-rose-600'
        },
        {
            id: 'long' as const,
            icon: Video,
            title: 'Cinema',
            subtitle: 'Horizontal 16:9',
            description: 'YouTube, Documentary, Long-form',
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'podcast' as const,
            icon: Mic,
            title: 'Podcast',
            subtitle: 'Audio-first',
            description: 'Dual-host AI conversations',
            gradient: 'from-emerald-500 to-teal-600'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 flex items-center justify-center">
                            <Sparkles size={20} className="text-[#C5A059]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Create New Project</h2>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Select content type</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="grid grid-cols-3 gap-4">
                        {projectTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`group relative p-6 rounded-xl border transition-all duration-300 text-left ${selectedType === type.id
                                        ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-[0_0_30px_rgba(197,160,89,0.15)]'
                                        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                                    }`}
                            >
                                {/* Selection indicator */}
                                {selectedType === type.id && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C5A059] flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-black" />
                                    </div>
                                )}

                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${selectedType === type.id ? 'scale-110' : ''}`}>
                                    <type.icon size={28} className="text-white" />
                                </div>

                                <h3 className={`text-lg font-black uppercase tracking-tight mb-1 transition-colors ${selectedType === type.id ? 'text-[#C5A059]' : 'text-white'}`}>
                                    {type.title}
                                </h3>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                                    {type.subtitle}
                                </p>
                                <p className="text-xs text-neutral-600">
                                    {type.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Topic Input (appears after selection) */}
                    {selectedType && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">
                                    Topic or Idea (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., 5 Tips for Better Sleep, History of Ancient Rome..."
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059] transition-colors font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">
                                    Language
                                </label>
                                <div className="flex gap-3">
                                    {(['Thai', 'English'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className={`px-6 py-2 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${language === lang
                                                    ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]'
                                                    : 'border-white/10 text-neutral-500 hover:text-white hover:border-white/30'
                                                }`}
                                        >
                                            {lang === 'Thai' ? '🇹🇭 Thai' : '🇺🇸 English'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-white/10 text-neutral-400 font-bold text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedType}
                        className="px-8 py-3 rounded-xl bg-[#C5A059] text-black font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Start Creating <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;
