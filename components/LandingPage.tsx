import React, { useState } from 'react';
import {
    Sparkles, Video, Clapperboard, Mic, Zap, Shield, Download, CheckCircle2,
    ArrowRight, Play, ChevronDown, Monitor, Apple, Globe, Rocket, Calendar,
    Star, Users, TrendingUp, Bot, Palette, Volume2, Share2, Clock, Key
} from 'lucide-react';
import LegalModal from './LegalModal';

interface LandingPageProps {
    onLogin: () => void;
    onPurchase: (priceId: string) => void;
    proCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onPurchase, proCount }) => {
    const isEarlyBirdAvailable = proCount < 100;

    const features = [
        {
            icon: Video,
            title: 'Shorts Engine',
            description: 'Create Viral AI Shorts in 60 seconds',
            color: 'from-blue-500 to-cyan-400'
        },
        {
            icon: Clapperboard,
            title: 'Cinema Engine',
            description: 'Generate 10-60 min Long-form Videos for YouTube',
            color: 'from-purple-500 to-pink-400'
        },
        {
            icon: Mic,
            title: 'Podcast Studio',
            description: 'Create Natural Dual-Host Podcasts',
            color: 'from-orange-500 to-yellow-400'
        },
        {
            icon: Bot,
            title: 'AI Script Writer',
            description: 'Write Engaging Scripts with Gemini 2.0 Flash',
            color: 'from-emerald-500 to-teal-400'
        },
        {
            icon: Palette,
            title: 'Visual Engine',
            description: 'Generate Visuals with Imagen 3 or DALL-E 3',
            color: 'from-pink-500 to-rose-400'
        },
        {
            icon: Volume2,
            title: 'AI Voiceover',
            description: 'Multi-language Voice Synthesis with AI',
            color: 'from-indigo-500 to-violet-400'
        }
    ];

    const roadmap = [
        { quarter: 'Q1 2026', title: 'Foundation', items: ['✅ AI Script Generation', '✅ Image Generation', '✅ Voiceover', '✅ Video Export'], done: true },
        { quarter: 'Q2 2026', title: 'Enhancement', items: ['✅ Podcast Creator', '✅ SEO Metadata', '✅ Multiple Styles', '🔄 Social Hub'], current: true },
        { quarter: 'Q3 2026', title: 'Integration', items: ['📅 Direct YouTube Upload', '📅 TikTok Integration', '📅 Auto Scheduler', '📅 Analytics Dashboard'] },
        { quarter: 'Q4 2026', title: 'AI Evolution', items: ['📅 Veo 3 Video Gen', '📅 Real-time Preview', '📅 Team Collaboration', '📅 API Access'] }
    ];

    const tutorials = [
        { step: 1, title: 'Enter Topic', description: 'Type the topic you want to create', icon: '✏️' },
        { step: 2, title: 'Generate Script', description: 'AI writes a 5-scene script automatically', icon: '🤖' },
        { step: 3, title: 'Generate Assets', description: 'Click to create images and voiceovers', icon: '🎨' },
        { step: 4, title: 'Preview & Edit', description: 'Watch preview and edit as needed', icon: '👁️' },
        { step: 5, title: 'Export', description: 'Export as high-quality MP4', icon: '📤' }
    ];

    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-xl flex items-center justify-center">
                            <Shield size={20} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-tight">LazyAutoCreator</h1>
                            <span className="text-[8px] text-[#C5A059] font-bold tracking-[0.3em] uppercase">Autonomous Content Engine</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#features" className="text-neutral-400 hover:text-white text-sm font-bold transition-colors">Features</a>
                        <a href="#roadmap" className="text-neutral-400 hover:text-white text-sm font-bold transition-colors">Roadmap</a>
                        <a href="#tutorial" className="text-neutral-400 hover:text-white text-sm font-bold transition-colors">Tutorial</a>
                        <button onClick={onLogin} className="text-neutral-400 hover:text-white text-sm font-bold transition-colors">เริ่มใช้งาน</button>
                        <button
                            onClick={onLogin}
                            className="bg-[#C5A059] text-black px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider hover:bg-[#d4af37] transition-all"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A059] rounded-full blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
                        <Sparkles size={14} className="text-[#C5A059]" />
                        <span className="text-xs font-bold text-neutral-400">Powered by Gemini 2.0 & Imagen 3</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none">
                        <span className="text-white">Create</span>
                        <br />
                        <span className="bg-gradient-to-r from-[#C5A059] to-[#d4af37] bg-clip-text text-transparent">Viral Videos</span>
                        <br />
                        <span className="text-white">With AI</span>
                    </h1>

                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10 font-medium">
                        Create YouTube Shorts, Long-form videos, and Podcasts automatically with AI.
                        <br />
                        No editing skills required. No script writing needed.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onLogin}
                            className="bg-[#C5A059] text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#d4af37] transition-all shadow-[0_0_40px_rgba(197,160,89,0.3)] flex items-center gap-3"
                        >
                            <Sparkles size={20} /> เริ่มใช้งาน
                        </button>
                        <a
                            href="#tutorial"
                            className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3"
                        >
                            <Play size={20} /> HOW IT WORKS
                        </a>
                    </div>

                    <div className="mt-16 flex items-center justify-center gap-8 text-neutral-500">
                        <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span className="text-sm font-bold">1,000+ Users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Video size={16} />
                            <span className="text-sm font-bold">50,000+ Videos Created</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star size={16} />
                            <span className="text-sm font-bold">4.9/5 Rating</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronDown size={32} className="text-neutral-600" />
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Features</span>
                        <h2 className="text-5xl font-black uppercase tracking-tight mt-4">Powerful Features</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-[#C5A059]/30 transition-all group"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-3">{feature.title}</h3>
                                <p className="text-neutral-400 font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roadmap Section */}
            <section id="roadmap" className="py-32 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Roadmap</span>
                        <h2 className="text-5xl font-black uppercase tracking-tight mt-4">Development Plan</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {roadmap.map((phase, i) => (
                            <div
                                key={i}
                                className={`relative bg-[#0a0a0a] border rounded-3xl p-8 ${phase.current ? 'border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.2)]' : phase.done ? 'border-emerald-500/30' : 'border-white/5'}`}
                            >
                                {phase.current && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C5A059] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        Current
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-6">
                                    <Calendar size={20} className={phase.done ? 'text-emerald-400' : phase.current ? 'text-[#C5A059]' : 'text-neutral-500'} />
                                    <span className="text-sm font-black text-neutral-400">{phase.quarter}</span>
                                </div>
                                <h3 className="text-xl font-black uppercase mb-4">{phase.title}</h3>
                                <ul className="space-y-2">
                                    {phase.items.map((item, j) => (
                                        <li key={j} className="text-sm text-neutral-400 font-medium">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tutorial Section */}
            <section id="tutorial" className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">How to Use</span>
                        <h2 className="text-5xl font-black uppercase tracking-tight mt-4">How It Works</h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        {tutorials.map((step, i) => (
                            <div key={i} className="relative">
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 w-56 text-center hover:border-[#C5A059]/30 transition-all">
                                    <div className="text-4xl mb-4">{step.icon}</div>
                                    <div className="text-[#C5A059] text-xs font-black uppercase tracking-widest mb-2">Step {step.step}</div>
                                    <h3 className="text-lg font-black uppercase mb-2">{step.title}</h3>
                                    <p className="text-sm text-neutral-400">{step.description}</p>
                                </div>
                                {i < tutorials.length - 1 && (
                                    <ArrowRight size={24} className="absolute top-1/2 -right-5 -translate-y-1/2 text-neutral-600 hidden lg:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Pricing</span>
                        <h2 className="text-5xl font-black uppercase tracking-tight mt-4">Choose Your Package</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                        {/* Early Bird (Yearly $19) */}
                        <div className={`relative bg-[#0a0a0a] border ${isEarlyBirdAvailable ? 'border-[#C5A059]' : 'border-white/5'} rounded-3xl p-8 shadow-[0_0_50px_rgba(197,160,89,0.15)] flex flex-col h-full transition-transform hover:scale-[1.05] z-10`}>
                            {isEarlyBirdAvailable && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C5A059] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    ONLY {100 - proCount} SLOTS LEFT
                                </div>
                            )}
                            <div className="mb-6">
                                <span className="text-xs font-black text-[#C5A059] uppercase tracking-widest">Early Bird</span>
                                <h3 className="text-5xl font-black text-white uppercase mt-2">$19<span className="text-lg text-neutral-500 ml-1">/yr</span></h3>
                                <p className="text-neutral-400 mt-2">Special one-time yearly offer!</p>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> All Core Features
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> Unlimited AI Generation
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-white">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> 4K Export + Premium Voices
                                </li>
                            </ul>
                            <button
                                onClick={() => onPurchase('price_1SqCAaChLIAUz0sEi5uzftfQ')}
                                disabled={!isEarlyBirdAvailable}
                                className={`w-full ${isEarlyBirdAvailable ? 'bg-[#C5A059] text-black hover:bg-[#d4af37]' : 'bg-white/5 text-neutral-500'} py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95`}
                            >
                                {isEarlyBirdAvailable ? 'Claim Early Bird' : 'Sold Out'}
                            </button>
                        </div>

                        {/* Standard Pro (Yearly $99) */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-[#C5A059]/30 transition-all flex flex-col h-full relative group">
                            <div className="mb-6">
                                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">Standard Pro</span>
                                <h3 className="text-4xl font-black text-white uppercase mt-2">$99<span className="text-lg text-neutral-500 ml-1">/yr</span></h3>
                                <p className="text-neutral-400 mt-2">Professional cinema production</p>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> Everything in Early Bird
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> Commercial License
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <CheckCircle2 size={16} className="text-[#C5A059]" /> API Access & Priority
                                </li>
                            </ul>
                            <button
                                onClick={() => onPurchase('price_yearly_standard')}
                                className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-lg flex items-center justify-center">
                            <Shield size={16} className="text-black" />
                        </div>
                        <span className="text-sm font-bold text-neutral-400">LazyAutoCreator © 2026</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-neutral-500">
                        <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                        <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
                    </div>
                </div>
            </footer>

            {showLegal && (
                <LegalModal
                    type={showLegal}
                    onClose={() => setShowLegal(null)}
                />
            )}
        </div>
    );
};

export default LandingPage;
