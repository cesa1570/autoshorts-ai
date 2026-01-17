import React, { useEffect, useState } from 'react';
import { Sparkles, X, ShieldCheck, Users, ArrowRight, Star } from 'lucide-react';
import { authManagementService } from '../services/authManagementService';

interface UpgradeRequiredModalProps {
    onClose: () => void;
    onUpgrade: () => void;
    title?: string;
    description?: string;
}

const UpgradeRequiredModal: React.FC<UpgradeRequiredModalProps> = ({
    onClose,
    onUpgrade,
    title = "Authorization Required",
    description = "This feature is restricted to high-tier operators. Upgrade your license to unlock the full potential of our Cinema Engine."
}) => {
    const [subscriberCount, setSubscriberCount] = useState(0);

    useEffect(() => {
        authManagementService.getSubscriberCount().then(setSubscriberCount);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
            {/* Backdrop with extreme blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />

            {/* Animated Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C5A059]/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

            <div className="relative w-full max-w-lg bg-black/40 border border-[#C5A059]/30 rounded-[3rem] p-10 sm:p-14 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Icon Stack */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#C5A059] blur-2xl opacity-40 animate-pulse" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12 transform hover:rotate-0 transition-transform duration-500">
                            <ShieldCheck size={48} className="text-black rotate-[-12deg] group-hover:rotate-0 transition-transform" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-black text-white shadow-lg">
                            <Star size={18} fill="currentColor" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                            {title}
                        </h2>
                        <p className="text-neutral-400 text-sm leading-relaxed font-medium">
                            {description}
                        </p>
                    </div>

                    {/* Social Proof Section */}
                    <div className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-3">
                        <div className="flex -space-x-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-neutral-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?u=${i + 14}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-2">
                            <Users size={12} />
                            Join {subscriberCount + 120}+ High-Tier Operators
                        </p>
                    </div>

                    <div className="w-full space-y-4">
                        <button
                            onClick={onUpgrade}
                            className="w-full group bg-[#C5A059] hover:bg-[#d4af37] text-black font-black py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(197,160,89,0.3)]"
                        >
                            <Sparkles size={20} />
                            UPGRADE TO CINEMA ENGINE
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
                            Cancel protocol and return to lobby
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeRequiredModal;
