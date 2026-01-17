import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, Video, Clapperboard, Mic, Zap, Shield, CheckCircle2,
    ArrowRight, Play, ChevronDown, Monitor, Rocket, Calendar,
    Star, Users, Bot, Palette, Volume2, Film, Edit3, Smartphone
} from 'lucide-react';
import LegalModal from './LegalModal';
import UpgradeRequiredModal from './UpgradeRequiredModal';

// --- Components for Animation ---
const FadeInWhenVisible: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => setIsVisible(entry.isIntersecting));
        }, { threshold: 0.1 }); // Trigger when 10% visible

        const { current } = domRef;
        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

interface LandingPageProps {
    onLogin: () => void;
    onPurchase: (priceId: string) => void;
    proCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onPurchase, proCount }) => {
    const isEarlyBirdAvailable = proCount < 100;
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

    // --- Data ---
    const features = [
        {
            icon: Video,
            title: 'Shorts Engine',
            description: 'AI-generated viral shorts tailored for TikTok & Reels.',
            gradient: 'from-[#C5A059] to-[#8a6d3b]'
        },
        {
            icon: Clapperboard,
            title: 'Cinema Engine',
            description: 'Long-form documentary production with cinematic depth.',
            gradient: 'from-neutral-100 to-neutral-400'
        },
        {
            icon: Mic,
            title: 'Podcast Studio',
            description: 'Dual-host audio experiences with human-like interactions.',
            gradient: 'from-[#C5A059] to-[#E5C079]'
        },
        {
            icon: Bot,
            title: 'Script Intelligence',
            description: 'Context-aware scriptwriting powered by Gemini 2.0.',
            gradient: 'from-neutral-200 to-neutral-500'
        },
        {
            icon: Palette,
            title: 'Visual Synthesis',
            description: 'High-fidelity imagery via Imagen 3 & DALL-E 3.',
            gradient: 'from-[#C5A059] to-[#b38f4d]'
        },
        {
            icon: Volume2,
            title: 'Voice Cloning',
            description: 'Ultra-realistic multi-language voice synthesis.',
            gradient: 'from-white to-gray-400'
        }
    ];

    const roadmap = [
        { quarter: 'Q1 2026', title: 'FOUNDATION', items: ['AI Script Gen', 'Image Gen', 'Voiceover', 'Video Export'], status: 'completed' },
        { quarter: 'Q2 2026', title: 'ENHANCEMENT', items: ['Podcast Mode', 'SEO Metadata', 'Style Templates', 'Social Hub'], status: 'active' },
        { quarter: 'Q3 2026', title: 'INTEGRATION', items: ['Direct Upload', 'TikTok API', 'Auto-Schedule', 'Analytics'], status: 'planned' },
        { quarter: 'Q4 2026', title: 'EVOLUTION', items: ['Veo 3 Video', 'Real-time Preview', 'Team Collab', 'API Access'], status: 'planned' }
    ];

    const tutorials = [
        { step: '01', title: 'Select Topic', description: 'Input your core concept.', icon: Edit3 },
        { step: '02', title: 'AI Generation', description: 'Script & Asset Synthesis.', icon: Bot },
        { step: '03', title: 'Refinement', description: 'Review and Polish.', icon: Smartphone },
        { step: '04', title: 'Export', description: 'Render in 4K Quality.', icon: Film },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#C5A059] selection:text-black font-sans">

            {/* --- Navigation --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-[#C5A059]/30 bg-[#C5A059]/10 rounded-lg flex items-center justify-center">
                            <Shield size={20} className="text-[#C5A059]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-widest text-white">LazyAutoCreator</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#C5A059]"></span>
                                <span className="text-[9px] text-neutral-500 font-bold tracking-[0.2em] uppercase">Autonomous Engine</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'Showcase', 'Process', 'Roadmap', 'Pricing'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-neutral-500 hover:text-[#C5A059] text-xs font-bold uppercase tracking-widest transition-colors duration-300">
                                {item}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="hidden md:block text-white hover:text-[#C5A059] text-xs font-bold uppercase tracking-widest transition-colors">
                            Sign In
                        </button>
                        <button
                            onClick={onLogin}
                            className="bg-[#C5A059] text-black border border-[#C5A059] px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-[#C5A059] transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-[#C5A059] rounded-full blur-[150px] animate-pulse duration-[5000ms]" />
                    <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neutral-800 rounded-full blur-[150px]" />
                </div>

                {/* Video Background */}
                <div className="absolute inset-0 z-0 opacity-50 pointer-events-none mix-blend-screen">
                    <video
                        className="w-full h-full object-cover blur-xl grayscale scale-110"
                        autoPlay loop muted playsInline
                    >
                        <source src="/cinemabg.mp4" type="video/mp4" />
                    </video>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)] pointer-events-none"></div>

                <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="inline-flex items-center gap-3 bg-[#111] border border-[#C5A059]/30 rounded-full px-5 py-2 mb-10 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                            <Sparkles size={14} className="text-[#C5A059]" />
                            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Powered by Gemini 2.0 & Veo</span>
                        </div>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={200}>
                        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">Create</span>
                            <span className="block text-[#C5A059]">Viral</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-neutral-500 to-neutral-800">Legacy</span>
                        </h1>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={400}>
                        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                            The world's most advanced autonomous content engine.
                            Create YouTube Shorts, Documentaries, and Podcasts with zero manual effort.
                        </p>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={600}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={onLogin}
                                className="group relative bg-[#C5A059] text-black px-10 py-5 rounded-none font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#d4af37] overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Start Creating <ArrowRight size={18} />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                            <a
                                href="#showcase"
                                className="group bg-transparent border border-white/10 text-white px-10 py-5 rounded-none font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3"
                            >
                                <Play size={18} className="text-[#C5A059]" /> Watch Demo
                            </a>
                        </div>
                    </FadeInWhenVisible>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Scroll</span>
                    <div className="h-10 w-[1px] bg-gradient-to-b from-[#C5A059] to-transparent"></div>
                </div>
            </section>

            {/* --- Showcase Section (Video Preview) --- */}
            <section id="showcase" className="py-32 relative bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em] block mb-4">Showcase</span>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">See What's Possible</h2>
                            <p className="text-neutral-400 max-w-2xl mx-auto">Generated entirely by AI without human intervention.</p>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Mobile Preview (Shorts) */}
                        <FadeInWhenVisible delay={200}>
                            <div className="relative mx-auto w-[300px] h-[600px] bg-black rounded-[50px] border-[8px] border-[#1a1a1a] shadow-[0_0_50px_rgba(197,160,89,0.1)] overflow-hidden ring-1 ring-white/10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
                                <video
                                    className="w-full h-full object-cover"
                                    autoPlay loop muted playsInline
                                    preload="auto"
                                    src="/shorts.webm"
                                />
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-20"></div>

                                {/* Overlay UI Mockup */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                                    <h4 className="text-white font-bold text-lg mb-1">Cyberpunk City</h4>
                                    <p className="text-white/70 text-xs line-clamp-2">Generated with Gemini 2.0 Flash + Veo. #AI #Future #Tech</p>
                                </div>
                            </div>
                            <div className="text-center mt-8">
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-2">Shorts Engine</h3>
                                <p className="text-neutral-500 text-sm">9:16 Vertical Video • Viral Pacing</p>
                            </div>
                        </FadeInWhenVisible>

                        {/* Desktop Preview (Cinema) */}
                        <FadeInWhenVisible delay={400}>
                            <div className="relative mx-auto w-full max-w-2xl aspect-video bg-black rounded-lg border border-[#333] shadow-[0_0_100px_rgba(197,160,89,0.15)] overflow-hidden group">
                                <div className="absolute top-0 left-0 right-0 h-8 bg-[#111] flex items-center px-4 gap-2 border-b border-[#222] z-20">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <video
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    autoPlay loop muted playsInline
                                    preload="auto"
                                    src="/cinema.webm"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Play size={24} className="text-white fill-white" />
                                </div>
                            </div>
                            <div className="text-center mt-8">
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-2">Cinema Engine</h3>
                                <p className="text-neutral-500 text-sm">16:9 Long Form • 4K Documentary Style</p>
                            </div>
                        </FadeInWhenVisible>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section id="features" className="py-32 relative bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="mb-20 border-b border-white/5 pb-10 flex flex-col md:flex-row items-end justify-between gap-6">
                            <div>
                                <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em] block mb-4">Capabilities</span>
                                <h2 className="text-5xl font-black uppercase tracking-tight text-white m-0">Core Engine</h2>
                            </div>
                            <p className="text-neutral-500 max-w-md text-right md:text-left">
                                A suite of autonomous agents working in harmony to produce professional content.
                            </p>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                        {features.map((feature, i) => (
                            <FadeInWhenVisible key={i} delay={i * 100}>
                                <div className="group relative bg-[#0A0A0A] p-10 h-full border border-white/5 hover:border-[#C5A059]/50 transition-colors duration-500 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C5A059]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <div className={`w-12 h-12 mb-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-white/5 to-white/0 border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                                        <feature.icon size={24} className="text-[#C5A059]" />
                                    </div>

                                    <h3 className="text-xl font-black uppercase tracking-wider text-white mb-3 group-hover:text-[#C5A059] transition-colors">{feature.title}</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section >

            {/* --- Process Section --- */}
            < section id="process" className="py-32 bg-[#080808] border-y border-white/5" >
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Workflow</span>
                            <h2 className="text-4xl font-black uppercase tracking-tight mt-4 text-white">Zero To Hero</h2>
                        </div>
                    </FadeInWhenVisible>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent z-0"></div>

                        {tutorials.map((step, i) => (
                            <FadeInWhenVisible key={i} delay={i * 150}>
                                <div className="relative z-10 w-64 text-center">
                                    <div className="w-20 h-20 mx-auto bg-[#050505] border border-[#C5A059]/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.1)] mb-6 group hover:scale-110 transition-transform duration-300 cursor-default">
                                        <step.icon size={28} className="text-[#C5A059] group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="text-[#C5A059] text-[10px] font-black uppercase tracking-widest mb-2">Step {step.step}</div>
                                    <h3 className="text-lg font-black uppercase text-white mb-2">{step.title}</h3>
                                    <p className="text-xs text-neutral-500 font-medium px-4">{step.description}</p>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section >

            {/* --- Roadmap Section --- */}
            < section id="roadmap" className="py-32 bg-[#050505] relative overflow-hidden" >
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeInWhenVisible>
                        <div className="mb-20 flex items-end justify-between border-b border-white/5 pb-8">
                            <div>
                                <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Timeline</span>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-white mt-4">System Roadmap</h2>
                            </div>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {roadmap.map((phase, i) => (
                            <FadeInWhenVisible key={i} delay={i * 100}>
                                <div className={`h-full bg-[#0A0A0A] p-8 border ${phase.status === 'active' ? 'border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.1)]' : 'border-white/5'} flex flex-col`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`text-xs font-mono font-bold ${phase.status === 'completed' ? 'text-emerald-500' : phase.status === 'active' ? 'text-[#C5A059]' : 'text-neutral-600'}`}>
                                            [{phase.title}]
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${phase.status === 'active' ? 'bg-[#C5A059] animate-pulse' : phase.status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-800'}`}></div>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{phase.quarter}</h3>
                                    <ul className="space-y-3 flex-1">
                                        {phase.items.map((item, j) => (
                                            <li key={j} className="flex items-center gap-3 text-xs font-bold text-neutral-400 uppercase tracking-wide">
                                                <div className={`w-1 h-1 ${phase.status !== 'planned' ? 'bg-white' : 'bg-neutral-800'}`}></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section >

            {/* --- Pricing Section --- */}
            < section id="pricing" className="py-32 bg-[#080808]" >
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">Access</span>
                            <h2 className="text-5xl font-black uppercase tracking-tight text-white mt-4">Select Tier</h2>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Early Bird */}
                        <FadeInWhenVisible delay={200}>
                            <div className="relative group bg-[#0A0A0A] border border-[#C5A059]/30 hover:border-[#C5A059] rounded-sm p-10 transition-all duration-300 h-full flex flex-col">
                                {isEarlyBirdAvailable && (
                                    <div className="absolute top-0 right-0 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1">
                                        Limited Offer
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.2em] mb-2">Early Bird Access</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-white">$19</span>
                                        <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">/ Year</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {['Full System Access', 'Priority Rendering', 'Commercial Rights', '4K Export Support', 'All Future Updates'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-neutral-300">
                                            <CheckCircle2 size={16} className="text-[#C5A059]" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => onPurchase('price_1SqCAaChLIAUz0sEi5uzftfQ')}
                                    disabled={!isEarlyBirdAvailable}
                                    className="w-full bg-[#C5A059] text-black py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-[#d4af37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isEarlyBirdAvailable ? 'Secure Access' : 'Limit Reached'}
                                </button>
                            </div>
                        </FadeInWhenVisible>

                        {/* Standard Pro */}
                        <FadeInWhenVisible delay={400}>
                            <div className="relative group bg-[#050505] border border-white/5 hover:border-white/20 rounded-sm p-10 transition-all duration-300 h-full flex flex-col opacity-60 hover:opacity-100">
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Enterprise Standard</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-white">$99</span>
                                        <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">/ Year</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {['Full System Access', 'Standard Queue', 'Commercial Rights', '1080p Export', 'Basic Support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-neutral-400">
                                            <CheckCircle2 size={16} className="text-neutral-600" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => onPurchase('price_1SqCD0ChLIAUz0sE8Ylb8t0T')}
                                    className="w-full bg-transparent border border-white/10 text-white py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
                                >
                                    Subscribe Pro
                                </button>
                            </div>
                        </FadeInWhenVisible>
                    </div>
                </div>
            </section >

            {/* --- Footer --- */}
            < footer className="py-16 border-t border-white/5 bg-[#020202]" >
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Shield size={24} className="text-[#C5A059]" />
                            <span className="text-lg font-black uppercase tracking-widest text-white">LazyAutoCreator</span>
                        </div>
                        <p className="text-xs text-neutral-600 uppercase tracking-widest">Autonomous Content Generation System</p>
                    </div>
                    <div className="flex items-center gap-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        <button onClick={() => setShowLegal('privacy')} className="hover:text-[#C5A059] transition-colors">Privacy Database</button>
                        <button onClick={() => setShowLegal('terms')} className="hover:text-[#C5A059] transition-colors">Terms of Use</button>
                        <button className="hover:text-[#C5A059] transition-colors">Contact Support</button>
                    </div>
                    <div className="text-xs text-neutral-700 font-mono">
                        VERSION 2.0.4 [BETA]
                    </div>
                </div>
            </footer >

            {showLegal && (
                <LegalModal
                    type={showLegal}
                    onClose={() => setShowLegal(null)}
                />
            )}
        </div >
    );
};

export default LandingPage;
