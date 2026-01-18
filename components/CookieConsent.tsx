import React, { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-[#C5A059]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Cookie size={24} className="text-[#C5A059]" />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-sm mb-1">เราใช้คุกกี้ 🍪</h3>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                            เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงประสบการณ์ของคุณ
                            ตาม <span className="text-[#C5A059]">พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span> คุณสามารถเลือกยอมรับหรือปฏิเสธได้
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleDecline}
                            className="flex-1 md:flex-none px-5 py-2.5 border border-white/10 text-neutral-400 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <X size={14} /> ปฏิเสธ
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 md:flex-none px-5 py-2.5 bg-[#C5A059] text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
                        >
                            <Check size={14} /> ยอมรับ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
