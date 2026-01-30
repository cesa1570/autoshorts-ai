import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, Video, Clapperboard, Mic, Zap, Shield, CheckCircle2,
    ArrowRight, Play, ChevronDown, Monitor, Rocket, Calendar,
    Star, Users, Bot, Palette, Volume2, Film, Edit3, Smartphone, Activity, MessageSquare, X, Send, Loader2,
    Globe, Clock, ShieldCheck, CreditCard, Quote
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import LegalModal from './LegalModal';
import UpgradeRequiredModal from './UpgradeRequiredModal';
import { useLanguage, type Language } from '../hooks/useLanguage';

// --- Components for Animation ---
const FadeInWhenVisible: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => setIsVisible(entry.isIntersecting));
        }, { threshold: 0.1 });

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

// --- Countdown Timer Component ---
const CountdownTimer: React.FC<{ targetDate: Date; language: Language }> = ({ targetDate, language }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const labels = language === 'th'
        ? { d: 'วัน', h: 'ชม.', m: 'นาที', s: 'วินาที' }
        : { d: 'days', h: 'hrs', m: 'min', s: 'sec' };

    return (
        <div className="flex items-center gap-2 text-xs font-mono">
            <div className="bg-black/50 px-2 py-1 rounded">
                <span className="text-white font-bold">{timeLeft.days}</span>
                <span className="text-neutral-400 ml-1">{labels.d}</span>
            </div>
            <span className="text-[#C5A059]">:</span>
            <div className="bg-black/50 px-2 py-1 rounded">
                <span className="text-white font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-neutral-400 ml-1">{labels.h}</span>
            </div>
            <span className="text-[#C5A059]">:</span>
            <div className="bg-black/50 px-2 py-1 rounded">
                <span className="text-white font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-neutral-400 ml-1">{labels.m}</span>
            </div>
            <span className="text-[#C5A059]">:</span>
            <div className="bg-black/50 px-2 py-1 rounded">
                <span className="text-white font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-neutral-400 ml-1">{labels.s}</span>
            </div>
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
    const slotsRemaining = 100 - proCount;
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Language hook
    const { language, toggleLanguage, t } = useLanguage();

    // Countdown target: 7 days from now (or set a fixed date)
    const [countdownTarget] = useState(() => {
        const target = new Date();
        target.setDate(target.getDate() + 7);
        return target;
    });

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) return;

        setIsSendingFeedback(true);
        try {
            const { error } = await supabase
                .from('feedback')
                .insert([
                    {
                        message: feedbackMessage,
                        created_at: new Date().toISOString(),
                        source: 'landing_page'
                    }
                ]);

            if (error) throw error;

            alert('Feedback sent successfully! Thank you.');
            setShowFeedback(false);
            setFeedbackMessage('');
        } catch (error) {
            console.error('Error sending feedback:', error);
            alert('Could not send message. Please try again later.');
        } finally {
            setIsSendingFeedback(false);
        }
    };

    // --- Data ---
    const features = [
        {
            icon: Video,
            titleKey: 'features.shorts.title',
            descKey: 'features.shorts.desc',
            gradient: 'from-[#C5A059] to-[#8a6d3b]'
        },
        {
            icon: Clapperboard,
            titleKey: 'features.cinema.title',
            descKey: 'features.cinema.desc',
            gradient: 'from-neutral-100 to-neutral-400'
        },
        {
            icon: Mic,
            titleKey: 'features.podcast.title',
            descKey: 'features.podcast.desc',
            gradient: 'from-[#C5A059] to-[#E5C079]'
        },
        {
            icon: Bot,
            titleKey: 'features.script.title',
            descKey: 'features.script.desc',
            gradient: 'from-neutral-200 to-neutral-500'
        },
        {
            icon: Palette,
            titleKey: 'features.visual.title',
            descKey: 'features.visual.desc',
            gradient: 'from-[#C5A059] to-[#b38f4d]'
        },
        {
            icon: Activity,
            titleKey: 'features.analytics.title',
            descKey: 'features.analytics.desc',
            gradient: 'from-emerald-400 to-emerald-600'
        }
    ];

    const roadmap = [
        { quarter: 'Q1 2026', title: 'FOUNDATION', items: ['AI Script Gen', 'Image Gen', 'Voiceover', 'Video Export'], status: 'completed' },
        { quarter: 'Q2 2026', title: 'ENHANCEMENT', items: ['Podcast Mode', 'SEO Metadata', 'Style Templates', 'Social Hub'], status: 'active' },
        { quarter: 'Q3 2026', title: 'INTEGRATION', items: ['Direct Upload', 'TikTok API', 'Auto-Schedule', 'Analytics'], status: 'planned' },
        { quarter: 'Q4 2026', title: 'EVOLUTION', items: ['Veo 3 Video', 'Real-time Preview', 'Team Collab', 'API Access'], status: 'planned' }
    ];

    const tutorials = [
        { step: '01', titleKey: 'process.step1.title', descKey: 'process.step1.desc', icon: Edit3 },
        { step: '02', titleKey: 'process.step2.title', descKey: 'process.step2.desc', icon: Bot },
        { step: '03', titleKey: 'process.step3.title', descKey: 'process.step3.desc', icon: Smartphone },
        { step: '04', titleKey: 'process.step4.title', descKey: 'process.step4.desc', icon: Film },
    ];

    // Social proof stats
    const stats = [
        { value: '500+', labelKey: 'social.videosCreated', icon: Video },
        { value: '50+', labelKey: 'social.activeCreators', icon: Users },
        { value: '4.9/5', labelKey: 'social.rating', icon: Star },
    ];

    // Testimonials
    const testimonials = [
        {
            nameKey: 'testimonial.1.name',
            roleKey: 'testimonial.1.role',
            textKey: 'testimonial.1.text',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
        },
        {
            nameKey: 'testimonial.2.name',
            roleKey: 'testimonial.2.role',
            textKey: 'testimonial.2.text',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
        },
        {
            nameKey: 'testimonial.3.name',
            roleKey: 'testimonial.3.role',
            textKey: 'testimonial.3.text',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike'
        }
    ];

    // FAQ data with translations
    const faqItems = language === 'th' ? [
        { q: "ใช้วิดีโอเพื่อการค้าได้ไหม?", a: "ได้ครับ ทุกแพ็กเกจ (Early Bird & Enterprise) รวมสิทธิ์เชิงพาณิชย์เต็มรูปแบบ คุณเป็นเจ้าของคอนเทนต์ 100%" },
        { q: "ระบบ AI Credit ทำงานอย่างไร?", a: "แต่ละแพ็กเกจจะได้รับโทเค็นรายเดือน ใช้สำหรับสร้างสคริปต์ ภาพ เสียงพากย์ และเรนเดอร์วิดีโอ" },
        { q: "ยกเลิกสมาชิกได้ไหม?", a: "ได้ครับ คุณสามารถยกเลิกได้ตลอดเวลาจากแดชบอร์ด สิทธิ์การใช้งานจะยังคงอยู่จนสิ้นสุดรอบการชำระเงิน" },
        { q: "วิดีโอมี Watermark ไหม?", a: "ไม่มีครับ วิดีโอจากแพ็กเกจเสียเงินทั้งหมดไม่มี Watermark และมีคุณภาพระดับมืออาชีพ" },
        { q: "ถ้าใช้เกินลิมิตจะเป็นอย่างไร?", a: "คุณสามารถซื้อแพ็กเสริมหรืออัพเกรดแพ็กเกจได้ทันทีจากแดชบอร์ด" },
        { q: "คืนเงินได้ไหม?", a: "หากระบบไม่สามารถสร้างคอนเทนต์ตามที่อธิบาย ติดต่อ Support ภายใน 7 วันเพื่อขอคืนเงินเต็มจำนวน" }
    ] : [
        { q: "Can I use the videos for commercial purposes?", a: "Yes. All plans (Early Bird & Enterprise) include full commercial rights. You own 100% of the content you generate." },
        { q: "How does the AI Credit system work?", a: "Each tier receives a monthly allowance of tokens. These tokens are used for generating scripts, images, voiceovers, and rendering videos." },
        { q: "Can I cancel my subscription anytime?", a: "Absolutely. You can cancel directly from your dashboard at any time. Your access will continue until the end of your billing period." },
        { q: "Do the videos have watermarks?", a: "No. All exports from our paid plans are 100% watermark-free and professional grade." },
        { q: "What happens if I hit the limit?", a: "If you exceed your monthly limits, you can easily purchase top-up packs or upgrade your tier instantly from the dashboard." },
        { q: "Do you offer refunds?", a: "We stand by our product. If the system doesn't generate content as described, contact support within 7 days for a full refund." }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#C5A059] selection:text-black font-sans">

            {/* --- Urgency Banner --- */}
            {isEarlyBirdAvailable && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#C5A059] via-[#d4af37] to-[#C5A059] text-black py-2 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔥</span>
                            <span className="font-black text-xs sm:text-sm uppercase tracking-wide">
                                {t('urgency.title')}: {t('urgency.price')}
                            </span>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-black/20"></div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-xs bg-black/20 px-3 py-1 rounded-full">
                                {slotsRemaining} {t('urgency.slots')}
                            </span>
                            <CountdownTimer targetDate={countdownTarget} language={language} />
                        </div>
                        <button
                            onClick={onLogin}
                            className="hidden sm:flex items-center gap-2 bg-black text-[#C5A059] px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-neutral-900 transition-colors"
                        >
                            {t('nav.getStarted')} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- Navigation --- */}
            <nav className={`fixed ${isEarlyBirdAvailable ? 'top-10 sm:top-10' : 'top-0'} left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5`}>
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
                        {[
                            { key: 'features', label: t('nav.features') },
                            { key: 'showcase', label: t('nav.showcase') },
                            { key: 'process', label: t('nav.process') },
                            { key: 'roadmap', label: t('nav.roadmap') },
                            { key: 'pricing', label: t('nav.pricing') }
                        ].map((item) => (
                            <a key={item.key} href={`#${item.key}`} className="text-neutral-500 hover:text-[#C5A059] text-xs font-bold uppercase tracking-widest transition-colors duration-300">
                                {item.label}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <Globe size={14} className="text-[#C5A059]" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {language === 'en' ? 'TH' : 'EN'}
                            </span>
                        </button>
                        <button onClick={onLogin} className="hidden md:block text-white hover:text-[#C5A059] text-xs font-bold uppercase tracking-widest transition-colors">
                            {t('nav.signin')}
                        </button>
                        <button
                            onClick={onLogin}
                            className="bg-[#C5A059] text-black border border-[#C5A059] px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-[#C5A059] transition-all duration-300"
                        >
                            {t('nav.getStarted')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className={`relative min-h-screen flex items-center justify-center ${isEarlyBirdAvailable ? 'pt-32' : 'pt-20'} overflow-hidden`}>
                {/* Abstract Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-[#C5A059] rounded-full blur-[150px] animate-pulse duration-[5000ms]" />
                    <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neutral-800 rounded-full blur-[150px]" />
                </div>

                {/* Video Background */}
                <div className="absolute inset-0 z-0 opacity-50 pointer-events-none mix-blend-screen">
                    <video
                        className="w-full h-full object-cover blur-sm grayscale scale-110"
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
                            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">{t('hero.badge')}</span>
                        </div>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={200}>
                        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">{t('hero.title1')}</span>
                            <span className="block text-[#C5A059]">{t('hero.title2')}</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-neutral-500 to-neutral-800">{t('hero.title3')}</span>
                        </h1>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={400}>
                        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </FadeInWhenVisible>

                    <FadeInWhenVisible delay={600}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={onLogin}
                                className="group relative bg-[#C5A059] text-black px-10 py-5 rounded-none font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#d4af37] overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {t('hero.cta')} <ArrowRight size={18} />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                            <a
                                href="#showcase"
                                className="group bg-transparent border border-white/10 text-white px-10 py-5 rounded-none font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3"
                            >
                                <Play size={18} className="text-[#C5A059]" /> {t('hero.watchDemo')}
                            </a>
                        </div>
                    </FadeInWhenVisible>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">{t('hero.scroll')}</span>
                    <div className="h-10 w-[1px] bg-gradient-to-b from-[#C5A059] to-transparent"></div>
                </div>
            </section>

            {/* --- Social Proof Section --- */}
            <section className="py-16 bg-[#080808] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-12">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">{t('social.title')}</span>
                        </div>
                    </FadeInWhenVisible>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mb-16">
                        {stats.map((stat, i) => (
                            <FadeInWhenVisible key={i} delay={i * 100}>
                                <div className="text-center group">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <stat.icon size={24} className="text-[#C5A059]" />
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t(stat.labelKey)}</div>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>

                    {/* Testimonials */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, i) => (
                            <FadeInWhenVisible key={i} delay={i * 150}>
                                <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-lg hover:border-[#C5A059]/30 transition-colors group">
                                    <Quote size={24} className="text-[#C5A059]/30 mb-4" />
                                    <p className="text-neutral-300 text-sm mb-6 leading-relaxed italic">
                                        "{t(testimonial.textKey)}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={testimonial.avatar}
                                            alt={t(testimonial.nameKey)}
                                            className="w-10 h-10 rounded-full bg-neutral-800"
                                        />
                                        <div>
                                            <div className="text-white font-bold text-sm">{t(testimonial.nameKey)}</div>
                                            <div className="text-neutral-500 text-xs">{t(testimonial.roleKey)}</div>
                                        </div>
                                    </div>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Showcase Section (Video Preview) --- */}
            <section id="showcase" className="py-32 relative bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em] block mb-4">{t('nav.showcase')}</span>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">{t('showcase.title')}</h2>
                            <p className="text-neutral-400 max-w-2xl mx-auto">{t('showcase.subtitle')}</p>
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
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-2">{t('showcase.shorts')}</h3>
                                <p className="text-neutral-500 text-sm">{t('showcase.shortsDesc')}</p>
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
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-2">{t('showcase.cinema')}</h3>
                                <p className="text-neutral-500 text-sm">{t('showcase.cinemaDesc')}</p>
                            </div>
                        </FadeInWhenVisible>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section id="features" className="py-32 relative bg-[#080808]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="mb-20 border-b border-white/5 pb-10 flex flex-col md:flex-row items-end justify-between gap-6">
                            <div>
                                <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em] block mb-4">{t('nav.features')}</span>
                                <h2 className="text-5xl font-black uppercase tracking-tight text-white m-0">{t('features.title')}</h2>
                            </div>
                            <p className="text-neutral-500 max-w-md text-right md:text-left">
                                {t('features.subtitle')}
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

                                    <h3 className="text-xl font-black uppercase tracking-wider text-white mb-3 group-hover:text-[#C5A059] transition-colors">{t(feature.titleKey)}</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">{t(feature.descKey)}</p>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Process Section --- */}
            <section id="process" className="py-32 bg-[#050505] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">{t('nav.process')}</span>
                            <h2 className="text-4xl font-black uppercase tracking-tight mt-4 text-white">{t('process.title')}</h2>
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
                                    <h3 className="text-lg font-black uppercase text-white mb-2">{t(step.titleKey)}</h3>
                                    <p className="text-xs text-neutral-500 font-medium px-4">{t(step.descKey)}</p>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Roadmap Section --- */}
            <section id="roadmap" className="py-32 bg-[#080808] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeInWhenVisible>
                        <div className="mb-20 flex items-end justify-between border-b border-white/5 pb-8">
                            <div>
                                <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">{t('nav.roadmap')}</span>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-white mt-4">{t('roadmap.title')}</h2>
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
            </section>

            {/* --- Pricing Section --- */}
            <section id="pricing" className="py-32 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-24">
                            <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.5em]">{t('nav.pricing')}</span>
                            <h2 className="text-5xl font-black uppercase tracking-tight text-white mt-4">{t('pricing.title')}</h2>
                        </div>
                    </FadeInWhenVisible>

                    {/* Trust Badges */}
                    <FadeInWhenVisible>
                        <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('trust.moneyBack')}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                                <CheckCircle2 size={16} className="text-white/70" />
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('trust.noQuestions')}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                                <CreditCard size={16} className="text-white/70" />
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('trust.securePayment')}</span>
                            </div>
                        </div>
                    </FadeInWhenVisible>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Early Bird */}
                        <FadeInWhenVisible delay={200}>
                            <div className="relative group bg-[#0A0A0A] border border-[#C5A059]/30 hover:border-[#C5A059] rounded-sm p-10 transition-all duration-300 h-full flex flex-col">
                                {isEarlyBirdAvailable && (
                                    <div className="absolute top-0 right-0 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1">
                                        {t('pricing.limited')}
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.2em] mb-2">{t('pricing.earlyBird')}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-white">$19</span>
                                        <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">{t('pricing.perYear')}</span>
                                    </div>
                                    {isEarlyBirdAvailable && (
                                        <div className="mt-2 text-xs text-[#C5A059] font-bold">
                                            {slotsRemaining} {t('urgency.slots')}
                                        </div>
                                    )}
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {[t('pricing.feature1'), t('pricing.feature2'), t('pricing.feature3'), t('pricing.feature4'), t('pricing.feature5')].map((feature, i) => (
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
                                    {isEarlyBirdAvailable ? t('pricing.secureAccess') : t('pricing.limitReached')}
                                </button>
                            </div>
                        </FadeInWhenVisible>

                        {/* Standard Pro */}
                        <FadeInWhenVisible delay={400}>
                            <div className="relative group bg-[#050505] border border-white/10 hover:border-white/30 rounded-sm p-10 transition-all duration-300 h-full flex flex-col hover:shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 group-hover:text-white transition-colors">{t('pricing.enterprise')}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-white">$99</span>
                                        <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">{t('pricing.perYear')}</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {[t('pricing.feature1'), t('pricing.feature6'), t('pricing.feature3'), t('pricing.feature7'), t('pricing.feature8')].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">
                                            <CheckCircle2 size={16} className="text-neutral-600 group-hover:text-white transition-colors" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => onPurchase('price_1SqCD0ChLIAUz0sE8Ylb8t0T')}
                                    className="w-full bg-transparent border border-white/10 text-white py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                                >
                                    {t('pricing.subscribePro')}
                                </button>
                            </div>
                        </FadeInWhenVisible>
                    </div>
                </div>
            </section>

            {/* --- FAQ Section --- */}
            <section className="py-20 bg-[#080808] border-t border-white/5">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeInWhenVisible>
                        <div className="text-center mb-12">
                            <span className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em]">Support</span>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-2">{t('faq.title')}</h2>
                        </div>
                    </FadeInWhenVisible>

                    <div className="space-y-2">
                        {faqItems.map((item, i) => (
                            <FadeInWhenVisible key={i} delay={i * 50}>
                                <div className="border border-white/5 bg-[#0A0A0A] rounded-sm overflow-hidden transition-all duration-300 hover:border-white/10">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between p-6 text-left"
                                    >
                                        <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${openFaq === i ? 'text-[#C5A059]' : 'text-neutral-300'}`}>
                                            {item.q}
                                        </span>
                                        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#C5A059]' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-6 pt-0 text-sm text-neutral-400 font-medium leading-relaxed">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-16 border-t border-white/5 bg-[#020202]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Shield size={24} className="text-[#C5A059]" />
                            <span className="text-lg font-black uppercase tracking-widest text-white">LazyAutoCreator</span>
                        </div>
                        <p className="text-xs text-neutral-600 uppercase tracking-widest">{t('footer.tagline')}</p>
                    </div>
                    <div className="flex items-center gap-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        <button onClick={() => setShowLegal('privacy')} className="hover:text-[#C5A059] transition-colors">{t('footer.privacy')}</button>
                        <button onClick={() => setShowLegal('terms')} className="hover:text-[#C5A059] transition-colors">{t('footer.terms')}</button>
                        <button onClick={() => setShowFeedback(true)} className="hover:text-[#C5A059] transition-colors">{t('footer.contact')}</button>
                    </div>
                    <div className="text-xs text-neutral-700 font-mono">
                        VERSION 0 [BETA]
                    </div>
                </div>
            </footer>

            {showLegal && (
                <LegalModal
                    type={showLegal}
                    onClose={() => setShowLegal(null)}
                />
            )}

            {showFeedback && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowFeedback(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                                <MessageSquare size={20} className="text-[#C5A059]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Feedback</h3>
                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Share your thoughts with us</p>
                            </div>
                        </div>

                        <textarea
                            className="w-full h-40 bg-black border border-white/10 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059] transition-colors mb-6 resize-none font-medium"
                            placeholder="Type your feedback, feature requests, or bug reports here..."
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                        />

                        <button
                            onClick={handleSendFeedback}
                            disabled={!feedbackMessage.trim() || isSendingFeedback}
                            className="w-full bg-[#C5A059] text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSendingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
