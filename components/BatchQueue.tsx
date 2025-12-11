import React, { useState } from 'react';
import { ListPlus, Play, Pause, Trash2, CheckCircle, AlertCircle, Loader2, Plus, X } from 'lucide-react';
import { generateScript, generateImageForScene, generateVoiceover } from '../services/geminiService';
import { saveProject, getBatchQueue, saveBatchQueue, clearBatchQueue, BatchQueueItem } from '../services/storageService';
import { GeneratorMode } from '../types';
import { useToast } from './ToastContext';

interface BatchQueueProps {
    apiKey?: string;
}

const BatchQueue: React.FC<BatchQueueProps> = ({ apiKey }) => {
    const { addToast } = useToast();
    const [topics, setTopics] = useState<string>('');
    const [queue, setQueue] = useState<BatchQueueItem[]>(getBatchQueue());
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.FACTS);
    const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);

    const addTopicsToQueue = () => {
        if (!topics.trim()) {
            addToast('warning', 'กรุณาใส่หัวข้อก่อน');
            return;
        }

        const newTopics = topics.split('\n').filter(t => t.trim()).map(topic => ({
            id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            topic: topic.trim(),
            status: 'pending' as const,
        }));

        const updatedQueue = [...queue, ...newTopics];
        setQueue(updatedQueue);
        saveBatchQueue(updatedQueue);
        setTopics('');
        addToast('success', `เพิ่ม ${newTopics.length} หัวข้อในคิว`);
    };

    const removeFromQueue = (id: string) => {
        const updatedQueue = queue.filter(item => item.id !== id);
        setQueue(updatedQueue);
        saveBatchQueue(updatedQueue);
    };

    const clearQueue = () => {
        if (confirm('ลบทุกหัวข้อในคิว?')) {
            setQueue([]);
            clearBatchQueue();
            addToast('info', 'ล้างคิวเรียบร้อย');
        }
    };

    const processQueue = async () => {
        if (!apiKey) {
            addToast('error', 'กรุณาใส่ API Key ก่อน');
            return;
        }

        const pendingItems = queue.filter(item => item.status === 'pending');
        if (pendingItems.length === 0) {
            addToast('warning', 'ไม่มีหัวข้อที่รอดำเนินการ');
            return;
        }

        setIsProcessing(true);

        for (const item of pendingItems) {
            try {
                setCurrentProcessing(item.id);

                // Update status to processing
                const updatedQueue = queue.map(q =>
                    q.id === item.id ? { ...q, status: 'processing' as const } : q
                );
                setQueue(updatedQueue);
                saveBatchQueue(updatedQueue);

                // Generate script only (faster, saves quota)
                const script = await generateScript(item.topic, mode, apiKey);

                // Save project
                saveProject(
                    script.title || item.topic,
                    item.topic,
                    mode,
                    script
                );

                // Mark as completed
                const completedQueue = queue.map(q =>
                    q.id === item.id ? { ...q, status: 'completed' as const } : q
                );
                setQueue(completedQueue);
                saveBatchQueue(completedQueue);

                addToast('success', `เสร็จ: ${item.topic.slice(0, 30)}...`);

                // Delay between requests to avoid rate limit
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                const errorQueue = queue.map(q =>
                    q.id === item.id ? { ...q, status: 'error' as const, error: (error as Error).message } : q
                );
                setQueue(errorQueue);
                saveBatchQueue(errorQueue);
                addToast('error', `Error: ${(error as Error).message.slice(0, 50)}`);

                // Wait longer on error (might be rate limit)
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        setCurrentProcessing(null);
        setIsProcessing(false);
        addToast('info', 'ประมวลผลคิวเสร็จสิ้น');

        // Send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Batch Queue เสร็จสิ้น!', {
                body: `สร้างเสร็จ ${completedCount + pendingItems.length} วิดีโอ`,
                icon: '/favicon.ico'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-green-400" size={16} />;
            case 'error':
                return <AlertCircle className="text-red-400" size={16} />;
            case 'processing':
                return <Loader2 className="text-blue-400 animate-spin" size={16} />;
            default:
                return <div className="w-4 h-4 rounded-full bg-slate-600" />;
        }
    };

    const pendingCount = queue.filter(q => q.status === 'pending').length;
    const completedCount = queue.filter(q => q.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <ListPlus className="text-purple-400" /> Batch Queue
                </h2>
                <p className="text-slate-400 text-sm">
                    สร้างวิดีโอหลายตัวพร้อมกัน - ใส่หัวข้อทีละบรรทัด
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm text-slate-400">Mode:</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as GeneratorMode)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        {Object.values(GeneratorMode).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <textarea
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="ใส่หัวข้อวิดีโอ (1 หัวข้อต่อ 1 บรรทัด)&#10;&#10;ตัวอย่าง:&#10;อียิปต์โบราณสร้างพีระมิดได้อย่างไร&#10;5 ปริศนาที่วิทยาศาสตร์ยังไม่สามารถอธิบายได้&#10;คดีฆาตกรรมปริศนาที่ยังไม่คลี่คลาย"
                    className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500"
                />

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={addTopicsToQueue}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
                    >
                        <Plus size={18} /> เพิ่มในคิว
                    </button>

                    <button
                        onClick={processQueue}
                        disabled={isProcessing || pendingCount === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isProcessing || pendingCount === 0
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        {isProcessing ? 'กำลังประมวลผล...' : `เริ่มประมวลผล (${pendingCount})`}
                    </button>

                    {queue.length > 0 && (
                        <button
                            onClick={clearQueue}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        >
                            <Trash2 size={18} /> ล้างคิว
                        </button>
                    )}
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{queue.length}</p>
                    <p className="text-slate-400 text-sm">ทั้งหมด</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                    <p className="text-slate-400 text-sm">รอดำเนินการ</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{completedCount}</p>
                    <p className="text-slate-400 text-sm">เสร็จแล้ว</p>
                </div>
            </div>

            {/* Queue List */}
            {queue.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="font-bold text-white">รายการในคิว</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {queue.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 p-4 border-b border-slate-700/50 ${item.id === currentProcessing ? 'bg-blue-500/10' : ''
                                    }`}
                            >
                                <span className="text-slate-500 text-sm w-6">{idx + 1}</span>
                                {getStatusIcon(item.status)}
                                <span className={`flex-1 text-sm ${item.status === 'completed' ? 'text-slate-500 line-through' :
                                    item.status === 'error' ? 'text-red-400' :
                                        'text-white'
                                    }`}>
                                    {item.topic}
                                </span>
                                {item.status === 'pending' && (
                                    <button
                                        onClick={() => removeFromQueue(item.id)}
                                        className="text-slate-500 hover:text-red-400 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchQueue;
