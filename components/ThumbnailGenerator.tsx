import React, { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Loader2, Sparkles, Type, Palette } from 'lucide-react';
import { generateImageForScene } from '../services/geminiService';
import { useToast } from './ToastContext';

interface ThumbnailGeneratorProps {
    apiKey?: string;
    topic?: string;
    title?: string;
}

const THUMBNAIL_STYLES = [
    { id: 'shocking', name: '😱 Shocking/Clickbait', prompt: 'Create a shocking, attention-grabbing YouTube thumbnail with dramatic lighting, surprised expression, bold text overlay space, vibrant colors, high contrast' },
    { id: 'mystery', name: '🔮 Mystery/Horror', prompt: 'Create a dark, mysterious YouTube thumbnail with eerie atmosphere, shadowy elements, suspenseful mood, creepy aesthetic' },
    { id: 'educational', name: '🧠 Educational/Facts', prompt: 'Create a clean, professional YouTube thumbnail with bright colors, informative style, clear focal point, modern design' },
    { id: 'news', name: '📰 Breaking News', prompt: 'Create urgent, news-style YouTube thumbnail with red accents, breaking news aesthetic, dramatic typography space, professional look' },
    { id: 'viral', name: '🔥 Viral/Trending', prompt: 'Create a viral-worthy YouTube thumbnail with eye-catching colors, trending aesthetic, maximum engagement style, bold and dynamic' },
];

const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ apiKey, topic, title }) => {
    const { addToast } = useToast();
    const [customPrompt, setCustomPrompt] = useState(topic || title || '');
    const [selectedStyle, setSelectedStyle] = useState(THUMBNAIL_STYLES[0]);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [overlayText, setOverlayText] = useState('');

    const generateThumbnail = async () => {
        if (!apiKey) {
            addToast('error', 'กรุณาใส่ API Key ก่อน');
            return;
        }

        if (!customPrompt.trim()) {
            addToast('warning', 'กรุณาใส่หัวข้อหรือคำอธิบาย');
            return;
        }

        setLoading(true);
        try {
            const fullPrompt = `${selectedStyle.prompt}. Topic: "${customPrompt}". 
        YouTube thumbnail format, 16:9 aspect ratio, high quality, 
        ${overlayText ? `Include space for text: "${overlayText}"` : 'with space for text overlay'}.
        Make it extremely eye-catching and click-worthy. No actual text in image.`;

            const imageUrl = await generateImageForScene(fullPrompt, apiKey, 'gemini-3-pro-image-preview');
            setThumbnails(prev => [imageUrl, ...prev].slice(0, 6)); // Keep last 6
            addToast('success', 'Thumbnail สร้างเรียบร้อย!');
        } catch (error) {
            addToast('error', `Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadThumbnail = (imageUrl: string, index: number) => {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `thumbnail-${Date.now()}-${index}.png`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <ImageIcon className="text-pink-400" /> AI Thumbnail Generator
                </h2>
                <p className="text-slate-400 text-sm">
                    สร้าง Thumbnail viral ด้วย AI - เพิ่ม CTR ให้วิดีโอของคุณ
                </p>
            </div>

            {/* Style Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3">เลือกสไตล์:</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {THUMBNAIL_STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedStyle.id === style.id
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700'
                                }`}
                        >
                            {style.name}
                        </button>
                    ))}
                </div>

                {/* Topic Input */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
                            <Sparkles size={14} /> หัวข้อ/คำอธิบาย
                        </label>
                        <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="เช่น: 5 ปริศนาลึกลับที่ยังไม่มีคำตอบ"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
                            <Type size={14} /> ข้อความบน Thumbnail (optional)
                        </label>
                        <input
                            type="text"
                            value={overlayText}
                            onChange={(e) => setOverlayText(e.target.value)}
                            placeholder="เช่น: ห้ามดูคนเดียว!"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                        />
                    </div>
                </div>

                <button
                    onClick={generateThumbnail}
                    disabled={loading}
                    className={`w-full py-3 mt-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${loading
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                        }`}
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" size={20} /> กำลังสร้าง...</>
                    ) : (
                        <><Palette size={20} /> Generate Thumbnail</>
                    )}
                </button>
            </div>

            {/* Generated Thumbnails */}
            {thumbnails.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Thumbnails ที่สร้างแล้ว ({thumbnails.length})</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {thumbnails.map((thumb, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={thumb}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full aspect-video object-cover rounded-lg border border-slate-700"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                                    <button
                                        onClick={() => downloadThumbnail(thumb, idx)}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setThumbnails(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
                <h4 className="font-bold text-pink-400 mb-2">💡 Tips เพิ่ม CTR:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li>• ใช้สีสดใส โดยเฉพาะ แดง เหลือง ส้ม</li>
                    <li>• ใส่หน้าคนที่มี expression ชัดๆ</li>
                    <li>• ข้อความใหญ่ อ่านง่าย ไม่เกิน 5 คำ</li>
                    <li>• สร้างความ curiosity ด้วยรูป "ไม่จบ"</li>
                </ul>
            </div>
        </div>
    );
};

export default ThumbnailGenerator;
