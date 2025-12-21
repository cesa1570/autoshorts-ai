
import React, { useState, useEffect, createContext, useContext } from 'react';
import { LayoutDashboard, Video, Zap, Newspaper, Menu, X, Share2, Clapperboard, Github, Key, Mic, Settings, Eye, EyeOff, Check, Trash2, Home } from 'lucide-react';
import { UserButton, useUser } from "@clerk/clerk-react";
import { AuthGuard } from './components/AuthComponents';
import Dashboard from './components/Dashboard';
import ProjectBuilder from './components/ProjectBuilder';
import LongVideoCreator from './components/LongVideoCreator';
import TrendingNews from './components/TrendingNews';
import SocialPostGenerator from './components/SocialPostGenerator';
import PodcastCreator from './components/PodcastCreator';
import PricingPage from './components/PricingPage';
import { ERR_INVALID_KEY, getCustomApiKey, setCustomApiKey, clearCustomApiKey } from './services/geminiService';

// Check if we're deployed to production (not localhost)
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

interface AppContextType {
  hasSelectedKey: boolean;
  openKeySelection: () => Promise<void>;
  resetKeyStatus: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'long' | 'news' | 'social' | 'podcast'>('create');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'Thai' | 'English'>('Thai');
  const [hasSelectedKey, setHasSelectedKey] = useState(false);

  // API Key Settings Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [elevenLabsInput, setElevenLabsInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [showPricing, setShowPricing] = useState(false);


  const checkKeyStatus = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      setHasSelectedKey(await (window as any).aistudio.hasSelectedApiKey());
    }
  };

  useEffect(() => {
    // === PRODUCTION MODE: Skip API key prompt entirely ===
    if (isProduction) {
      setHasSelectedKey(true); // Backend proxy handles auth
      return;
    }

    // === LOCAL DEV MODE: Check for custom key ===
    checkKeyStatus();
    const customKey = getCustomApiKey();
    if (customKey) {
      setHasCustomKey(true);
      setHasSelectedKey(true);
    }
    const xiKey = localStorage.getItem('elevenlabs_api_key');
    if (xiKey) setHasElevenLabsKey(true);
  }, []);

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // MUST assume success after trigger per instructions to avoid race conditions
      setHasSelectedKey(true);
    }
  };

  const resetKeyStatus = () => {
    setHasSelectedKey(false);
  };

  // API Key Modal Functions
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setCustomApiKey(apiKeyInput.trim());
      setHasCustomKey(true);
      setHasSelectedKey(true);
    }
    if (elevenLabsInput.trim()) {
      localStorage.setItem('elevenlabs_api_key', elevenLabsInput.trim());
      setHasElevenLabsKey(true);
    }
    setShowApiKeyModal(false);
    setApiKeyInput('');
    setElevenLabsInput('');
    setShowApiKey(false);
    // Refresh the page to apply new key
    window.location.reload();
  };

  const handleClearApiKey = () => {
    clearCustomApiKey();
    localStorage.removeItem('elevenlabs_api_key');
    setHasCustomKey(false);
    setHasElevenLabsKey(false);
    setApiKeyInput('');
    setElevenLabsInput('');
    setShowApiKeyModal(false);
    window.location.reload();
  };

  const openApiKeyModal = () => {
    const existingKey = getCustomApiKey();
    if (existingKey) {
      setApiKeyInput(existingKey);
    }
    const xiKey = localStorage.getItem('elevenlabs_api_key');
    if (xiKey) setElevenLabsInput(xiKey);
    setShowApiKeyModal(true);
  };

  const handleNewsTopicSelect = (topic: string, type: 'video' | 'social' | 'podcast', region: 'global' | 'thailand') => {
    setSelectedTopic(topic);
    setSelectedLanguage(region === 'global' ? 'English' : 'Thai');
    if (type === 'video') setActiveTab('create');
    else if (type === 'podcast') setActiveTab('podcast');
    else setActiveTab('social');
    setMobileMenuOpen(false);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm group ${activeTab === id
        ? 'bg-purple-600/10 text-purple-400 border-r-4 border-purple-500'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-purple-400' : 'text-slate-500 group-hover:text-white'} />
      {label}
    </button>
  );

  return (
    <AuthGuard>
      <AppContext.Provider value={{ hasSelectedKey, openKeySelection: handleOpenKeySelection, resetKeyStatus }}>
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
          <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50 bg-slate-900 border-r border-slate-800/50 shadow-2xl">
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center gap-3 mb-12 mt-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl">
                  <Zap className="text-white" size={22} fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white leading-none tracking-tight">AutoShorts</h1>
                  <span className="text-[10px] text-purple-400 font-black tracking-[0.2em] uppercase">AI Engine</span>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Production</p>
                <NavItem id="create" label="Shorts Creator" icon={Video} />
                <NavItem id="long" label="Long Video" icon={Clapperboard} />
                <NavItem id="podcast" label="Podcast Studio" icon={Mic} />
                <NavItem id="social" label="Social Post" icon={Share2} />
                <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 mt-8">Intelligence</p>
                <NavItem id="news" label="Trending News" icon={Newspaper} />
                <NavItem id="dashboard" label="Analytics" icon={LayoutDashboard} />
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 mb-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-all" onClick={() => setShowPricing(true)}>
                  <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9", userButtonPopoverCard: "bg-slate-900 border border-slate-700 shadow-2xl" } }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">My Account</span>
                    <span className="text-[9px] text-teal-400 font-bold uppercase flex items-center gap-1">Pro Plan <Settings size={10} /></span>
                  </div>
                </div>
                <button onClick={openApiKeyModal} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${hasCustomKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : hasSelectedKey ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                  <div className="flex items-center gap-2"><Key size={14} />{hasCustomKey ? 'Custom API Key' : hasSelectedKey ? 'AI Studio Key' : 'Set API Key'}</div>
                  <Settings size={14} />
                </button>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition">
                  <Github size={16} /> Get API Key
                </a>
              </div>
            </div>
          </aside>

          <div className="md:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 z-40 flex items-center justify-between">
            <div className="flex items-center gap-2"><Zap className="text-purple-500" size={20} /><h1 className="text-lg font-bold text-white uppercase tracking-tighter">AutoShorts AI</h1></div>
            <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300"><Menu size={24} /></button>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-8">
                    <Zap className="text-purple-500" size={24} />
                    <h2 className="text-white font-black uppercase">Menu</h2>
                  </div>
                  <div className="space-y-2">
                    <NavItem id="create" label="Shorts Creator" icon={Video} />
                    <NavItem id="long" label="Long Video" icon={Clapperboard} />
                    <NavItem id="podcast" label="Podcast Studio" icon={Mic} />
                    <NavItem id="social" label="Social Post" icon={Share2} />
                    <NavItem id="news" label="Trending News" icon={Newspaper} />
                    <NavItem id="dashboard" label="Analytics" icon={LayoutDashboard} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 overflow-y-auto pt-24 md:pt-12 px-6 lg:px-12 pb-12 scrollbar-thin scrollbar-thumb-slate-800">
              <header className="mb-12">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest mb-2">
                  <div className="h-px w-8 bg-purple-500/30"></div>
                  <span>{activeTab} Mode | {selectedLanguage}</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none uppercase">
                  {activeTab === 'dashboard' ? 'Analytics' : activeTab === 'news' ? 'Hot Trends' : activeTab === 'social' ? 'Social Post' : activeTab === 'long' ? 'Long Video Studio' : activeTab === 'podcast' ? 'Podcast Studio' : 'Shorts Creator'}
                </h2>
              </header>

              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'create' && <ProjectBuilder initialTopic={selectedTopic} initialLanguage={selectedLanguage} />}
                {activeTab === 'long' && <LongVideoCreator initialTopic={selectedTopic} initialLanguage={selectedLanguage} />}
                {activeTab === 'podcast' && <PodcastCreator initialTopic={selectedTopic} initialLanguage={selectedLanguage} />}
                {activeTab === 'news' && <TrendingNews onSelectTopic={handleNewsTopicSelect} />}
                {activeTab === 'social' && <SocialPostGenerator initialTopic={selectedTopic} initialLanguage={selectedLanguage} />}
              </div>
            </div>
          </main>

          {/* API Key Settings Modal */}
          {showApiKeyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Key className="text-purple-400" size={24} />
                    API Key Settings
                  </h3>
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="text-slate-500 hover:text-white transition p-2"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="AIza..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">
                      รับ API Key ได้ที่{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      ElevenLabs API Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={elevenLabsInput}
                      onChange={(e) => setElevenLabsInput(e.target.value)}
                      placeholder="xi-..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check size={16} />
                      Save Key
                    </button>
                    {hasCustomKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition"
                      >
                        <Trash2 size={16} />
                        Clear
                      </button>
                    )}
                  </div>

                  {hasCustomKey && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <Check size={14} />
                        Custom API Key is active
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
        </div>
      </AppContext.Provider>
    </AuthGuard>
  );
};

export default App;
