import React from 'react';
import { AlertTriangle, Zap, DollarSign, X, Check, Loader2, Image, Mic, Video, FileText } from 'lucide-react';

interface ConfirmGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectType: 'shorts' | 'long' | 'podcast';
    scenesCount: number;
    isLoading?: boolean;
}

// Estimated costs based on Gemini 2.0 Flash rates
const COST_ESTIMATES = {
    shorts: {
        scriptTokens: 2000,
        imageTokensPerScene: 1500,
        voiceTokensPerScene: 500,
        baseLabel: 'Shorts Video'
    },
    long: {
        scriptTokens: 5000,
        imageTokensPerScene: 1500,
        voiceTokensPerScene: 800,
        baseLabel: 'Long Video'
    },
    podcast: {
        scriptTokens: 8000,
        imageTokensPerScene: 1000,
        voiceTokensPerScene: 1200,
        baseLabel: 'Podcast'
    }
};

const RATE_PER_MILLION = 0.20; // Gemini 2.0 Flash rate

export const estimateProjectCost = (type: 'shorts' | 'long' | 'podcast', scenesCount: number) => {
    const config = COST_ESTIMATES[type];
    const totalTokens = config.scriptTokens + (scenesCount * (config.imageTokensPerScene + config.voiceTokensPerScene));
    const estimatedCost = (totalTokens / 1000000) * RATE_PER_MILLION;
    return {
        totalTokens,
        estimatedCost,
        breakdown: {
            script: config.scriptTokens,
            images: scenesCount * config.imageTokensPerScene,
            voice: scenesCount * config.voiceTokensPerScene
        }
    };
};

const ConfirmGenerationModal: React.FC<ConfirmGenerationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    projectType,
    scenesCount,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const estimate = estimateProjectCost(projectType, scenesCount);
    const config = COST_ESTIMATES[projectType];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-[#C5A059]" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight">ยืนยันการสร้าง</h3>
                            <p className="text-neutral-500 text-xs">{config.baseLabel} • {scenesCount} Scenes</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white transition-colors p-1"
                        disabled={isLoading}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign size={14} className="text-[#C5A059]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">ค่าใช้จ่ายโดยประมาณ</span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-neutral-400">
                                <FileText size={12} /> Script Generation
                            </span>
                            <span className="text-neutral-300 font-mono text-xs">{estimate.breakdown.script.toLocaleString()} tokens</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-neutral-400">
                                <Image size={12} /> Image Generation
                            </span>
                            <span className="text-neutral-300 font-mono text-xs">{estimate.breakdown.images.toLocaleString()} tokens</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-neutral-400">
                                <Mic size={12} /> Voice Synthesis
                            </span>
                            <span className="text-neutral-300 font-mono text-xs">{estimate.breakdown.voice.toLocaleString()} tokens</span>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                        <span className="text-white font-bold">รวมทั้งหมด</span>
                        <div className="text-right">
                            <div className="text-[#C5A059] font-black text-lg">
                                ~${estimate.estimatedCost.toFixed(4)}
                            </div>
                            <div className="text-neutral-500 text-[10px] font-mono">
                                {estimate.totalTokens.toLocaleString()} tokens
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Note */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                    <p className="text-blue-400 text-xs leading-relaxed">
                        <Zap size={12} className="inline mr-1" />
                        ราคาประมาณตามอัตรา Gemini 2.0 Flash (~$0.20/1M tokens) อาจแตกต่างตามการใช้งานจริง
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all font-bold text-sm disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#C5A059] hover:bg-[#d4af6a] text-black font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                กำลังสร้าง...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                ยืนยัน
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmGenerationModal;
