import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, Calendar, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useToast } from './ToastContext';

interface RevenueEntry {
    id: string;
    date: string;
    source: 'adsense' | 'sponsor' | 'affiliate' | 'other';
    amount: number;
    note: string;
}

const REVENUE_SOURCES = [
    { id: 'adsense', name: 'YouTube AdSense', color: 'text-red-400' },
    { id: 'sponsor', name: 'Sponsorship', color: 'text-blue-400' },
    { id: 'affiliate', name: 'Affiliate', color: 'text-green-400' },
    { id: 'other', name: 'Other', color: 'text-yellow-400' },
];

const RevenueTracker: React.FC = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<RevenueEntry[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formSource, setFormSource] = useState<RevenueEntry['source']>('adsense');
    const [formAmount, setFormAmount] = useState('');
    const [formNote, setFormNote] = useState('');

    // Monthly goal
    const [monthlyGoal, setMonthlyGoal] = useState(10000);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('revenue_entries');
        if (saved) setEntries(JSON.parse(saved));

        const savedGoal = localStorage.getItem('revenue_goal');
        if (savedGoal) setMonthlyGoal(parseInt(savedGoal));
    }, []);

    // Save to localStorage
    const saveEntries = (newEntries: RevenueEntry[]) => {
        setEntries(newEntries);
        localStorage.setItem('revenue_entries', JSON.stringify(newEntries));
    };

    const addEntry = () => {
        if (!formAmount || isNaN(parseFloat(formAmount))) {
            addToast('warning', 'กรุณาใส่จำนวนเงิน');
            return;
        }

        const newEntry: RevenueEntry = {
            id: `rev_${Date.now()}`,
            date: formDate,
            source: formSource,
            amount: parseFloat(formAmount),
            note: formNote
        };

        if (editingId) {
            saveEntries(entries.map(e => e.id === editingId ? { ...newEntry, id: editingId } : e));
            setEditingId(null);
        } else {
            saveEntries([newEntry, ...entries]);
        }

        setShowAddModal(false);
        resetForm();
        addToast('success', editingId ? 'อัพเดตเรียบร้อย' : 'เพิ่มรายได้เรียบร้อย');
    };

    const deleteEntry = (id: string) => {
        if (confirm('ลบรายการนี้?')) {
            saveEntries(entries.filter(e => e.id !== id));
            addToast('info', 'ลบเรียบร้อย');
        }
    };

    const editEntry = (entry: RevenueEntry) => {
        setFormDate(entry.date);
        setFormSource(entry.source);
        setFormAmount(entry.amount.toString());
        setFormNote(entry.note);
        setEditingId(entry.id);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormSource('adsense');
        setFormAmount('');
        setFormNote('');
        setEditingId(null);
    };

    // Calculate stats
    const now = new Date();
    const thisMonth = entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const allTimeTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    const avgPerVideo = entries.length > 0 ? allTimeTotal / entries.length : 0;
    const goalProgress = Math.min((thisMonthTotal / monthlyGoal) * 100, 100);

    const bySource = REVENUE_SOURCES.map(src => ({
        ...src,
        total: entries.filter(e => e.source === src.id).reduce((sum, e) => sum + e.amount, 0)
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <DollarSign className="text-green-400" /> Revenue Tracker
                </h2>
                <p className="text-slate-400 text-sm">
                    ติดตามรายได้จากทุกช่องทาง - AdSense, Sponsor, Affiliate
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-xl p-4">
                    <p className="text-green-400 text-sm">เดือนนี้</p>
                    <p className="text-2xl font-bold text-white">฿{thisMonthTotal.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-sm">รวมทั้งหมด</p>
                    <p className="text-2xl font-bold text-white">฿{allTimeTotal.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-400 text-sm">เฉลี่ย/รายการ</p>
                    <p className="text-2xl font-bold text-white">฿{avgPerVideo.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-600/20 to-red-600/20 border border-pink-500/30 rounded-xl p-4">
                    <p className="text-pink-400 text-sm">รายการทั้งหมด</p>
                    <p className="text-2xl font-bold text-white">{entries.length}</p>
                </div>
            </div>

            {/* Monthly Goal */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Target className="text-purple-400" size={18} /> เป้าหมายเดือนนี้
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">เป้า:</span>
                        <input
                            type="number"
                            value={monthlyGoal}
                            onChange={(e) => {
                                setMonthlyGoal(parseInt(e.target.value) || 0);
                                localStorage.setItem('revenue_goal', e.target.value);
                            }}
                            className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                        />
                        <span className="text-sm text-slate-400">฿</span>
                    </div>
                </div>
                <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${goalProgress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-400">฿{thisMonthTotal.toLocaleString()}</span>
                    <span className={goalProgress >= 100 ? 'text-green-400 font-bold' : 'text-slate-400'}>
                        {goalProgress.toFixed(0)}%
                    </span>
                    <span className="text-slate-400">฿{monthlyGoal.toLocaleString()}</span>
                </div>
            </div>

            {/* Revenue by Source */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4">รายได้แยกตามแหล่ง</h3>
                <div className="space-y-3">
                    {bySource.map(src => (
                        <div key={src.id} className="flex items-center gap-3">
                            <span className={`w-24 text-sm ${src.color}`}>{src.name}</span>
                            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${src.id === 'adsense' ? 'bg-red-500' : src.id === 'sponsor' ? 'bg-blue-500' : src.id === 'affiliate' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}
                                    style={{ width: allTimeTotal > 0 ? `${(src.total / allTimeTotal) * 100}%` : '0%' }}
                                ></div>
                            </div>
                            <span className="text-white text-sm w-24 text-right">฿{src.total.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Button */}
            <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
                <Plus size={20} /> เพิ่มรายได้
            </button>

            {/* Entries List */}
            {entries.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="font-bold text-white">รายการทั้งหมด</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/50">
                        {entries.slice(0, 20).map(entry => (
                            <div key={entry.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/30">
                                <div className="text-sm text-slate-500 w-20">{entry.date}</div>
                                <span className={`text-xs px-2 py-0.5 rounded ${entry.source === 'adsense' ? 'bg-red-500/20 text-red-400' :
                                        entry.source === 'sponsor' ? 'bg-blue-500/20 text-blue-400' :
                                            entry.source === 'affiliate' ? 'bg-green-500/20 text-green-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {REVENUE_SOURCES.find(s => s.id === entry.source)?.name}
                                </span>
                                <div className="flex-1 text-sm text-slate-300 truncate">{entry.note || '-'}</div>
                                <div className="text-white font-medium">฿{entry.amount.toLocaleString()}</div>
                                <div className="flex gap-1">
                                    <button onClick={() => editEntry(entry)} className="p-1 text-slate-500 hover:text-white"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteEntry(entry.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-white">{editingId ? 'แก้ไขรายได้' : 'เพิ่มรายได้'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">วันที่</label>
                                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">แหล่งรายได้</label>
                                <select value={formSource} onChange={e => setFormSource(e.target.value as any)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                                    {REVENUE_SOURCES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">จำนวนเงิน (฿)</label>
                                <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                                    placeholder="เช่น: 1500" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">หมายเหตุ (optional)</label>
                                <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)}
                                    placeholder="เช่น: วิดีโอเรื่องปริศนา" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                            </div>
                            <button onClick={addEntry}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition">
                                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มรายได้'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueTracker;
