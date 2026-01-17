import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authManagementService, UserProfile } from '../services/authManagementService';
import { paymentService } from '../services/paymentService';
import { useApp } from '../contexts/AppContext';
import { Lock, Mail, Key, Loader2, Sparkles, UserPlus, LogIn, AlertTriangle } from 'lucide-react';
import LandingPage from './LandingPage';
import PricingModal from './PricingModal';

interface AuthGateProps {
    children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [isMockMode, setIsMockMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('dev_mock_mode') === 'true');
    const [showPricing, setShowPricing] = useState(false);
    const [proCount, setProCount] = useState(0);
    const [pendingPurchase, setPendingPurchase] = useState<string | null>(null);
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
    const { setUserId, setLicenseTier } = useApp();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile();
            else setLoading(false);
            fetchProCount();
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile();
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async () => {
        const p = await authManagementService.getProfile();
        setProfile(p);

        // Sync with App Context
        if (p) {
            setUserId(p.id);
            setLicenseTier(p.licenseTier);
        } else {
            setUserId(null);
            setLicenseTier('free');
        }

        setLoading(false);

        // If user just logged in and has a pending purchase, trigger it
        if (p && pendingPurchase) {
            handleUpgrade(pendingPurchase);
            setPendingPurchase(null);
        }
    };

    const fetchProCount = async () => {
        const count = await authManagementService.getSubscriberCount();
        setProCount(count);
    };

    const handleUpgrade = async (priceId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setPendingPurchase(priceId);
                setShowLoginForm(true);
                return;
            }

            const url = await paymentService.createCheckoutSession(priceId);
            window.location.href = url;
        } catch (err: any) {
            console.error('Checkout error:', err);
            alert('Payment Error: ' + err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setAuthLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setAuthLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setAuthLoading(true);

        try {
            console.log("Auth Attempt:", { email, isRegistering });
            // DEVELOPER BYPASS: Use 'admin@demo.com' or 'dev' to bypass real Supabase
            if (email.toLowerCase() === 'admin@demo.com' || email.toLowerCase() === 'dev') {
                console.log("Developer Bypass Triggered");
                setLoading(true); // Ensure loading screen stays while profile fetches to prevent License Gate race condition
                localStorage.setItem('dev_mock_mode', 'true');
                setIsMockMode(true);
                await fetchProfile();
                return;
            }

            if (isRegistering) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-t-2 border-[#C5A059] rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-b-2 border-blue-500 rounded-full animate-spin-reverse"></div>
                </div>
                <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] animate-pulse">Syncing Cryptographic Identity...</p>
            </div>
        );
    }

    if (!session && !isMockMode) {
        // Show Landing Page first, then login form when user clicks Login
        if (!showLoginForm) {
            return (
                <LandingPage
                    onLogin={() => setShowLoginForm(true)}
                    onPurchase={handleUpgrade}
                    proCount={proCount}
                />
            );
        }

        return (
            <div className="fixed inset-0 bg-[#050505] overflow-auto flex items-center justify-center p-6">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C5A059 0%, transparent 50%)', filter: 'blur(100px)' }} />

                <div className="w-full max-w-md bg-black/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative">
                    <div className="flex flex-col items-center gap-6 mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-3xl flex items-center justify-center shadow-lg transform rotate-12">
                            <Lock size={32} className="text-black -rotate-12" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">LazyAutoCreator</h1>
                            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Autonomous Content Engine</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={authLoading}
                            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.09H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.91l3.66-2.8z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.09l3.66 2.84c.87-2.6 3.3-4.55 6.16-4.55z"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                <span className="bg-[#0a0a0a] px-4 text-neutral-600 font-black">Or secure access</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                            <input
                                type="email"
                                placeholder="Secure ID (Email)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059]/50 transition-all font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {isRegistering && (
                            <div className="relative group">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059]/50 transition-all font-medium"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={isRegistering}
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="Access Key (Password)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059]/50 transition-all font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold ring-1 ring-red-500/20 animate-shake">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-[#C5A059] disabled:opacity-50"
                        >
                            {authLoading ? <Loader2 size={20} className="animate-spin" /> : (
                                isRegistering ? <><UserPlus size={20} /> Initialize Identity</> : <><LogIn size={20} /> Access Terminal</>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 flex flex-col items-center gap-4">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-neutral-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors border-b border-transparent hover:border-white/20 pb-1"
                        >
                            {isRegistering ? 'Already have an identity? Sign In' : 'New operator? Request Access'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isLicenseValid = authManagementService.isLicenseValid(profile);

    if (!isLicenseValid && profile) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-black/60 border border-red-500/20 p-12 rounded-[3.5rem] text-center space-y-8 backdrop-blur-2xl">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/30">
                        <AlertTriangle size={48} className="text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">License Protocol Terminated</h2>
                        <p className="text-neutral-500 text-sm font-medium">Your access tier has expired or is inactive. Renew authorization to continue production.</p>
                    </div>
                    <button
                        onClick={() => setShowPricing(true)}
                        className="w-full bg-[#C5A059] text-black font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:bg-[#d4af37] transition-colors"
                    >
                        <Sparkles size={24} /> Upgrade to Cinema Pro
                    </button>
                    <div className="flex items-center justify-center gap-6 pt-4">
                        <button onClick={() => setShowLegal('privacy')} className="text-neutral-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Privacy</button>
                        <button onClick={() => setShowLegal('terms')} className="text-neutral-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Terms</button>
                        <button onClick={() => authManagementService.signOut()} className="text-neutral-600 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
                            Disconnect
                        </button>
                    </div>
                </div>
                {showPricing && <PricingModal onClose={() => setShowPricing(false)} currentTier={profile?.licenseTier || 'free'} />}
                {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
            </div>
        );
    }

    return (
        <>
            {children}
            {showPricing && <PricingModal onClose={() => setShowPricing(false)} currentTier={profile?.licenseTier || 'free'} />}
        </>
    );
};

import LegalModal from './LegalModal';
export default AuthGate;
