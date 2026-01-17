import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Calendar, Save, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import { authManagementService, UserProfile as IUserProfile } from '../services/authManagementService';
import { paymentService } from '../services/paymentService';

const UserProfile: React.FC = () => {
    const [profile, setProfile] = useState<IUserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit States
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const p = await authManagementService.getProfile();
            setProfile(p);
            if (p) setFullName(p.full_name || '');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Update Name
            if (fullName !== profile?.full_name) {
                await authManagementService.updateProfile({ full_name: fullName });
            }

            // Update Password
            if (newPassword) {
                if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
                if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
                await authManagementService.updatePassword(newPassword);
                setNewPassword('');
                setConfirmPassword('');
            }

            setMessage({ type: 'success', text: 'Profile Updated Successfully' });
            await loadProfile(); // Refresh
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#C5A059]" /></div>;
    if (!profile) return <div className="text-center text-neutral-500 mt-20">User Profile Not Found</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <User size={200} className="text-[#C5A059]" />
                </div>

                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#C5A059] to-[#8a6d3b] rounded-3xl flex items-center justify-center shadow-lg shadow-[#C5A059]/30">
                        <span className="text-3xl font-black text-black uppercase">{fullName.charAt(0) || profile.email.charAt(0)}</span>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">{fullName || 'Construct Operator'}</h2>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/20">
                                {profile.licenseTier} Tier
                            </span>
                            <span className="text-neutral-500 text-xs font-mono">{profile.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Personal Info Form */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <User size={20} className="text-[#C5A059]" /> Personal Identity
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Full Name</label>
                            <div className="relative group">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#C5A059] transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#C5A059] transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full bg-white/5 border border-transparent rounded-xl py-4 pl-12 pr-4 text-neutral-400 cursor-not-allowed"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-neutral-600 uppercase font-black">Locked</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* License Info */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Shield size={20} className="text-[#C5A059]" /> License Protocol
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Current Tier</div>
                            <div className="text-xl font-black text-white uppercase">{profile.licenseTier}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Status</div>
                            <div className="text-xl font-black text-emerald-400 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Calendar size={24} className="text-neutral-500" />
                            <div>
                                <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Expiration Date</div>
                                <div className="text-sm font-bold text-white">
                                    {profile.licenseExpiresAt ? new Date(profile.licenseExpiresAt).toLocaleDateString() : 'Lifetime Access (Never Expires)'}
                                </div>
                            </div>
                        </div>

                        {profile.licenseTier !== 'free' && (
                            <button
                                onClick={async () => {
                                    setIsPortalLoading(true);
                                    try {
                                        const url = await paymentService.createPortalSession();
                                        window.location.href = url;
                                    } catch (err: any) {
                                        alert(err.message);
                                    } finally {
                                        setIsPortalLoading(false);
                                    }
                                }}
                                disabled={isPortalLoading}
                                className="px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-lg text-[#C5A059] text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A059]/20 transition-all disabled:opacity-50"
                            >
                                {isPortalLoading ? <Loader2 size={12} className="animate-spin" /> : 'Manage Billing'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 space-y-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Lock size={20} className="text-[#C5A059]" /> Security & Access
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">New Password (Optional)</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#C5A059] transition-colors" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#C5A059] transition-all"
                                placeholder="Set new password"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Confirm Password</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#C5A059] transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#C5A059] transition-all"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                {message && (
                    <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : null} {message.text}
                    </div>
                )}
                {!message && <div></div>} {/* Spacer */}

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => authManagementService.signOut()}
                        className="px-6 py-4 rounded-xl text-neutral-500 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="bg-[#C5A059] text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#d4af37] transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                    </button>
                </div>
            </div>

        </div>
    );
};

export default UserProfile;
