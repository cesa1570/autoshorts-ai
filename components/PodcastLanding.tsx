import React from 'react';
import { Mic, Headphones, Sparkles, Play, ArrowRight, CheckCircle2, Shield, Users, Radio } from 'lucide-react';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';

interface PodcastLandingProps {
    onGetStarted: () => void;
}

const PodcastLanding: React.FC<PodcastLandingProps> = ({ onGetStarted }) => {
    useBreadcrumbSchema([
        { name: 'Home', item: '/' },
        { name: 'Podcast Studio', item: '/podcast' }
    ]);

    const features = [
        'Dual-host AI conversations',
        'Natural human-like dialogue',
        'Multiple voice personalities',
        'Background music integration',
        'Chapter markers',
        'MP3 & WAV export'
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-[40%] left-[10%] w-[400px] h-[400px] bg-purple-600 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[30%] right-[20%] w-[350px] h-[350px] bg-[#C5A059] rounded-full blur-[150px]" />
                </div>

                {/* Sound Wave Animation Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="flex gap-1">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-[#C5A059] rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 100 + 50}px`,
                                    animationDelay: `${i * 0.05}s`,
                                    animationDuration: `${Math.random() * 0.5 + 0.5}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                            <Radio size={14} className="text-purple-400" />
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Podcast Creator</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tight mb-6 leading-[0.95]">
                            <span className="text-white">Launch Your</span>{' '}
                            <span className="text-[#C5A059]">Podcast</span>{' '}
                            <span className="text-neutral-400">Today</span>
                        </h1>

                        <p className="text-lg text-neutral-400 mb-8 leading-relaxed max-w-lg">
                            Create engaging podcast episodes with AI-generated hosts that sound incredibly human.
                            No recording equipment needed. Just your ideas.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-10">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                                    <CheckCircle2 size={14} className="text-purple-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onGetStarted}
                                className="bg-[#C5A059] text-black px-8 py-4 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
                            >
                                Create Episode <ArrowRight size={16} />
                            </button>
                            <a
                                href="#listen"
                                className="border border-white/20 text-white px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Headphones size={16} className="text-purple-400" /> Listen Sample
                            </a>
                        </div>
                    </div>

                    {/* Right - Podcast Visual */}
                    <div className="relative flex items-center justify-center">
                        <div className="relative w-72 h-72 bg-gradient-to-br from-purple-600/20 to-[#C5A059]/20 rounded-full flex items-center justify-center border border-white/10">
                            <div className="w-56 h-56 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                                <Mic size={80} className="text-[#C5A059]" />
                            </div>

                            {/* Floating Badges */}
                            <div className="absolute -left-4 top-10 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2">
                                <Users size={14} /> Host A
                            </div>
                            <div className="absolute -right-4 bottom-10 bg-[#C5A059] text-black px-3 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2">
                                <Users size={14} /> Host B
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-[#080808] border-y border-white/5">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-3xl font-black uppercase text-center mb-16">
                        From <span className="text-[#C5A059]">Idea</span> to <span className="text-purple-400">Episode</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Choose Topic', desc: 'Enter your podcast topic or paste a script. AI handles the rest.' },
                            { step: '02', title: 'Select Voices', desc: 'Pick from dozens of realistic AI voices for your hosts.' },
                            { step: '03', title: 'Generate & Export', desc: 'AI creates natural dialogue. Download in MP3 or WAV.' }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-5xl font-black text-purple-600/30 mb-4">{item.step}</div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-neutral-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <Sparkles size={40} className="text-[#C5A059] mx-auto mb-6" />
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-6">
                        Your Voice, <span className="text-purple-400">Amplified</span>
                    </h2>
                    <p className="text-neutral-400 mb-10">
                        Join thousands of content creators producing professional podcasts with AI.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="bg-[#C5A059] text-black px-12 py-5 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors"
                    >
                        Start Your Podcast Free
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

export default PodcastLanding;
