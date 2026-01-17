import React, { useState } from 'react';
import { Copy, Check, Smartphone, X } from 'lucide-react';

interface MobileHandoffModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl?: string;
    caption?: string;
    hashtags?: string[];
}

const MobileHandoffModal: React.FC<MobileHandoffModalProps> = ({ isOpen, onClose, videoUrl, caption, hashtags }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Construct full caption
    const fullCaption = `${caption || ''}\n\n${(hashtags || []).join(' ')}`;

    // QR Code API
    const qrData = videoUrl || fullCaption;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&color=C5A059&bgcolor=000000&data=${encodeURIComponent(qrData)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullCaption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition"><X size={24} /></button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 flex items-center justify-center mx-auto mb-4 text-[#C5A059]">
                        <Smartphone size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mobile Handoff</h3>
                    <p className="text-xs text-neutral-400 mt-2">Scan to transfer logic to phone</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {/* QR Code */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <img src={qrImage} alt="QR Code" className="w-48 h-48 opacity-90" />
                    </div>

                    {/* Caption Copy */}
                    <div className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 relative group">
                        <p className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Caption & Hashtags</p>
                        <div className="text-xs text-neutral-300 font-mono line-clamp-3 leading-relaxed mb-6">
                            {fullCaption || "No caption provided."}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] text-[10px] font-bold uppercase transition-colors"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>

                    <div className="text-[10px] text-neutral-600 text-center max-w-xs">
                        Scan with your phone to open the link or text. Use this to post on TikTok/Instagram manually.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileHandoffModal;
