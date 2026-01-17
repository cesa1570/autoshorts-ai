import React from 'react';
import { X, Shield, Scale, FileText, AlertCircle, Eye, Database, Handshake } from 'lucide-react';

interface LegalModalProps {
    type: 'terms' | 'privacy';
    onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
    const isTerms = type === 'terms';

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] overflow-hidden">
            <div className="max-w-4xl w-full h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] flex flex-col relative shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059]">
                            {isTerms ? <Scale size={24} /> : <Shield size={24} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
                            </h2>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                Version 3.0 • Premium Protection Protocol • Last Updated Jan 2026
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar text-neutral-400 space-y-8 text-sm leading-relaxed">
                    {isTerms ? (
                        <>
                            {/* Terms of Service Sections */}
                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <FileText size={18} className="text-[#C5A059]" /> 1. Binding Agreement
                                </h3>
                                <p>By accessing or using LazyAutoCreator ("Service"), you agree to be bound by these Terms. This is a legal contract between you and LazyAutoCreator. If you are using the Service on behalf of a company, you represent that you have the authority to bind that entity.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Bot size={18} className="text-[#C5A059]" /> 2. AI Output & Accuracy Disclaimer
                                </h3>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-neutral-300">
                                    <p className="font-bold text-[#C5A059] mb-2">CRITICAL NOTICE:</p>
                                    <p>The Service utilizes Generative Artificial Intelligence (AI). You acknowledge and agree that:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        <li>Outputs may be inaccurate, incomplete, biased, or factually incorrect.</li>
                                        <li>Outputs do not reflect the opinions of LazyAutoCreator.</li>
                                        <li>You are 100% responsible for reviewing, editing, and verifying all AI-generated content before publication or use.</li>
                                        <li>LazyAutoCreator is NOT responsible for any legal issues arising from your use of AI outputs (including copyright claims or defamation).</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Shield size={18} className="text-[#C5A059]" /> 3. Limitation of Liability
                                </h3>
                                <p className="font-bold text-white uppercase tracking-widest text-[10px]">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                                <p>LazyAutoCreator shall NOT be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, or goodwill. In no event shall our total liability exceed the amount you paid us in the twelve (12) months preceding the claim.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Handshake size={18} className="text-[#C5A059]" /> 4. Indemnification
                                </h3>
                                <p>You agree to defend, indemnify, and hold harmless LazyAutoCreator and its officers from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney fees) arising from your use of the Service or your violation of these Terms.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Scale size={18} className="text-[#C5A059]" /> 5. Prohibited Activities
                                </h3>
                                <p>You may not: (a) Use the Service for any illegal purpose; (b) Generate content that promotes hate speech, violence, or harm; (c) Reverse engineer the platform; (d) Use automated systems (bots) to scrape or stress the infrastructure without authorization.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <AlertCircle size={18} className="text-[#C5A059]" /> 6. Termination of Access
                                </h3>
                                <p>We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All lifetime or subscription access is subject to compliance with these rules.</p>
                            </section>
                        </>
                    ) : (
                        <>
                            {/* Privacy Policy Sections */}
                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Eye size={18} className="text-[#C5A059]" /> 1. Philosophy of Privacy
                                </h3>
                                <p>At LazyAutoCreator, we believe your data is yours. We operate on a "Privacy by Design" principle. We collect only what is strictly necessary to provide the Service and keep your production flowing.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Database size={18} className="text-[#C5A059]" /> 2. Data Collection & Usage
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="font-bold text-white mb-2 underline uppercase text-[10px] tracking-widest">What we collect</p>
                                        <ul className="list-disc pl-5 space-y-1 text-xs">
                                            <li>Email (Authentication)</li>
                                            <li>Full Name (Personalization)</li>
                                            <li>Billing History (Stripe)</li>
                                            <li>Project Metadata (Storage)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="font-bold text-white mb-2 underline uppercase text-[10px] tracking-widest">What we DON'T collect</p>
                                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#C5A059]">
                                            <li>Your Raw API Keys (Stored locally)</li>
                                            <li>Passwords (Encrypted by Supabase)</li>
                                            <li>Credit Card Numbers (Handled by Stripe)</li>
                                            <li>Browsing History outside our app</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Shield size={18} className="text-[#C5A059]" /> 3. AI Data Transmission
                                </h3>
                                <p>When you generate scripts or images, your prompts are sent to third-party AI providers (Google Gemini, OpenAI). These providers have their own privacy policies. We do NOT use your data to train our own models, nor do we sell your prompts to advertisers.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <AlertCircle size={18} className="text-[#C5A059]" /> 4. Security Disclaimer
                                </h3>
                                <p>We implement industry-standard security measures (SSL/TLS encryption, Secure Supabase Auth). However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                    <FileText size={18} className="text-[#C5A059]" /> 5. Your Data Rights
                                </h3>
                                <p>Under GDPR and CCPA, you have the right to: (a) Access your data; (b) Correct inaccuracies; (c) Request deletion of your account and all associated data; (d) Opt-out of marketing communications.</p>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] rounded-b-[2.5rem]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
                            LazyAutoCreator Protocol • Encryption active
                        </p>
                        <p className="text-[9px] text-neutral-700 italic">
                            Disclaimer: This is a legal template. Consult a professional lawyer for specific jurisdiction compliance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Bot = ({ size, className }: { size: number, className: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
);

export default LegalModal;
