import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Calendar as CalendarIcon, Users, BarChart3,
    Plus, ExternalLink, RefreshCw, Trash2, Smartphone, Settings
} from 'lucide-react';
import SocialSettingsModal from './SocialSettingsModal';
import { SocialAccount, ScheduledPost, SocialPlatform } from '../types';
import * as socialService from '../services/socialService';
import { getAuthConfig } from '../services/authService';

// Mock Icons (You can import real brand icons if available, using Lucide for now)
const PlatformIcon = ({ platform }: { platform: SocialPlatform }) => {
    switch (platform) {
        case 'youtube': return <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">YT</div>;
        case 'tiktok': return <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold border border-white/20">TK</div>;
        case 'instagram': return <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">IG</div>;
        case 'facebook': return <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">FB</div>;
        default: return <div className="w-8 h-8 rounded-full bg-gray-500" />;
    }
};

const SocialHub: React.FC = () => {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setAccounts(socialService.getAccounts());
        setPosts(socialService.getScheduledPosts());
    };

    const handleConnect = async (platform: SocialPlatform) => {
        // Special flow for Instagram/TikTok: Ask for Mobile Handoff or API
        if (platform === 'instagram' || platform === 'tiktok') {
            const mode = prompt('How do you want to connect?\n\n1. API (Business Account - Requires App Keys)\n2. Mobile Handoff (Personal Account - Manual QR Code)\n\nType 1 or 2');
            if (mode === '2') {
                const handle = prompt('Enter your @username for reference:');
                if (handle) {
                    socialService.addManualAccount(platform, handle);
                    loadData();
                }
                return;
            }
        }

        if (!getAuthConfig(platform)) {
            // Auto-open settings if missing
            setShowSettingsModal(true);
            return;
        }

        setLoading(true);
        try {
            await socialService.connectSocialAccount(platform);
            loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = (id: string) => {
        if (confirm('Disconnect this account?')) {
            socialService.removeAccount(id);
            loadData();
        }
    };

    const totalVideos = accounts.reduce((sum, acc) => sum + (parseInt(acc.stats?.videoCount || '0')), 0);
    const totalReach = accounts.reduce((sum, acc) => sum + (parseInt(acc.stats?.viewCount || '0')), 0);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Connected Accounts', value: accounts.length, icon: Users, color: 'text-blue-500' },
                    { label: 'Scheduled Posts', value: posts.filter(p => p.status === 'scheduled').length, icon: CalendarIcon, color: 'text-orange-500' },
                    { label: 'Published (Lifetime)', value: formatNumber(totalVideos), icon: BarChart3, color: 'text-emerald-500' },
                    { label: 'Total Reach', value: formatNumber(totalReach), icon: LayoutGrid, color: 'text-purple-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                            <stat.icon size={64} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Account Manager */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Accounts</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSettingsModal(true)} className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition"><Settings size={14} /></button>
                            <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-full text-neutral-500 transition"><RefreshCw size={14} /></button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-[#C5A059]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <PlatformIcon platform={acc.platform} />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{acc.username}</h4>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] text-neutral-500 capitalize">{acc.platform} • <span className={`text-${acc.connectionMode === 'manual' ? 'orange' : 'emerald'}-500`}>{acc.connectionMode === 'manual' ? 'Mobile Handoff' : 'API Active'}</span></p>

                                            {/* Channel Stats Display */}
                                            {acc.stats && (
                                                <div className="flex gap-3 mt-1">
                                                    {acc.stats.subscriberCount && (
                                                        <span className="text-[10px] text-neutral-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                                            👥 {parseInt(acc.stats.subscriberCount).toLocaleString()}
                                                        </span>
                                                    )}
                                                    {acc.stats.viewCount && (
                                                        <span className="text-[10px] text-neutral-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                                            👁️ {parseInt(acc.stats.viewCount).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDisconnect(acc.id)} className="p-2 text-neutral-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {/* Valid Connect Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {(['youtube', 'tiktok', 'instagram', 'facebook'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handleConnect(p)}
                                    disabled={loading || accounts.some(a => a.platform === p)}
                                    className={`p-3 rounded-xl border border-dashed border-white/10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all
                                        ${accounts.some(a => a.platform === p) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/30 text-neutral-400'}
                                    `}
                                >
                                    <Plus size={12} /> {p}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Mobile Handoff Promo */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white"><Smartphone size={20} /></div>
                            <h3 className="text-lg font-black text-white mb-2">Mobile Handoff</h3>
                            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                                Avoid API bans! Use our secure QR code system to instantly transfer videos & captions to your phone for safe posting on TikTok/Reels.
                            </p>
                            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule / Calendar */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Content Queue</h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold text-neutral-400 uppercase">Upcoming</button>
                            <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-neutral-600 uppercase hover:text-neutral-400">Past</button>
                        </div>
                    </div>

                    {posts.length === 0 ? (
                        <div className="h-64 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-neutral-600 gap-4">
                            <CalendarIcon size={32} />
                            <p className="text-sm font-bold">No posts scheduled</p>
                            <p className="text-xs text-neutral-600">Create a video in Shorts Engine to schedule it.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {posts.map(post => (
                                <div key={post.id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-[#C5A059]/30 transition-all">
                                    <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden relative">
                                        {post.thumbnailUrl && <img src={post.thumbnailUrl} className="w-full h-full object-cover opacity-70" />}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Status Indicator */}
                                            {post.status === 'scheduled' && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_orange]" />}
                                            {post.status === 'published' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_emerald]" />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{post.title}</h4>
                                        <div className="flex items-center gap-2 mb-2">
                                            {post.platforms.map(pid => {
                                                const acc = accounts.find(a => a.id === pid);
                                                return acc ? <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 capitalize">{acc.platform}</span> : null;
                                            })}
                                        </div>
                                        <p className="text-[10px] font-mono text-neutral-500">
                                            {new Date(post.scheduledTime).toLocaleString()}
                                        </p>
                                    </div>
                                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition">
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <SocialSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        </div>
    );
};

export default SocialHub;
