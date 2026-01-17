import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, Shield, Eye, EyeOff, CheckCircle2, Info, Settings as SettingsIcon, Zap, Sparkles, Bot } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Settings: React.FC = () => {
    const { apiKey, setApiKey, resetKeyStatus, userTier, setUserTier, dailyTokens, apiRequestsToday, usageHistory, openaiApiKey, setOpenaiApiKey, vertexProjectId, setVertexProjectId, vertexLocation, setVertexLocation, vertexServiceKey, setVertexServiceKey, vertexApiKey, setVertexApiKey } = useApp();
    const [inputValue, setInputValue] = useState(apiKey || '');
    const [openaiInputValue, setOpenaiInputValue] = useState(openaiApiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isOpenaiSaved, setIsOpenaiSaved] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [vertexAuthMode, setVertexAuthMode] = useState<'apiKey' | 'serviceAccount'>('apiKey');
    const [isVertexSaved, setIsVertexSaved] = useState(false);

    useEffect(() => {
        setInputValue(apiKey || '');
    }, [apiKey]);

    useEffect(() => {
        setOpenaiInputValue(openaiApiKey || '');
    }, [openaiApiKey]);

    const handleSave = () => {
        if (!inputValue.trim()) return;
        // User requested single-key mode
        setApiKey(inputValue.trim());
        // setInputValue(''); // Removed to keep the key visible
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleSaveOpenai = () => {
        setOpenaiApiKey(openaiInputValue);
        setIsOpenaiSaved(true);
        setTimeout(() => setIsOpenaiSaved(false), 2000);
    };

    const handleSaveVertex = () => {
        // Since input is bound directly to context, we just show visual feedback
        if (vertexApiKey) {
            setIsVertexSaved(true);
            setTimeout(() => setIsVertexSaved(false), 2000);
        }
    };

    const handleClear = () => {
        resetKeyStatus();
        setInputValue('');
    };

    const handleClearHistory = () => {
        if (confirm("Are you sure you want to clear your usage history? This cannot be undone.")) {
            localStorage.removeItem('gemini-usage-history');
            localStorage.setItem('gemini-usage-count', '0');
            localStorage.setItem('gemini-token-count', '0');
            window.location.reload(); // Simple way to refresh app state
        }
    };

    const handleFactoryReset = () => {
        setIsSaved(true); // repurpose for animation or visual feedback if needed
        localStorage.clear();
        setTimeout(() => window.location.reload(), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">

            <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-white/5 text-[#C5A059] shadow-lg">
                    <Shield size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Configuration</h2>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Global Parameters & Security</p>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 shadow-2xl space-y-16">

                {/* SECTION 1: SECURITY & PRIVACY */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 text-[#C5A059] border-b border-white/5 pb-4">
                        <Shield size={20} />
                        <h3 className="text-lg font-black uppercase tracking-widest">Security & Privacy</h3>
                    </div>

                    {/* Gemini API Key Sub-section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="text-blue-400" size={18} />
                                <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-black text-lg tracking-tight">Google Gemini</h4>
                            </div>
                            <p className="text-neutral-500 text-xs leading-relaxed">
                                Primary engine for high-speed generation.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="relative group">
                                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Key size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#C5A059] transition-colors" />
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 pl-12 pr-14 text-white font-mono text-sm outline-none focus:border-[#C5A059]/50 focus:bg-black transition-all placeholder:text-neutral-700"
                                        />
                                        <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors">
                                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <button onClick={handleSave} disabled={!inputValue.trim()} className={`px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isSaved ? 'bg-emerald-600 text-white' : 'bg-[#C5A059] text-black hover:bg-[#dec07b]'}`}>
                                        {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />} {isSaved ? 'Saved' : 'Save'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* OpenAI Section Removed per User Request */}

                </div>
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest">System Preferences</h3>

            <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard Tier */}
                    <button
                        onClick={() => setUserTier('standard')}
                        className={`relative p-6 rounded-2xl border-2 text-left transition-all ${userTier === 'standard'
                            ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.1)]'
                            : 'bg-black border-white/5 hover:border-white/10 opacity-60 hover:opacity-100'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <Zap size={24} />
                            </div>
                            {userTier === 'standard' && <CheckCircle2 className="text-[#C5A059]" />}
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">Standard (Free)</h4>
                        <ul className="space-y-2 text-xs text-neutral-400">
                            <li className="flex items-center gap-2">✔ Gemini 2.0 Flash (Fast)</li>
                            <li className="flex items-center gap-2">✔ Standard Images</li>
                            <li className="flex items-center gap-2">✔ Silent/Basic Audio</li>
                        </ul>
                    </button>

                    {/* Pro Tier */}
                    <button
                        onClick={() => setUserTier('pro')}
                        className={`relative p-6 rounded-2xl border-2 text-left transition-all ${userTier === 'pro'
                            ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.1)]'
                            : 'bg-black border-white/5 hover:border-white/10 opacity-60 hover:opacity-100'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                <Shield size={24} />
                            </div>
                            {userTier === 'pro' && <CheckCircle2 className="text-[#C5A059]" />}
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">Pro (Paid)</h4>
                        <ul className="space-y-2 text-xs text-neutral-400">
                            <li className="flex items-center gap-2">✔ Gemini 1.5 Pro (Brain)</li>
                            <li className="flex items-center gap-2">✔ HD Images (Imagen 3)</li>
                            <li className="flex items-center gap-2">✔ Dedicated TTS Audio</li>
                        </ul>
                    </button>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 opacity-50 grayscale pointer-events-none select-none">
                <div className="flex items-center justify-between p-6 bg-black/20 border border-white/5 rounded-2xl">
                    <span className="font-mono text-neutral-500 text-sm">GPU Acceleration (WebGL)</span>
                    <div className="w-12 h-6 bg-neutral-800 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-neutral-600 rounded-full"></div></div>
                </div>
            </div>

            {/* Data Management Sub-section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8 border-t border-white/5">
                <div className="lg:col-span-1 space-y-2">
                    <h4 className="text-white font-bold text-sm">Data Sanitization</h4>
                    <p className="text-neutral-500 text-xs leading-relaxed">
                        Manage your local data footprint. "Factory Reset" is irreversible.
                    </p>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                        <div>
                            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Clear Analytics Cache</h5>
                            <p className="text-neutral-500 text-[10px]">Resets usage graphs and token counters.</p>
                        </div>
                        <button onClick={handleClearHistory} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Clear History</button>
                    </div>

                    {!showResetConfirm ? (
                        <div className="flex items-center justify-between p-5 bg-red-900/5 border border-red-500/10 rounded-2xl hover:border-red-500/30 transition-colors cursor-pointer group" onClick={() => setShowResetConfirm(true)}>
                            <div>
                                <h5 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-red-300">Factory Reset</h5>
                                <p className="text-red-500/50 text-[10px]">Wipes all keys, settings, and local projects.</p>
                            </div>
                            <Trash2 size={18} className="text-red-500/50 group-hover:text-red-400 transition-colors" />
                        </div>
                    ) : (
                        <div className="p-5 bg-red-900/20 border border-red-500/30 rounded-2xl animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-3 mb-4 text-red-200">
                                <Trash2 size={20} className="text-red-500" />
                                <span className="text-sm font-bold">Confirm Full Reset?</span>
                            </div>
                            <p className="text-red-200/60 text-xs mb-4">This will delete everything stored in this browser for this app. You will be logged out.</p>
                            <div className="flex gap-3">
                                <button onClick={handleFactoryReset} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20">Yes, Wipe Everything</button>
                                <button onClick={() => setShowResetConfirm(false)} className="px-6 py-3 bg-transparent border border-white/10 text-neutral-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div >
    );
};

export default Settings;
