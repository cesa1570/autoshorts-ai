import React from 'react';
import { Video, Zap, Sparkles, Play, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

interface ShortsLandingProps {
    onGetStarted: () => void;
}

const ShortsLanding: React.FC<ShortsLandingProps> = ({ onGetStarted }) => {
    const features = [
        'AI-powered script generation',
        'Viral hook optimization',
        'Auto captions & subtitles',
        'Multiple voice options',
        '9:16 vertical format',
        'One-click export to TikTok/Reels/Shorts'
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] bg-[#C5A059] rounded-full blur-[150px]" />
                    <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-purple-600 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full px-4 py-2 mb-6">
                            <Sparkles size={14} className="text-[#C5A059]" />
                            <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">AI Shorts Generator</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tight mb-6 leading-[0.95]">
                            <span className="text-white">Create</span>{' '}
                            <span className="text-[#C5A059]">Viral Shorts</span>{' '}
                            <span className="text-neutral-400">in Minutes</span>
                        </h1>

                        <p className="text-lg text-neutral-400 mb-8 leading-relaxed max-w-lg">
                            Transform any topic into scroll-stopping vertical videos for TikTok, Instagram Reels, and YouTube Shorts.
                            Powered by Gemini 2.0 AI for maximum engagement.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-10">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                                    <CheckCircle2 size={14} className="text-[#C5A059] flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onGetStarted}
                                className="bg-[#C5A059] text-black px-8 py-4 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
                            >
                                Start Creating Free <ArrowRight size={16} />
                            </button>
                            <a
                                href="#demo"
                                className="border border-white/20 text-white px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Play size={16} className="text-[#C5A059]" /> Watch Demo
                            </a>
                        </div>
                    </div>

                    {/* Right - Phone Mockup */}
                    <div className="relative mx-auto">
                        <div className="relative w-[280px] h-[560px] bg-black rounded-[40px] border-[6px] border-[#222] shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#222] rounded-b-xl z-10" />
                            <video
                                className="w-full h-full object-cover"
                                autoPlay loop muted playsInline
                                src="/shorts.webm"
                            />
                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent p-4 flex flex-col justify-end">
                                <div className="text-white font-bold text-sm mb-1">AI Generated Short</div>
                                <div className="text-white/60 text-xs">#viral #ai #trending</div>
                            </div>
                        </div>
                        {/* Floating Badge */}
                        <div className="absolute -right-4 top-20 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider shadow-lg">
                            <Zap size={12} className="inline mr-1" /> 60 FPS
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-[#080808] border-y border-white/5">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: '10M+', label: 'Videos Created' },
                        { value: '500K+', label: 'Active Creators' },
                        { value: '4.9', label: 'User Rating' },
                        { value: '< 2min', label: 'Avg. Generation Time' }
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-4xl font-black text-[#C5A059] mb-2">{stat.value}</div>
                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-6">
                        Ready to Go <span className="text-[#C5A059]">Viral</span>?
                    </h2>
                    <p className="text-neutral-400 mb-10">
                        Join thousands of creators who are already using AI to dominate social media.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="bg-[#C5A059] text-black px-12 py-5 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors"
                    >
                        Get Started Free
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={20} className="text-[#C5A059]" />
                        <span className="font-black uppercase tracking-widest text-sm">LazyAutoCreator</span>
                    </div>
                    <div className="text-xs text-neutral-600">© 2026 All Rights Reserved</div>
                </div>
            </footer>
        </div>
    );
};

export default ShortsLanding;
