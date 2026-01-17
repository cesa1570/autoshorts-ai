import React, { useState, useEffect } from 'react';
import { X, Save, Lock, Youtube, Facebook, Video, AlertCircle, Eye, EyeOff, Instagram, CheckCircle2 } from 'lucide-react';
import { SocialPlatform } from '../types';
import { OFFICIAL_APP_CONFIG } from '../config/socialConfig';

interface SocialSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SocialConfig {
    clientId: string;
    clientSecret: string;
}

const SocialSettingsModal: React.FC<SocialSettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SocialPlatform>('youtube');
    const [config, setConfig] = useState<Record<SocialPlatform, SocialConfig>>({
        youtube: { clientId: '', clientSecret: '' },
        facebook: { clientId: '', clientSecret: '' },
        instagram: { clientId: '', clientSecret: '' }, // Shared with FB usually
        tiktok: { clientId: '', clientSecret: '' }
    });
    const [showSecret, setShowSecret] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load from localStorage
            try {
                const stored = localStorage.getItem('social_app_config');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge with defaults to ensure all keys exist
                    setConfig(prev => ({
                        ...prev,
                        ...parsed
                    }));
                }
            } catch (e) { }
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('social_app_config', JSON.stringify(config));
        alert('Configuration Saved! You can now connect your accounts.');
        onClose();
    };

    const updateConfig = (key: keyof SocialConfig, value: string) => {
        setConfig(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], [key]: value }
        }));
    };

    if (!isOpen) return null;

    const platforms: { id: SocialPlatform, label: string, icon: any }[] = [
        { id: 'youtube', label: 'YouTube', icon: Youtube },
        { id: 'facebook', label: 'Facebook', icon: Facebook },
        { id: 'instagram', label: 'Instagram', icon: Instagram },
        { id: 'tiktok', label: 'TikTok', icon: Video },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 relative shadow-2xl ring-1 ring-white/5">
                <button onClick={onClose} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition"><X size={24} /></button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">API Configuration</h3>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Bring Your Own Key (BYOK)</p>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-48 space-y-2">
                        {platforms.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveTab(p.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === p.id ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <p.icon size={16} /> {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="flex-1 space-y-6">

                        {/* Official Keys Status */}
                        {!config[activeTab]?.clientId && OFFICIAL_APP_CONFIG[activeTab === 'instagram' ? 'facebook' : activeTab]?.clientId && (
                            <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 mb-4">
                                <CheckCircle2 size={18} />
                                <div className="text-xs">
                                    <strong className="block font-black uppercase tracking-wider mb-0.5">Official App Keys Active</strong>
                                    Using built-in verified keys. You can simply connect without setup.
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Client ID / App ID</label>
                                <input
                                    type="text"
                                    value={config[activeTab]?.clientId || ''}
                                    onChange={e => updateConfig('clientId', e.target.value)}
                                    placeholder={`Enter ${activeTab} Client ID (Overrides Default)`}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Client Secret</label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? "text" : "password"}
                                        value={config[activeTab]?.clientSecret || ''}
                                        onChange={e => updateConfig('clientSecret', e.target.value)}
                                        placeholder={`Enter ${activeTab} Secret (Overrides Default)`}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none transition-colors pr-10"
                                    />
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                    >
                                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3 text-indigo-300">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="text-[10px] leading-relaxed opacity-80">
                                <strong className="block mb-1 uppercase tracking-wider font-black">Configuration Mode</strong>
                                Enter keys here to <strong>Override</strong> the built-in app keys. (Useful for testing or using your own quota).
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Save Custom Config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialSettingsModal;
