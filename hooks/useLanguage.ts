import { useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'th';

interface UseLanguageReturn {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
    en: {
        // Navigation
        'nav.features': 'Features',
        'nav.showcase': 'Showcase',
        'nav.process': 'Process',
        'nav.roadmap': 'Roadmap',
        'nav.pricing': 'Pricing',
        'nav.signin': 'Sign In',
        'nav.getStarted': 'Get Started',

        // Urgency Banner
        'urgency.title': '🔥 Early Bird Offer',
        'urgency.price': '$19/year (normally $99)',
        'urgency.slots': 'slots remaining!',
        'urgency.hurry': 'Hurry up!',

        // Hero
        'hero.badge': 'Powered by Gemini 2.0 & Veo',
        'hero.title1': 'Create',
        'hero.title2': 'Viral',
        'hero.title3': 'Legacy',
        'hero.subtitle': "The world's most advanced autonomous content engine. Create YouTube Shorts, Documentaries, and Podcasts with zero manual effort.",
        'hero.cta': 'Start Creating',
        'hero.watchDemo': 'Watch Demo',
        'hero.scroll': 'Scroll',

        // Social Proof
        'social.videosCreated': 'Videos Created',
        'social.activeCreators': 'Active Creators',
        'social.rating': 'User Rating',
        'social.title': 'Trusted by Creators Worldwide',

        // Testimonials
        'testimonial.1.name': 'Alex Chen',
        'testimonial.1.role': 'YouTube Creator',
        'testimonial.1.text': 'This tool saved me 20+ hours per week. The AI scripts are incredibly natural and engaging!',
        'testimonial.2.name': 'Sarah Miller',
        'testimonial.2.role': 'Content Agency',
        'testimonial.2.text': 'We switched from expensive video teams to LazyAutoCreator. ROI is insane.',
        'testimonial.3.name': 'Mike Johnson',
        'testimonial.3.role': 'TikTok Influencer',
        'testimonial.3.text': 'My shorts go viral consistently now. The AI understands what works!',

        // Showcase
        'showcase.title': "See What's Possible",
        'showcase.subtitle': 'Generated entirely by AI without human intervention.',
        'showcase.shorts': 'Shorts Engine',
        'showcase.shortsDesc': '9:16 Vertical Video • Viral Pacing',
        'showcase.cinema': 'Cinema Engine',
        'showcase.cinemaDesc': '16:9 Long Form • 4K Documentary Style',

        // Features
        'features.title': 'Core Engine',
        'features.subtitle': 'A suite of autonomous agents working in harmony to produce professional content.',
        'features.shorts.title': 'Shorts Engine',
        'features.shorts.desc': 'AI-generated viral shorts tailored for TikTok & Reels.',
        'features.cinema.title': 'Cinema Engine',
        'features.cinema.desc': 'Long-form documentary production with cinematic depth.',
        'features.podcast.title': 'Podcast Studio',
        'features.podcast.desc': 'Dual-host audio experiences with human-like interactions.',
        'features.script.title': 'Script Intelligence',
        'features.script.desc': 'Context-aware scriptwriting powered by Gemini 2.0.',
        'features.visual.title': 'Visual Synthesis',
        'features.visual.desc': 'High-fidelity imagery via Imagen 3 & DALL-E 3.',
        'features.analytics.title': 'Usage Analytics',
        'features.analytics.desc': 'Real-time token usage & cost tracking dashboard.',

        // Process
        'process.title': 'Zero To Hero',
        'process.step1.title': 'Select Topic',
        'process.step1.desc': 'Input your core concept.',
        'process.step2.title': 'AI Generation',
        'process.step2.desc': 'Script & Asset Synthesis.',
        'process.step3.title': 'Refinement',
        'process.step3.desc': 'Review and Polish.',
        'process.step4.title': 'Export',
        'process.step4.desc': 'Render in 4K Quality.',

        // Roadmap
        'roadmap.title': 'System Roadmap',

        // Pricing
        'pricing.title': 'Select Tier',
        'pricing.earlyBird': 'Early Bird Access',
        'pricing.enterprise': 'Enterprise Standard',
        'pricing.perYear': '/ Year',
        'pricing.limited': 'Limited Offer',
        'pricing.limitReached': 'Limit Reached',
        'pricing.secureAccess': 'Secure Access',
        'pricing.subscribePro': 'Subscribe Pro',
        'pricing.feature1': 'Full System Access',
        'pricing.feature2': 'Priority Rendering',
        'pricing.feature3': 'Commercial Rights',
        'pricing.feature4': '4K Export Support',
        'pricing.feature5': 'All Future Updates',
        'pricing.feature6': 'High-Priority Queue',
        'pricing.feature7': '4K Cinema Export',
        'pricing.feature8': 'Priority Support',

        // Trust Badges
        'trust.moneyBack': '7-Day Money Back Guarantee',
        'trust.noQuestions': 'No Questions Asked',
        'trust.securePayment': 'Secure Payment via Stripe',

        // FAQ
        'faq.title': 'Frequently Asked Questions',

        // Footer
        'footer.privacy': 'Privacy Database',
        'footer.terms': 'Terms of Use',
        'footer.contact': 'Contact Support',
        'footer.tagline': 'Autonomous Content Generation System',
    },
    th: {
        // Navigation
        'nav.features': 'ฟีเจอร์',
        'nav.showcase': 'ตัวอย่าง',
        'nav.process': 'ขั้นตอน',
        'nav.roadmap': 'แผนงาน',
        'nav.pricing': 'ราคา',
        'nav.signin': 'เข้าสู่ระบบ',
        'nav.getStarted': 'เริ่มต้นใช้งาน',

        // Urgency Banner
        'urgency.title': '🔥 โปรโมชั่นพิเศษ',
        'urgency.price': '$19/ปี (ปกติ $99)',
        'urgency.slots': 'สิทธิ์ที่เหลือ!',
        'urgency.hurry': 'รีบเลย!',

        // Hero
        'hero.badge': 'ขับเคลื่อนด้วย Gemini 2.0 & Veo',
        'hero.title1': 'สร้าง',
        'hero.title2': 'ไวรัล',
        'hero.title3': 'คอนเทนต์',
        'hero.subtitle': 'ระบบสร้างคอนเทนต์อัตโนมัติที่ล้ำสมัยที่สุด สร้าง YouTube Shorts, สารคดี และ Podcast โดยไม่ต้องทำอะไรเลย',
        'hero.cta': 'เริ่มสร้างเลย',
        'hero.watchDemo': 'ดูตัวอย่าง',
        'hero.scroll': 'เลื่อนลง',

        // Social Proof
        'social.videosCreated': 'วิดีโอที่สร้างแล้ว',
        'social.activeCreators': 'ครีเอเตอร์ที่ใช้งาน',
        'social.rating': 'คะแนนจากผู้ใช้',
        'social.title': 'ได้รับความไว้วางใจจากครีเอเตอร์ทั่วโลก',

        // Testimonials
        'testimonial.1.name': 'คุณสมชาย',
        'testimonial.1.role': 'YouTuber ไทย',
        'testimonial.1.text': 'เครื่องมือนี้ช่วยประหยัดเวลาได้มากกว่า 20 ชั่วโมงต่อสัปดาห์ สคริปต์ AI เป็นธรรมชาติมาก!',
        'testimonial.2.name': 'คุณมานี',
        'testimonial.2.role': 'เจ้าของ Agency',
        'testimonial.2.text': 'เราเปลี่ยนจากทีมตัดต่อราคาแพงมาใช้ LazyAutoCreator ผลตอบแทนคุ้มค่ามาก',
        'testimonial.3.name': 'คุณวิทย์',
        'testimonial.3.role': 'TikToker',
        'testimonial.3.text': 'คลิปสั้นของผมไวรัลบ่อยขึ้นมาก AI เข้าใจว่าอะไรดังจริงๆ!',

        // Showcase
        'showcase.title': 'ดูสิ่งที่เป็นไปได้',
        'showcase.subtitle': 'สร้างโดย AI ทั้งหมด โดยไม่ต้องมีคนช่วย',
        'showcase.shorts': 'Shorts Engine',
        'showcase.shortsDesc': 'วิดีโอแนวตั้ง 9:16 • จังหวะดึงดูด',
        'showcase.cinema': 'Cinema Engine',
        'showcase.cinemaDesc': 'วิดีโอยาว 16:9 • คุณภาพสารคดี 4K',

        // Features
        'features.title': 'ฟีเจอร์หลัก',
        'features.subtitle': 'ชุดเครื่องมือ AI อัตโนมัติที่ทำงานร่วมกันเพื่อสร้างคอนเทนต์ระดับมืออาชีพ',
        'features.shorts.title': 'Shorts Engine',
        'features.shorts.desc': 'สร้างคลิปสั้นไวรัลสำหรับ TikTok & Reels',
        'features.cinema.title': 'Cinema Engine',
        'features.cinema.desc': 'สร้างสารคดีและวิดีโอยาวคุณภาพสูง',
        'features.podcast.title': 'Podcast Studio',
        'features.podcast.desc': 'สร้าง Podcast แบบ 2 พิธีกรที่เป็นธรรมชาติ',
        'features.script.title': 'Script Intelligence',
        'features.script.desc': 'เขียนสคริปต์อัจฉริยะด้วย Gemini 2.0',
        'features.visual.title': 'Visual Synthesis',
        'features.visual.desc': 'สร้างภาพคุณภาพสูงด้วย Imagen 3 & DALL-E 3',
        'features.analytics.title': 'Usage Analytics',
        'features.analytics.desc': 'ติดตามการใช้งานและค่าใช้จ่ายแบบเรียลไทม์',

        // Process
        'process.title': 'จากศูนย์สู่ฮีโร่',
        'process.step1.title': 'เลือกหัวข้อ',
        'process.step1.desc': 'ใส่ไอเดียของคุณ',
        'process.step2.title': 'AI สร้างให้',
        'process.step2.desc': 'สคริปต์และสื่อ',
        'process.step3.title': 'ปรับแต่ง',
        'process.step3.desc': 'ตรวจสอบและแก้ไข',
        'process.step4.title': 'ส่งออก',
        'process.step4.desc': 'เรนเดอร์คุณภาพ 4K',

        // Roadmap
        'roadmap.title': 'แผนพัฒนาระบบ',

        // Pricing
        'pricing.title': 'เลือกแพ็กเกจ',
        'pricing.earlyBird': 'Early Bird สุดคุ้ม',
        'pricing.enterprise': 'Enterprise Standard',
        'pricing.perYear': '/ ปี',
        'pricing.limited': 'จำนวนจำกัด',
        'pricing.limitReached': 'เต็มแล้ว',
        'pricing.secureAccess': 'สมัครเลย',
        'pricing.subscribePro': 'สมัคร Pro',
        'pricing.feature1': 'เข้าถึงระบบทั้งหมด',
        'pricing.feature2': 'เรนเดอร์ลำดับต้น',
        'pricing.feature3': 'สิทธิ์เชิงพาณิชย์',
        'pricing.feature4': 'ส่งออก 4K',
        'pricing.feature5': 'อัพเดทฟรีตลอด',
        'pricing.feature6': 'คิวลำดับสูง',
        'pricing.feature7': 'ส่งออก Cinema 4K',
        'pricing.feature8': 'Support ลำดับต้น',

        // Trust Badges
        'trust.moneyBack': 'รับประกันคืนเงิน 7 วัน',
        'trust.noQuestions': 'ไม่ถามคำถาม คืนเงินทันที',
        'trust.securePayment': 'ชำระเงินปลอดภัยผ่าน Stripe',

        // FAQ
        'faq.title': 'คำถามที่พบบ่อย',

        // Footer
        'footer.privacy': 'นโยบายความเป็นส่วนตัว',
        'footer.terms': 'ข้อกำหนดการใช้งาน',
        'footer.contact': 'ติดต่อเรา',
        'footer.tagline': 'ระบบสร้างคอนเทนต์อัตโนมัติ',
    }
};

export function useLanguage(): UseLanguageReturn {
    const [language, setLanguageState] = useState<Language>(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_language') as Language;
            if (saved && (saved === 'en' || saved === 'th')) {
                return saved;
            }
            // Auto-detect from browser
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('th')) {
                return 'th';
            }
        }
        return 'en';
    });

    useEffect(() => {
        localStorage.setItem('preferred_language', language);
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguageState(prev => prev === 'en' ? 'th' : 'en');
    }, []);

    const t = useCallback((key: string): string => {
        return translations[language][key] || key;
    }, [language]);

    return { language, setLanguage, toggleLanguage, t };
}

export default useLanguage;
