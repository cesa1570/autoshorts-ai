import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Video, Zap, Settings, Github, Menu, X, Newspaper, Key, Save, Share2, LogOut, Youtube, User, Link2, ListPlus, Calendar, Sparkles, Image, DollarSign, Subtitles, SplitSquareVertical, Moon, Sun } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectBuilder from './components/ProjectBuilder';
import TrendingNews from './components/TrendingNews';
import SocialPostGenerator from './components/SocialPostGenerator';
import BatchQueue from './components/BatchQueue';
import ContentCalendar from './components/ContentCalendar';
import AutoTopicGenerator from './components/AutoTopicGenerator';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import RevenueTracker from './components/RevenueTracker';
import SubtitleGenerator from './components/SubtitleGenerator';
import ABTitleTesting from './components/ABTitleTesting';
import { useToast } from './components/ToastContext';
import { getAuthState, signIn, signOut, isOAuthConfigured, setGoogleClientId, AuthState } from './services/authService';
import { useTheme } from './components/ThemeContext';
import { useKeyboardShortcuts, getAppShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'news' | 'social' | 'batch' | 'calendar' | 'autotopic' | 'thumbnail' | 'revenue' | 'subtitle' | 'abtest'>('create');
  const [menuOpen, setMenuOpen] = useState(false);
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

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

  // Keyboard shortcuts
  useKeyboardShortcuts(getAppShortcuts({
    openSettings: () => setSettingsOpen(true),
    toggleTheme: toggleTheme,
    goToCreate: () => setActiveTab('create'),
    goToBatch: () => setActiveTab('batch'),
    goToDashboard: () => setActiveTab('dashboard'),
  }));

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

  const NavItem = ({ id, label, icon: Icon }: { id: 'dashboard' | 'create' | 'news' | 'social' | 'batch' | 'calendar' | 'autotopic' | 'thumbnail' | 'revenue' | 'subtitle' | 'abtest', label: string, icon: any }) => (
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

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="text-purple-500 fill-purple-500" size={20} />
            AutoShorts AI
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">สร้าง Content</p>
          <NavItem id="create" label="Video Generator" icon={Video} />
          <NavItem id="batch" label="Batch Queue" icon={ListPlus} />
          <NavItem id="autotopic" label="Auto Topics" icon={Sparkles} />
          <NavItem id="thumbnail" label="Thumbnail" icon={Image} />
          <NavItem id="subtitle" label="Subtitles" icon={Subtitles} />
          <NavItem id="social" label="Social Post" icon={Share2} />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2 mt-4">จัดการ</p>
          <NavItem id="news" label="Trending News" icon={Newspaper} />
          <NavItem id="calendar" label="Content Calendar" icon={Calendar} />
          <NavItem id="revenue" label="Revenue" icon={DollarSign} />
          <NavItem id="abtest" label="A/B Testing" icon={SplitSquareVertical} />
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />

          <div className="my-3 border-t border-slate-800"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            <Settings size={18} /> Settings
          </button>
        </nav>

        {/* Sidebar Footer - Status */}
        <div className="p-3 border-t border-slate-800">
          {/* API Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-lg mb-2">
            <div className={`w-2 h-2 rounded-full ${customApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-xs text-slate-400">{customApiKey ? 'API Connected' : 'No API Key'}</span>
          </div>

          {/* YouTube Status */}
          <button
            onClick={authState.isAuthenticated ? handleYouTubeDisconnect : handleYouTubeConnect}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${authState.isAuthenticated
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-red-600 text-white hover:bg-red-500'
              }`}
          >
            <Youtube size={16} />
            <span className="text-xs font-medium">
              {authState.isAuthenticated ? authState.user?.name?.split(' ')[0] || 'Connected' : 'Connect YouTube'}
            </span>
          </button>

          {/* User Profile */}
          <div className="mt-3 p-3 bg-slate-950 rounded-lg flex items-center gap-3">
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
              <p className={`text-[10px] ${authState.isAuthenticated ? 'text-green-400' : 'text-slate-500'}`}>
                {authState.isAuthenticated ? 'YouTube Connected' : 'Not Connected'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header (shown on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 z-40 flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-slate-300 hover:text-white p-2 rounded-lg transition"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
          <Zap className="text-purple-500 fill-purple-500" size={18} />
          AutoShorts AI
        </h1>
        <div className={`w-2 h-2 rounded-full ${customApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h1 className="text-lg font-bold text-white">Menu</h1>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <NavItem id="create" label="Video Generator" icon={Video} />
              <NavItem id="batch" label="Batch Queue" icon={ListPlus} />
              <NavItem id="autotopic" label="Auto Topics" icon={Sparkles} />
              <NavItem id="social" label="Social Post" icon={Share2} />
              <NavItem id="news" label="Trending News" icon={Newspaper} />
              <NavItem id="calendar" label="Content Calendar" icon={Calendar} />
              <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <div className="my-3 border-t border-slate-800"></div>
              <button
                onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
              >
                <Settings size={18} /> Settings
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full">
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'create' && <ProjectBuilder initialTopic={selectedNewsTopic} apiKey={customApiKey} youtubeToken={authState.accessToken} />}
          {activeTab === 'batch' && <BatchQueue apiKey={customApiKey} />}
          {activeTab === 'autotopic' && <AutoTopicGenerator apiKey={customApiKey} onSelectTopic={(topic) => { setSelectedNewsTopic(topic); setActiveTab('create'); }} />}
          {activeTab === 'thumbnail' && <ThumbnailGenerator apiKey={customApiKey} />}
          {activeTab === 'subtitle' && <SubtitleGenerator />}
          {activeTab === 'news' && <TrendingNews onSelectTopic={handleNewsTopicSelect} apiKey={customApiKey} />}
          {activeTab === 'calendar' && <ContentCalendar />}
          {activeTab === 'revenue' && <RevenueTracker />}
          {activeTab === 'abtest' && <ABTitleTesting />}
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
              {/* Mock Mode Toggle */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-white">🧪 Mock Mode</span>
                    <p className="text-xs text-slate-400 mt-1">ใช้ข้อมูลจำลอง ไม่ต้องใช้ API</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localStorage.getItem('mock_mode') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('mock_mode', e.target.checked ? 'true' : 'false');
                      addToast('info', e.target.checked ? 'Mock Mode เปิดแล้ว!' : 'Mock Mode ปิดแล้ว');
                      window.location.reload();
                    }}
                    className="w-5 h-5 accent-purple-600"
                  />
                </label>
              </div>

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