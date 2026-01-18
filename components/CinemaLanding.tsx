import React from 'react';
import { Clapperboard, Film, Sparkles, Play, ArrowRight, CheckCircle2, Shield, Clock, Layers } from 'lucide-react';

interface CinemaLandingProps {
    onGetStarted: () => void;
}

const CinemaLanding: React.FC<CinemaLandingProps> = ({ onGetStarted }) => {
    const features = [
        'Documentary-style AI scripts',
        'Cinematic 16:9 format',
        '4K video quality export',
        'Professional voiceover',
        'Multi-scene storyboard',
        'B-roll generation'
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 opacity-25 pointer-events-none">
                    <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[180px]" />
                    <div className="absolute bottom-[10%] right-[30%] w-[400px] h-[400px] bg-[#C5A059] rounded-full blur-[150px]" />
                </div>

                {/* Video Background */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <video
                        className="w-full h-full object-cover grayscale"
                        autoPlay loop muted playsInline
                        src="/cinemabg.mp4"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
                        <Film size={14} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">AI Movie Maker</span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-black uppercase tracking-tight mb-8 leading-[0.9]">
                        <span className="text-white">Create</span>{' '}
                        <span className="text-[#C5A059]">Cinematic</span><br />
                        <span className="text-neutral-400">Documentaries</span>
                    </h1>

                    <p className="text-xl text-neutral-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Transform complex topics into compelling long-form documentaries with AI.
                        Professional narration, stunning visuals, and theatrical quality.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                <CheckCircle2 size={14} className="text-[#C5A059]" />
                                <span className="text-sm text-neutral-300">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onGetStarted}
                            className="bg-[#C5A059] text-black px-10 py-5 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
                        >
                            Start Your Film <ArrowRight size={16} />
                        </button>
                        <a
                            href="#showcase"
                            className="border border-white/20 text-white px-10 py-5 font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Play size={16} className="text-[#C5A059]" /> View Samples
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-[#080808]">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-black uppercase text-center mb-16">
                        <span className="text-[#C5A059]">Hollywood-Grade</span> Production
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Clapperboard, title: 'Script Intelligence', desc: 'AI writes compelling documentary scripts with research-backed narratives.' },
                            { icon: Layers, title: 'Scene Composition', desc: 'Automatic storyboard generation with optimal visual pacing.' },
                            { icon: Clock, title: 'Fast Rendering', desc: 'Export 10-30 minute documentaries in under 15 minutes.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 hover:border-[#C5A059]/30 transition-colors">
                                <item.icon size={32} className="text-[#C5A059] mb-4" />
                                <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-neutral-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 text-center bg-gradient-to-b from-[#080808] to-[#050505]">
                <div className="max-w-3xl mx-auto px-6">
                    <Sparkles size={40} className="text-[#C5A059] mx-auto mb-6" />
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-6">
                        Your Story Deserves <span className="text-[#C5A059]">Cinema</span>
                    </h2>
                    <p className="text-neutral-400 mb-10">
                        Stop settling for basic videos. Create documentaries that captivate audiences.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="bg-[#C5A059] text-black px-12 py-5 font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-colors"
                    >
                        Create Your Documentary
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

export default CinemaLanding;
