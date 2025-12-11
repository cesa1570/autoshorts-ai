import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Video, Zap, Settings, Github, Menu, X, Newspaper, Key, Save, Share2, LogOut, Youtube, User, Link2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectBuilder from './components/ProjectBuilder';
import TrendingNews from './components/TrendingNews';
import SocialPostGenerator from './components/SocialPostGenerator';
import { useToast } from './components/ToastContext';
import { getAuthState, signIn, signOut, isOAuthConfigured, setGoogleClientId, AuthState } from './services/authService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'news' | 'social'>('create');
  const [menuOpen, setMenuOpen] = useState(false);
  const { addToast } = useToast();

  // Topic Handling
  const [selectedNewsTopic, setSelectedNewsTopic] = useState<string>('');

  // Settings / API Key State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [googleClientId, setGoogleClientIdState] = useState('');

  // YouTube Auth State
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null, accessToken: null });

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setCustomApiKey(savedKey);

    const savedClientId = localStorage.getItem('google_client_id');
    if (savedClientId) setGoogleClientIdState(savedClientId);

    // Check YouTube auth status
    setAuthState(getAuthState());
  }, []);

  const saveSettings = () => {
    localStorage.setItem('gemini_api_key', customApiKey);

    // If Google Client ID changed, save and reload
    const currentClientId = localStorage.getItem('google_client_id') || '';
    if (googleClientId !== currentClientId && googleClientId.length > 10) {
      setGoogleClientId(googleClientId);
      addToast('info', 'Google Client ID saved. Reloading...');
      return; // Will reload
    }

    setSettingsOpen(false);
    addToast('success', 'Settings saved successfully!');
  };

  const handleYouTubeConnect = async () => {
    if (!isOAuthConfigured()) {
      addToast('warning', 'Please add your Google Client ID in Settings first.');
      setSettingsOpen(true);
      return;
    }

    try {
      const result = await signIn();
      setAuthState(result);
      addToast('success', `Connected as ${result.user?.name || 'YouTube User'}`);
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  const handleYouTubeDisconnect = () => {
    signOut();
    setAuthState({ isAuthenticated: false, user: null, accessToken: null });
    addToast('info', 'Disconnected from YouTube');
  };

  const handleNewsTopicSelect = (topic: string, type: 'video' | 'social') => {
    setSelectedNewsTopic(topic);
    if (type === 'video') {
      setActiveTab('create');
    } else {
      setActiveTab('social');
    }
    setMenuOpen(false);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: 'dashboard' | 'create' | 'news' | 'social', label: string, icon: any }) => (
    <button
      onClick={() => { setActiveTab(id); setMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm ${activeTab === id
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">

      {/* Header & Navigation Dropdown */}
      <div className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 z-50 flex items-center justify-between shadow-sm">

        <div className="flex items-center gap-4 relative">
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition active:scale-95 border border-transparent hover:border-slate-700"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent select-none flex items-center gap-2">
            <Zap className="text-purple-500 fill-purple-500 hidden sm:block" size={20} />
            AutoShorts AI
          </h1>

          {/* DROPDOWN MENU */}
          {menuOpen && (
            <>
              {/* Transparent Backdrop to close menu when clicking outside */}
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)}></div>

              {/* Dropdown Container */}
              <div className="absolute top-14 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1 ring-1 ring-black/5">

                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu</p>
                </div>

                <NavItem id="create" label="Video Generator" icon={Video} />
                <NavItem id="social" label="Social Post" icon={Share2} />
                <NavItem id="news" label="Trending News" icon={Newspaper} />
                <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />

                <div className="my-1 border-t border-slate-800"></div>

                <button
                  onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                >
                  <Settings size={18} /> Settings
                </button>

                <a href="#" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm">
                  <Github size={18} /> Documentation
                </a>

                {/* Footer Mini Profile */}
                <div className="mt-2 p-3 bg-slate-950 rounded-lg flex items-center gap-3 border border-slate-800/50">
                  {authState.user?.picture ? (
                    <img src={authState.user.picture} className="w-8 h-8 rounded-full ring-1 ring-white/10" alt="Profile" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 ring-1 ring-white/10 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">
                      {authState.user?.name || 'Creator Pro'}
                    </p>
                    <p className={`text-[10px] flex items-center gap-1 ${authState.isAuthenticated ? 'text-green-400' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${authState.isAuthenticated ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                      {authState.isAuthenticated ? 'YouTube Connected' : 'Not Connected'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {/* YouTube Connect Button */}
          {authState.isAuthenticated ? (
            <button
              onClick={handleYouTubeDisconnect}
              className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30 hover:border-red-500/50 transition group"
            >
              <Youtube size={16} className="text-red-400" />
              <span className="text-xs text-red-400 group-hover:text-red-300">
                {authState.user?.name?.split(' ')[0] || 'Connected'}
              </span>
            </button>
          ) : (
            <button
              onClick={handleYouTubeConnect}
              className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-full transition group"
            >
              <Youtube size={16} className="text-white" />
              <span className="text-xs text-white font-medium">Connect YouTube</span>
            </button>
          )}

          {/* API Key Status */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 hover:border-purple-500 transition group"
          >
            <div className={`w-2 h-2 rounded-full ${customApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">
              {customApiKey ? 'API OK' : 'NO KEY'}
            </span>
            <Settings size={12} className="text-slate-500 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 pt-28 w-full max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' ? 'Dashboard' :
                  activeTab === 'news' ? 'Trending Topics' :
                    activeTab === 'social' ? 'Social Media Content' : 'Create Content'}
              </h2>
              <p className="text-slate-400 mt-1">
                {activeTab === 'dashboard' ? 'View your projects and stats.' :
                  activeTab === 'news' ? 'Discover what is viral right now.' :
                    activeTab === 'social' ? 'Generate posts & art prompts for FB/IG/X.' : 'AI-powered workflow from idea to video.'}
              </p>
            </div>
          </div>
        </header>

        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'create' && <ProjectBuilder initialTopic={selectedNewsTopic} apiKey={customApiKey} youtubeToken={authState.accessToken} />}
          {activeTab === 'news' && <TrendingNews onSelectTopic={handleNewsTopicSelect} apiKey={customApiKey} />}
          {activeTab === 'social' && <SocialPostGenerator initialTopic={selectedNewsTopic} apiKey={customApiKey} />}
        </div>
      </main>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-purple-500" /> Settings
              </h3>
              <button onClick={() => setSettingsOpen(false)} className="text-slate-500 hover:text-white transition bg-slate-800 rounded-full p-1 hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono transition-all focus:border-purple-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" className="text-purple-400 hover:underline">Google AI Studio</a>
                </p>
              </div>

              {/* Google Client ID for YouTube OAuth */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Youtube size={16} className="text-red-500" /> Google Client ID (YouTube)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input
                    type="password"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientIdState(e.target.value)}
                    placeholder="123456789-abc...apps.googleusercontent.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono transition-all focus:border-red-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Required for YouTube upload. Create at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-red-400 hover:underline">Google Cloud Console</a>
                </p>
              </div>

              {/* YouTube Connection Status */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Youtube size={24} className={authState.isAuthenticated ? 'text-red-500' : 'text-slate-600'} />
                    <div>
                      <p className="text-sm font-medium text-white">YouTube Account</p>
                      <p className="text-xs text-slate-500">
                        {authState.isAuthenticated ? authState.user?.email : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {authState.isAuthenticated ? (
                    <button
                      onClick={handleYouTubeDisconnect}
                      className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleYouTubeConnect}
                      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/30 rounded-b-xl">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-900/20"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;