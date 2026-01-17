import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { authManagementService } from '../services/authManagementService';
import { Check, Loader2, Star, Zap, Shield } from 'lucide-react';

interface PricingModalProps {
    onClose: () => void;
    currentTier: 'free' | 'pro' | 'enterprise';
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, currentTier }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [proCount, setProCount] = useState<number>(0);
    const [checkingLimit, setCheckingLimit] = useState(true);

    React.useEffect(() => {
        const checkLimit = async () => {
            try {
                const count = await authManagementService.getProUserCount();
                setProCount(count);
            } catch (e) {
                console.error(e);
            } finally {
                setCheckingLimit(false);
            }
        };
        checkLimit();
    }, []);

    const isEarlyBirdAvailable = proCount < 100;

    const handleUpgrade = async (priceId: string) => {
        try {
            setLoading(priceId);
            const url = await paymentService.createCheckoutSession(priceId);
            window.location.href = url;
        } catch (error: any) {
            alert(`Payment Error: ${error.message}`);
            setLoading(null);
        }
    };

    const PLANS = [
        {
            id: 'early_bird',
            priceId: 'price_1SqCAaChLIAUz0sEi5uzftfQ', // $19 Yearly (LIVE)
            name: 'EARLY BIRD',
            price: '$19',
            period: '/YR',
            description: isEarlyBirdAvailable ? 'Special one-time yearly offer!' : 'Offer Ended',
            badge: isEarlyBirdAvailable ? `ONLY ${100 - proCount} SLOTS LEFT` : 'SOLD OUT',
            features: [
                'Unlimited AI Script Generation',
                'Unlimited Image & Video Rendering',
                'All Visual Styles (Cinematic, Anime, JoJo, Baki...)',
                '4K Ultra HD Export Quality',
                'Premium AI Voice Models (Kore, Puck, Charon...)',
                'Multi-Language Support (Thai, English, Japanese...)',
                'Background Music Integration',
                'Advanced Subtitle Editor',
                'Shorts + Long Video + Podcast Engines',
                'Export to MP4 (No Watermark)',
                'Priority Email Support'
            ],
            active: currentTier === 'enterprise' && isEarlyBirdAvailable,
            buttonText: isEarlyBirdAvailable ? 'CLAIM EARLY BIRD' : 'SOLD OUT',
            highlight: isEarlyBirdAvailable,
            disabled: !isEarlyBirdAvailable
        },
        {
            id: 'standard_pro',
            priceId: 'price_1SqCD0ChLIAUz0sE8Ylb8t0T', // $99 Yearly - Standard Pro
            name: 'STANDARD PRO',
            price: '$99',
            period: '/YR',
            description: 'Professional cinema production',
            features: [
                'Everything in Early Bird +',
                'Commercial License for Monetization',
                'API Access & Custom Integration',
                'Priority GPU Rendering Queue',
                'Early Access to New AI Models',
                'YouTube & TikTok Auto-Optimization',
                'Team Collaboration (Coming Soon)',
                'Dedicated Account Manager',
                'Custom Visual Style Training',
                'Lifetime Access Guarantee'
            ],
            active: currentTier === 'pro' || (currentTier === 'enterprise' && !isEarlyBirdAvailable),
            buttonText: 'GO PRO',
            highlight: !isEarlyBirdAvailable
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="max-w-5xl w-full py-12 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-0 right-4 text-neutral-500 hover:text-white transition-colors z-50"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-[#C5A059] text-xs font-black tracking-[0.3em] uppercase mb-4 block">
                        PRICING
                    </span>
                    <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        CHOOSE YOUR PACKAGE
                    </h2>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col min-h-[500px]
                                ${plan.highlight
                                    ? 'border-[#C5A059] bg-[#0A0A0A] shadow-[0_0_50px_rgba(197,160,89,0.1)]'
                                    : 'border-white/10 bg-[#0A0A0A]'}`}
                        >
                            {/* Early Bird Badge */}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C5A059] text-black text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest whitespace-nowrap">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-sm font-black mb-6 tracking-widest uppercase ${plan.highlight ? 'text-[#C5A059]' : 'text-neutral-400'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-6xl font-black text-white tracking-tighter">{plan.price}</span>
                                    <span className={`text-xl font-bold ${plan.highlight ? 'text-[#C5A059]' : 'text-neutral-500'}`}>
                                        {plan.period}
                                    </span>
                                </div>
                                <p className="text-neutral-500 text-sm font-medium">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="flex-1 space-y-4 mb-10">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-4 text-white/90">
                                        <div className={`mt-1 p-0.5 rounded-full border ${plan.highlight ? 'border-[#C5A059]/50 bg-[#C5A059]/10' : 'border-neutral-700'}`}>
                                            <Check size={12} className={plan.highlight ? 'text-[#C5A059]' : 'text-neutral-500'} />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={plan.active || !!loading}
                                onClick={() => handleUpgrade(plan.priceId)}
                                className={`w-full py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 active:scale-95
                                    ${plan.active
                                        ? 'bg-white/5 text-neutral-600 cursor-default border border-white/5'
                                        : plan.highlight
                                            ? 'bg-[#C5A059] text-black hover:bg-[#d4af37] shadow-[0_10px_20px_rgba(197,160,89,0.2)]'
                                            : 'bg-black text-white border border-white/20 hover:bg-white hover:text-black'
                                    }`}
                            >
                                {loading === plan.priceId ? (
                                    <Loader2 className="animate-spin mx-auto" />
                                ) : (
                                    plan.active ? 'CURRENT PLAN' : plan.buttonText
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-neutral-600 text-xs mt-12 font-medium tracking-wide">
                    All prices are in USD. Secure payment via Stripe.
                </p>
            </div>
        </div>
    );
};

export default PricingModal;
