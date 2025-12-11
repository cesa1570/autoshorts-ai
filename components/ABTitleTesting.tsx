import React, { useState, useEffect } from 'react';
import { SplitSquareVertical, Trophy, Plus, Trash2, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from './ToastContext';

interface TitleVariant {
    id: string;
    title: string;
    clicks: number;
    views: number;
    ctr: number;
    isWinner: boolean;
}

interface ABTest {
    id: string;
    topic: string;
    variants: TitleVariant[];
    status: 'running' | 'completed';
    startDate: string;
    endDate?: string;
}

const ABTitleTesting: React.FC = () => {
    const { addToast } = useToast();
    const [tests, setTests] = useState<ABTest[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [newVariants, setNewVariants] = useState(['', '']);

    // Load saved tests
    useEffect(() => {
        const saved = localStorage.getItem('ab_tests');
        if (saved) setTests(JSON.parse(saved));
    }, []);

    const saveTests = (newTests: ABTest[]) => {
        setTests(newTests);
        localStorage.setItem('ab_tests', JSON.stringify(newTests));
    };

    const createTest = () => {
        const validVariants = newVariants.filter(v => v.trim());
        if (!newTopic || validVariants.length < 2) {
            addToast('warning', 'ต้องมีหัวข้อและ title อย่างน้อย 2 ตัวเลือก');
            return;
        }

        const test: ABTest = {
            id: `ab_${Date.now()}`,
            topic: newTopic,
            variants: validVariants.map((title, idx) => ({
                id: `var_${idx}`,
                title,
                clicks: 0,
                views: 0,
                ctr: 0,
                isWinner: false
            })),
            status: 'running',
            startDate: new Date().toISOString().split('T')[0]
        };

        saveTests([test, ...tests]);
        setNewTopic('');
        setNewVariants(['', '']);
        setShowCreate(false);
        addToast('success', 'สร้าง A/B Test เรียบร้อย!');
    };

    const simulateResults = (testId: string) => {
        // Simulate random results for demo
        const updatedTests = tests.map(test => {
            if (test.id !== testId) return test;

            const variants = test.variants.map(v => {
                const views = Math.floor(Math.random() * 10000) + 1000;
                const clicks = Math.floor(views * (Math.random() * 0.15 + 0.01));
                return { ...v, views, clicks, ctr: parseFloat(((clicks / views) * 100).toFixed(2)) };
            });

            // Determine winner
            const maxCTR = Math.max(...variants.map(v => v.ctr));
            const winner = variants.map(v => ({ ...v, isWinner: v.ctr === maxCTR }));

            return { ...test, variants: winner, status: 'completed' as const, endDate: new Date().toISOString().split('T')[0] };
        });

        saveTests(updatedTests);
        addToast('success', 'ผลทดสอบพร้อมแล้ว!');
    };

    const deleteTest = (id: string) => {
        if (confirm('ลบ A/B Test นี้?')) {
            saveTests(tests.filter(t => t.id !== id));
            addToast('info', 'ลบเรียบร้อย');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <SplitSquareVertical className="text-orange-400" /> A/B Title Testing
                </h2>
                <p className="text-slate-400 text-sm">
                    ทดสอบว่า title ไหนได้ CTR สูงกว่า - เพิ่ม views ด้วย data
                </p>
            </div>

            {/* Create New Test */}
            {!showCreate ? (
                <button
                    onClick={() => setShowCreate(true)}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
                >
                    <Plus size={20} /> สร้าง A/B Test ใหม่
                </button>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
                    <input
                        type="text"
                        placeholder="หัวข้อวิดีโอ"
                        value={newTopic}
                        onChange={e => setNewTopic(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />

                    <div className="space-y-2">
                        <p className="text-sm text-slate-400">Title Variants:</p>
                        {newVariants.map((v, idx) => (
                            <div key={idx} className="flex gap-2">
                                <span className="w-8 h-10 flex items-center justify-center bg-slate-700 rounded text-sm text-white">{String.fromCharCode(65 + idx)}</span>
                                <input
                                    type="text"
                                    placeholder={`Title ${String.fromCharCode(65 + idx)}`}
                                    value={v}
                                    onChange={e => {
                                        const updated = [...newVariants];
                                        updated[idx] = e.target.value;
                                        setNewVariants(updated);
                                    }}
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        ))}
                        {newVariants.length < 5 && (
                            <button
                                onClick={() => setNewVariants([...newVariants, ''])}
                                className="text-sm text-slate-400 hover:text-white transition"
                            >
                                + เพิ่ม variant
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={createTest} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium">
                            สร้าง Test
                        </button>
                        <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {/* Tests List */}
            {tests.length > 0 && (
                <div className="space-y-4">
                    {tests.map(test => (
                        <div key={test.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-white">{test.topic}</h3>
                                    <p className="text-xs text-slate-500">
                                        {test.startDate} {test.endDate && `→ ${test.endDate}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded ${test.status === 'running' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {test.status === 'running' ? 'กำลังทดสอบ' : 'เสร็จแล้ว'}
                                    </span>
                                    {test.status === 'running' && (
                                        <button
                                            onClick={() => simulateResults(test.id)}
                                            className="p-1 text-slate-400 hover:text-white"
                                            title="Simulate Results"
                                        >
                                            <BarChart3 size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteTest(test.id)} className="p-1 text-slate-400 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-2">
                                {test.variants.map((variant, idx) => (
                                    <div
                                        key={variant.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${variant.isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-900'
                                            }`}
                                    >
                                        <span className={`w-8 h-8 flex items-center justify-center rounded font-bold ${variant.isWinner ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {variant.isWinner ? <Trophy size={16} /> : String.fromCharCode(65 + idx)}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{variant.title}</p>
                                            {test.status === 'completed' && (
                                                <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                                    <span>Views: {variant.views.toLocaleString()}</span>
                                                    <span>Clicks: {variant.clicks.toLocaleString()}</span>
                                                    <span className="text-purple-400 font-medium">CTR: {variant.ctr}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <h4 className="font-bold text-orange-400 mb-2">💡 A/B Testing Tips:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li>• ทดสอบ 1 อย่างต่อครั้ง (Title, Thumbnail, หรือ Description)</li>
                    <li>• ให้เวลาทดสอบอย่างน้อย 48 ชั่วโมง</li>
                    <li>• ใช้ YouTube Analytics เพื่อดูผลจริง</li>
                </ul>
            </div>
        </div>
    );
};

export default ABTitleTesting;
