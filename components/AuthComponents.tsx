
import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, Key, AlertTriangle, ShieldCheck } from "lucide-react";

// --- MissingClerkKey Component ---
export const MissingClerkKey = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
                    <Key size={40} className="text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Setup Required</h1>
                    <p className="text-sm text-slate-400">
                        To enable SaaS Authentication, you need to configure your Clerk API Key.
                    </p>
                </div>

                <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-2">1. Create or edit .env file</p>
                    <code className="text-xs text-green-400 font-mono block break-all">
                        VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
                    </code>
                </div>

                <div className="flex gap-2 w-full">
                    <a href="https://dashboard.clerk.com/sign-up" target="_blank" className="flex-1 py-3 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        Get Key
                    </a>
                    <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                        Reload
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --- SignInPage Component ---
export const SignInPage = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

        <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-teal-400 mb-2">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                    AutoShorts<span className="text-teal-400">.AI</span>
                </h1>
                <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">Passive Income Generator</p>
            </div>

            <SignIn
                appearance={{
                    variables: {
                        colorPrimary: '#0d9488',
                        colorBackground: '#0f172a',
                        colorText: 'white',
                        colorInputBackground: '#1e293b',
                        colorInputText: 'white',
                        colorTextSecondary: '#94a3b8'
                    },
                    elements: {
                        card: 'shadow-2xl border border-slate-800/50 bg-slate-900/90 backdrop-blur-xl rounded-[2rem]',
                        headerTitle: 'text-2xl font-black text-white',
                        headerSubtitle: 'text-slate-500',
                        socialButtonsIconButton: 'bg-slate-800 hover:bg-slate-700 border-none',
                        formButtonPrimary: 'bg-teal-600 hover:bg-teal-500 text-white font-bold',
                        footerActionLink: 'text-teal-400 hover:text-teal-300'
                    }
                }}
            />
        </div>
    </div>
);

// --- AuthGuard Component ---
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin w-12 h-12 text-teal-500" />
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest animate-pulse">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return <SignInPage />;
    }

    return <>{children}</>;
};
