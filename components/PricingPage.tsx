
import React, { useState } from 'react';
import { PRICING_PLANS, createCheckoutSession } from '../services/paymentService';
import { Check, Loader2, Sparkles, X, Crown, Zap } from 'lucide-react';

interface PricingPageProps {
    onClose: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        setLoadingPlan(planId);
        try {
            const result = await createCheckoutSession(planId);
            if (result.success) {
                if (result.url) {
                    // Provide feedback instead of actual redirect for now
                    alert(`Redirecting to Stripe Checkout for ${planId}... (Simulation)`);
                } else {
                    alert("Switched to Free plan.");
                }
                onClose();
            }
        } catch (err) {
            alert("Payment failed");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition z-10"><X size={32} /></button>

                <div className="text-center pt-12 pb-8 px-6">
                    <h2 className="text-4xl capitalize font-black text-white mb-2 tracking-tight">Upgrade your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Creative Power</span></h2>
                    <p className="text-slate-400">Unlock the full potential of AutoShorts AI with our pro plans.</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto h-full items-center">
                        {PRICING_PLANS.map((plan) => (
                            <div key={plan.id} className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all ${plan.id === 'pro' ? 'bg-slate-800 border-purple-500 shadow-2xl scale-105 z-10' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                                {plan.id === 'pro' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                        {plan.id === 'studio' && <Crown size={18} className="text-amber-400" />}
                                        {plan.id === 'pro' && <Zap size={18} className="text-purple-400" />}
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">฿{plan.price}</span>
                                        <span className="text-sm text-slate-500">/mo</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className={`mt-0.5 rounded-full p-0.5 ${plan.id === 'free' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                            <span className="text-sm text-slate-300 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={!!loadingPlan}
                                    className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${plan.id === 'pro'
                                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40'
                                            : plan.id === 'studio'
                                                ? 'bg-slate-100 hover:bg-white text-slate-900'
                                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                                        }`}
                                >
                                    {loadingPlan === plan.id ? <Loader2 className="animate-spin" size={16} /> : (plan.price === 0 ? 'Current Plan' : 'Upgrade Now')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
