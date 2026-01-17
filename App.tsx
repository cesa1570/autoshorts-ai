
import React, { useState, useEffect } from 'react';
import {
  Video, Zap, Clapperboard, Grid, Key, Shield, Settings as SettingsIcon, Activity, Mic, Share2, User, Clock
} from 'lucide-react';
import TitleBar from './components/TitleBar';

// Components
import Hub from './components/Hub';
import ShortsCreator from './components/ShortsCreator';
import LongVideoCreator from './components/LongVideoCreator';
import PodcastCreator from './components/PodcastCreator';
import Settings from './components/Settings';
import UsageAnalytics from './components/UsageAnalytics';
import SocialHub from './components/SocialHub';
import UserProfile from './components/UserProfile';
import AuthGate from './components/AuthGate';
import AdminDashboard from './components/AdminDashboard';
import { authManagementService } from './services/authManagementService';

import { AutomationProvider } from './contexts/AutomationContext';
import { AppContext, AppContextType } from './contexts/AppContext';
import { setGlobalApiKey, setGlobalTier } from './services/geminiService';
import { handleAuthCallback } from './services/authService';
import { Draft } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hub' | 'create' | 'long' | 'podcast' | 'settings' | 'analytics' | 'social' | 'profile' | 'admin'>('hub');
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'Thai' | 'English'>('Thai');

  const handleNavigate = (tab: any) => {
    setActiveTab(tab);
    setCurrentDraft(null); // Clear draft on manual navigation
  };

  const handleResumeDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    if (draft.type === 'shorts') setActiveTab('create');
    else if (draft.type === 'long') setActiveTab('long');
    else if (draft.type === 'podcast') setActiveTab('podcast');
  };

  const [apiKey, setApiKey] = useState<string>(() => {
    const stored = localStorage.getItem('gemini_api_key');
    const env = process.env.API_KEY;
    const initial = stored || env || '';
    if (initial) setGlobalApiKey(initial); // Sync service on load
    return initial;
  });

  const [apiKeys, setApiKeys] = useState<string[]>([]);

  const [apiRequestsToday, setApiRequestsToday] = useState(0);
  const [dailyTokens, setDailyTokens] = useState(0);
  const [usageHistory, setUsageHistory] = useState<any[]>([]); // UsageRecord[]

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [licenseTier, setLicenseTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<number | null>(null);

  const [vertexProjectId, setVertexProjectId] = useState(() => localStorage.getItem('vertex_project_id') || '');
  const [vertexLocation, setVertexLocation] = useState(() => localStorage.getItem('vertex_location') || 'us-central1');
  const [vertexServiceKey, setVertexServiceKey] = useState(() => localStorage.getItem('vertex_service_key') || '');
  const [vertexApiKey, setVertexApiKey] = useState(() => localStorage.getItem('vertex_api_key') || '');

  useEffect(() => {
    const today = new Date().toDateString();

    // Load existing history
    try {
      const storedHistory = JSON.parse(localStorage.getItem('gemini-usage-history') || '[]');
      setUsageHistory(storedHistory);
    } catch (e) {
      setUsageHistory([]);
    }

    if (localStorage.getItem('gemini-usage-date') !== today) {
      localStorage.setItem('gemini-usage-date', today);
      localStorage.setItem('gemini-usage-count', '0');
      localStorage.setItem('gemini-token-count', '0');
      setApiRequestsToday(0);
      setDailyTokens(0);
    } else {
      setApiRequestsToday(parseInt(localStorage.getItem('gemini-usage-count') || '0'));
      setDailyTokens(parseInt(localStorage.getItem('gemini-token-count') || '0'));
    }

    const handleUsage = (event: any) => {
      const timestamp = Date.now();
      const model = event.detail?.model || 'unknown';
      const tokens = event.detail?.tokens || 0;
      const cost = event.detail?.cost || 0;

      const newRecord = {
        timestamp,
        date: new Date().toISOString().split('T')[0],
        model,
        tokens,
        cost
      };

      // Show Usage Toast
      if (tokens > 0 || cost > 0) {
        showUsageToast(`Used ${model}`, `${(tokens / 1000).toFixed(1)}k Tokens • Est. $${cost.toFixed(5)}`);
      }

      // Update History State
      setUsageHistory(prev => {
        const next = [...prev, newRecord];
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filtered = next.filter(r => r.timestamp > cutoff);
        localStorage.setItem('gemini-usage-history', JSON.stringify(filtered));
        return filtered;
      });

      // Update Request Count
      setApiRequestsToday(prev => {
        const next = prev + 1;
        localStorage.setItem('gemini-usage-count', next.toString());
        return next;
      });
      // Update Token Count (if provided)
      if (tokens > 0) {
        setDailyTokens(prev => {
          const next = prev + tokens;
          localStorage.setItem('gemini-token-count', next.toString());
          return next;
        });
      }
    };

    window.addEventListener('gemini-api-usage', handleUsage);
    return () => {
      window.removeEventListener('gemini-api-usage', handleUsage);
    };
    window.addEventListener('gemini-api-usage', handleUsage);
    return () => {
      window.removeEventListener('gemini-api-usage', handleUsage);
    };
  }, []);

  // Handle OAuth Callback
  useEffect(() => {
    const checkAuthCallback = async () => {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path === '/auth/callback' || search.includes('code=')) {
        const params = new URLSearchParams(search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
          // Show loading toast or modal?
          showUsageToast('Authenticating', 'Verifying social credentials...');

          // Clear URL to prevent re-execution
          window.history.replaceState({}, document.title, window.location.origin + window.location.pathname); // Keep path briefly or go root?
          // Actually usually we want to go back to app root
          window.history.replaceState({}, document.title, '/');

          const success = await handleAuthCallback(code, state);
          if (success) {
            setActiveTab('social');
            setTimeout(() => showUsageToast('Connected', 'Account successfully linked!'), 500);
          } else {
            showUsageToast('Auth Failed', 'Could not verify account.');
          }
        }
      }
    };
    checkAuthCallback();
  }, []);

  const [toast, setToast] = useState<{ visible: boolean, title: string, message: string } | null>(null);
  const showUsageToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync keys on mount
  useEffect(() => {
    // Dynamic import or get from service
    import('./services/geminiService').then(mod => {
      setApiKeys(mod.getKeys());
    });
  }, []);

  const handleAddKey = (key: string) => {
    import('./services/geminiService').then(mod => {
      mod.addKey(key);
      setApiKeys(mod.getKeys());
    });
  };

  const handleRemoveKey = (key: string) => {
    import('./services/geminiService').then(mod => {
      mod.removeKey(key);
      setApiKeys(mod.getKeys());
    });
  };

  const handleSetApiKey = (key: string) => {
    const trimmedKey = key.trim();
    console.log('[DEBUG] handleSetApiKey called with:', trimmedKey.substring(0, 10) + '...');
    // Sync with geminiService directly
    setGlobalApiKey(trimmedKey);
    // Update React state
    setApiKey(trimmedKey);
    setApiKeys(trimmedKey ? [trimmedKey] : []);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', trimmedKey);
    }
  };

  const resetKeyStatus = () => {
    setApiKey('');
    setGlobalApiKey('');
    // Clear all keys? Or just the active one? 
    // For safety, let's keep the pool unless explicitly cleared in settings.
    if (typeof window !== 'undefined') localStorage.removeItem('gemini_api_key');
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const NavItem = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => handleNavigate(id)}
      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'} py-4 rounded-3xl font-bold transition-all duration-500 text-[10px] tracking-[0.2em] uppercase group relative overflow-hidden ${activeTab === id
        ? 'text-white'
        : 'text-neutral-500 hover:bg-white/[0.02] hover:text-neutral-300'
        }`}
    >
      {activeTab === id && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059]/15 via-[#C5A059]/5 to-transparent border-l-[3px] border-[#C5A059] shadow-[inset_10px_0_20px_rgba(197,160,89,0.05)] animate-in fade-in slide-in-from-left-4 duration-700" />
      )}
      <div className={`flex items-center ${isSidebarCollapsed ? 'gap-0' : 'gap-5'} relative z-10 transition-all duration-300`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${activeTab === id ? 'bg-[#C5A059]/10 shadow-[0_0_15px_rgba(197,160,89,0.2)]' : 'group-hover:bg-white/5'}`}>
          <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} className={`transition-all duration-500 ${activeTab === id ? 'text-[#C5A059] scale-110' : 'text-neutral-700 group-hover:text-neutral-400'}`} />
        </div>
        {!isSidebarCollapsed && <span className={`animate-in fade-in slide-in-from-right-2 duration-500 tracking-[0.3em] ${activeTab === id ? 'font-black' : 'font-bold'}`}>{label}</span>}
      </div>
      {!isSidebarCollapsed && activeTab === id && (
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] shadow-[0_0_12px_#C5A059] animate-pulse" />
        </div>
      )}
    </button>
  );

  const [userTier, setUserTierState] = useState<'standard' | 'pro'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gemini_tier') as 'standard' | 'pro') || 'standard';
    }
    return 'standard';
  });

  const handleSetUserTier = (tier: 'standard' | 'pro') => {
    setUserTierState(tier);
    localStorage.setItem('gemini_tier', tier);
    setGlobalTier(tier); // Sync service
  };

  // OpenAI Support
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openai_api_key') || '';
    }
    return '';
  });

  const handleSetOpenaiApiKey = (key: string) => {
    import('./services/openaiService').then(mod => {
      mod.setOpenAIApiKey(key);
      setOpenaiApiKey(key);
    });
  };

  const contextValue: AppContextType = {
    apiKey,
    setApiKey: handleSetApiKey,
    resetKeyStatus,
    hasSelectedKey: !!apiKey,
    userTier,
    setUserTier: handleSetUserTier,
    dailyTokens,
    apiRequestsToday,
    usageHistory,
    apiKeys,
    addApiKey: handleAddKey,
    removeApiKey: handleRemoveKey,
    openaiApiKey,
    setOpenaiApiKey: handleSetOpenaiApiKey,
    userId,
    setUserId,
    userEmail,
    setUserEmail,
    licenseTier,
    setLicenseTier,
    licenseExpiresAt,
    setLicenseExpiresAt,
    vertexProjectId,
    setVertexProjectId: (id: string) => { setVertexProjectId(id); localStorage.setItem('vertex_project_id', id); },
    vertexLocation,
    setVertexLocation: (loc: string) => { setVertexLocation(loc); localStorage.setItem('vertex_location', loc); },
    vertexServiceKey,
    setVertexServiceKey: (key: string) => { setVertexServiceKey(key); localStorage.setItem('vertex_service_key', key); },
    vertexApiKey,
    setVertexApiKey: (key: string) => { setVertexApiKey(key); localStorage.setItem('vertex_api_key', key); }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AuthGate>
        <AutomationProvider>
          <div className="relative min-h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed top-1/2 -right-24 w-80 h-80 bg-[#C5A059]/3 rounded-full blur-[100px] pointer-events-none" />

            <TitleBar />
            <div className={`flex h-screen ${typeof window !== 'undefined' && window.electron ? 'pt-[30px]' : ''}`}>

              <aside className={`hidden md:flex flex-col fixed inset-y-0 z-50 bg-[#080808]/80 backdrop-blur-3xl border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-24 p-4' : 'w-72 p-8'}`}>
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-5'} mb-20 mt-6 ml-1 group cursor-pointer transition-all duration-500`} onClick={toggleSidebar}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#C5A059] blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                    <div className="relative w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5),offset_0_0_0_1px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-all duration-500 hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                      <Shield className="text-black" size={28} strokeWidth={2.5} />
                    </div>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                      <h1 className="text-2xl font-black text-white tracking-[0.1em] leading-none uppercase italic drop-shadow-lg">LAZYAUTO</h1>
                      <span className="text-[7px] text-[#C5A059] font-black tracking-[0.5em] uppercase opacity-90 block mt-1">LAZYAUTOCREATOR V3.0</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className={`px-6 flex items-center gap-4 mb-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <div className="h-px flex-1 bg-white/[0.03]" />
                    {!isSidebarCollapsed && <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-[0.6em] whitespace-nowrap animate-in fade-in duration-700">Production</p>}
                    {!isSidebarCollapsed && <div className="h-px flex-1 bg-white/[0.03]" />}
                  </div>

                  <NavItem id="hub" label="Main Lobby" icon={Grid} />
                  <NavItem id="create" label="Shorts Engine" icon={Video} />
                  <NavItem id="long" label="Cinema Engine" icon={Clapperboard} />
                  <NavItem id="podcast" label="Podcast Studio" icon={Mic} />

                  <div className="my-10 px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>

                  <NavItem id="social" label="Social Hub" icon={Share2} />

                  {/* ADMIN ONLY DASHBOARD */}
                  {userEmail?.toLowerCase().trim() === 'callmetrapboi1@gmail.com' && (
                    <div className="mt-8 border-t border-white/5 pt-4">
                      {!isSidebarCollapsed && <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.6em] whitespace-nowrap mb-4 px-6 animate-in fade-in">Founder</p>}
                      <NavItem id="admin" label="Mission Control" icon={Shield} />
                    </div>
                  )}

                  <div className="my-10 px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>

                  <NavItem id="analytics" label="Analytics" icon={Activity} />
                  <NavItem id="settings" label="Settings" icon={SettingsIcon} />
                </div>

                <div className="pt-10 border-t border-white/5 space-y-2">
                  {!isSidebarCollapsed && (
                    <div className="mx-6 mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#C5A059]/10 to-transparent border border-[#C5A059]/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Shield size={24} className="text-[#C5A059]" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-1">Authorization Status</div>
                        <div className="text-sm font-black text-white uppercase tracking-tight mb-2">
                          {licenseTier === 'enterprise' ? 'Enterprise Identity' : licenseTier === 'pro' ? 'Cinema Pro' : 'Free Operator'}
                        </div>
                        <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={10} />
                          {licenseTier === 'free' ? 'Standard Access' :
                            licenseExpiresAt ? `Expires: ${new Date(licenseExpiresAt).toLocaleDateString()}` :
                              'Lifetime Access'}
                        </div>
                      </div>
                    </div>
                  )}
                  <NavItem id="profile" label="My Profile" icon={User} />
                </div>
              </aside>

              <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-72'} flex flex-col h-screen overflow-hidden bg-[#050505]`}>
                <div className="flex-1 overflow-y-auto pt-14 px-14 pb-14 custom-scrollbar">
                  <header className="mb-16">
                    <div className="flex items-center gap-4 text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em] mb-3">
                      <div className="h-px w-10 bg-[#C5A059]/30"></div>
                      <span>Protocol Terminal</span>
                    </div>
                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter">
                      {activeTab === 'hub' ? 'Command Center' : activeTab === 'create' ? 'Shorts Engine' : activeTab === 'long' ? 'Cinema Engine' : activeTab === 'podcast' ? 'Podcast Studio' : activeTab === 'analytics' ? 'System Analytics' : activeTab === 'social' ? 'Social Command' : 'System Config'}
                    </h2>
                  </header>

                  <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div style={{ display: activeTab === 'hub' ? 'block' : 'none' }}>
                      <Hub onNavigate={handleNavigate} onResume={handleResumeDraft} />
                    </div>
                    <div style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
                      <ShortsCreator
                        initialTopic={selectedTopic}
                        initialLanguage={selectedLanguage}
                        apiKey={apiKey}
                        initialDraft={currentDraft}
                        isActive={activeTab === 'create'}
                      />
                    </div>
                    <div style={{ display: activeTab === 'long' ? 'block' : 'none' }}>
                      <LongVideoCreator
                        initialTopic={selectedTopic}
                        initialLanguage={selectedLanguage}
                        apiKey={apiKey}
                        initialDraft={currentDraft}
                        isActive={activeTab === 'long'}
                      />
                    </div>
                    <div style={{ display: activeTab === 'podcast' ? 'block' : 'none' }}>
                      <PodcastCreator
                        initialDraft={currentDraft}
                        isActive={activeTab === 'podcast'}
                      />
                    </div>
                    {activeTab === 'social' && <SocialHub />}
                    {activeTab === 'profile' && <UserProfile />}
                    {activeTab === 'admin' && <AdminDashboard />}
                    {activeTab === 'analytics' && <UsageAnalytics />}
                    {activeTab === 'settings' && <Settings />}
                  </div>
                </div>
              </main>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && toast.visible && (
            <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="bg-[#111] border border-[#C5A059]/30 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(197,160,89,0.15)] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                  <Zap size={20} className="text-[#C5A059]" />
                </div>
                <div>
                  <h4 className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest">{toast.title}</h4>
                  <p className="text-neutral-400 text-xs font-mono">{toast.message}</p>
                </div>
              </div>
            </div>
          )}
        </AutomationProvider>
      </AuthGate>
    </AppContext.Provider>
  );
};

export default App;
