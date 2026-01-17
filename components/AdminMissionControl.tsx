import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, DollarSign, Activity, Globe, MessageSquare, Search, Shield, Clock } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    license_tier: string;
    created_at: string;
}

interface FeedbackData {
    id: number;
    message: string;
    created_at: string;
    source: string;
}

const AdminMissionControl: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch Profiles (Users)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, license_tier, created_at')
            .order('created_at', { ascending: false });

        if (profiles) setUsers(profiles);

        // 2. Fetch Feedback
        const { data: feed, error: feedError } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (feed) setFeedbacks(feed);

        setLoading(false);
    };

    const totalRevenue = users.filter(u => u.license_tier === 'pro').length * 19 + users.filter(u => u.license_tier === 'enterprise').length * 99;

    return (
        <div className="flex-1 overflow-y-auto p-12 bg-[#050505] min-h-screen custom-scrollbar pb-32">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <span className="text-[#C5A059] text-xs font-black uppercase tracking-[0.3em]">Owner Access</span>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">Mission Control</h1>
                    <p className="text-neutral-500 mt-2 font-medium">Real-time surveillance of system metrics.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-sm border border-white/10 transition-all"
                >
                    Refresh Data
                </button>
            </header>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard
                    label="Est. MRR"
                    value={`$${totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="up"
                />
                <StatCard
                    label="Total Agents"
                    value={users.length.toLocaleString()}
                    subvalue={`${users.filter(u => u.license_tier !== 'free').length} Paid / ${users.length} Total`}
                    icon={Users}
                />
                <StatCard
                    label="Feedback In"
                    value={feedbacks.length.toString()}
                    icon={MessageSquare}
                />
                <StatCard
                    label="System Status"
                    value="OPERATIONAL"
                    icon={Activity}
                    color="text-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Recent Users Table --- */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Users size={16} className="text-[#C5A059]" /> User Database
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">{users.length} Records</span>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Email</th>
                                    <th className="p-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tier</th>
                                    <th className="p-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-xs font-medium text-white font-mono truncate max-w-[150px]">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider ${user.license_tier === 'enterprise' ? 'bg-[#C5A059] text-black' :
                                                    user.license_tier === 'pro' ? 'bg-white text-black' :
                                                        'bg-neutral-800 text-neutral-400'
                                                }`}>
                                                {user.license_tier}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[10px] text-neutral-500 font-mono text-right">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Feedback Feed --- */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#C5A059]" /> Intel Feed
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">{feedbacks.length} Messages</span>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                        {feedbacks.length === 0 ? (
                            <div className="h-full flex items-center justify-center flex-col text-neutral-600 gap-2">
                                <Clock size={24} />
                                <span className="text-xs uppercase tracking-widest">No Intelligence Data</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {feedbacks.map(item => (
                                    <div key={item.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] text-[#C5A059] font-black uppercase tracking-widest bg-[#C5A059]/10 px-2 py-0.5 rounded-sm">
                                                {item.source}
                                            </span>
                                            <span className="text-[10px] text-neutral-600 font-mono">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-300 leading-relaxed font-medium">"{item.message}"</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; subvalue?: string; icon: any; trend?: 'up' | 'down'; color?: string }> = ({ label, value, subvalue, icon: Icon, trend, color }) => (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${color ? 'bg-emerald-500/10 ' + color : 'bg-white/5 text-neutral-400 group-hover:bg-[#C5A059]/20 group-hover:text-[#C5A059]'}`}>
                <Icon size={20} />
            </div>
        </div>
        <h3 className={`text-3xl font-black mb-1 ${color ? color : 'text-white'}`}>{value}</h3>
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{label}</p>
        {subvalue && <p className="text-xs text-neutral-600 mt-4 font-mono">{subvalue}</p>}
    </div>
);

export default AdminMissionControl;
