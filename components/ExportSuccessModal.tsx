import React, { useEffect, useState } from 'react';
import { CheckCircle2, FolderOpen, Share2, X, PartyPopper, Sparkles } from 'lucide-react';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    filePath: string;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ isOpen, onClose, filePath }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const directory = filePath.substring(0, filePath.lastIndexOf('\\') + 1);
    const fileName = filePath.substring(filePath.lastIndexOf('\\') + 1);

    return (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] ring-1 ring-white/5 transition-all duration-500 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>

                {/* Glossy Header Background */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#C5A059]/20 to-transparent pointer-none" />

                {/* Animated Particles (Decorative) */}
                <div className="absolute top-10 left-10 text-[#C5A059]/20 animate-bounce duration-[3s]">
                    <Sparkles size={40} />
                </div>
                <div className="absolute top-20 right-20 text-[#C5A059]/10 animate-pulse">
                    <PartyPopper size={60} />
                </div>

                <div className="p-10 relative z-10 text-center flex flex-col items-center">

                    {/* Success Icon Wrapper */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-[#C5A059] blur-2xl opacity-20 animate-pulse" />
                        <div className="w-24 h-24 bg-gradient-to-tr from-[#C5A059] to-[#E5C079] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(197,160,89,0.3)] border-4 border-black">
                            <CheckCircle2 size={48} className="text-black" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Production Complete</h2>
                    <p className="text-[#C5A059] font-bold text-xs uppercase tracking-[0.3em] mb-8">Master Render Finalized Successfully</p>

                    {/* File Path Display */}
                    <div className="w-full bg-black/50 border border-white/5 rounded-[2rem] p-6 mb-8 text-left group hover:border-[#C5A059]/30 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Saved Destination</span>
                        <div className="flex items-start gap-3">
                            <FolderOpen size={16} className="text-neutral-500 mt-1 flex-shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate mb-1">{fileName}</p>
                                <p className="text-[10px] text-neutral-500 font-kanit truncate break-all opacity-60">{directory}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            Dismiss
                        </button>
                        <button
                            className="py-4 bg-[#C5A059] rounded-2xl text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#d4af37] transition-all shadow-[0_10px_30px_rgba(197,160,89,0.3)] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Share2 size={14} /> Open Folder
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:bg-red-500/20 hover:border-red-500/30"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default ExportSuccessModal;
