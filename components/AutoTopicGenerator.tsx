import React, { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, Plus, Zap, RefreshCw } from 'lucide-react';
import { generateAutoTopics, predictViralScore, ViralPrediction } from '../services/geminiService';
import { useToast } from './ToastContext';

interface AutoTopicGeneratorProps {
    apiKey?: string;
    onSelectTopic?: (topic: string) => void;
}

const NICHES = [
    { id: 'horror', name: '👻 Horror/Mystery', value: 'Horror, Mystery, Creepy Stories' },
    { id: 'facts', name: '🧠 Facts/Knowledge', value: 'Interesting Facts, Did You Know' },
    { id: 'news', name: '📰 News/Current Events', value: 'Breaking News, Current Events Thailand' },
    { id: 'crime', name: '🔪 True Crime', value: 'True Crime, Murder Cases, Unsolved Mysteries' },
    { id: 'tech', name: '💻 Technology', value: 'AI, Technology, Gadgets' },
    { id: 'motivation', name: '💪 Motivation', value: 'Motivation, Success Stories, Life Lessons' },
    { id: 'comedy', name: '😂 Comedy/Entertainment', value: 'Funny Stories, Entertainment, Celebrity Gossip' },
    { id: 'finance', name: '💰 Finance/Money', value: 'Money Tips, Passive Income, Investment' },
];

const AutoTopicGenerator: React.FC<AutoTopicGeneratorProps> = ({ apiKey, onSelectTopic }) => {
    const { addToast } = useToast();
    const [selectedNiche, setSelectedNiche] = useState(NICHES[0].value);
    const [topics, setTopics] = useState<{ title: string; viralScore: number; category: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [viralPrediction, setViralPrediction] = useState<ViralPrediction | null>(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);

    const generateTopics = async () => {
        if (!apiKey) {
            addToast('error', 'กรุณาใส่ API Key ก่อน');
            return;
        }

        setLoading(true);
        try {
            const result = await generateAutoTopics(selectedNiche, 10, apiKey);
            setTopics(result.topics);
            addToast('success', `สร้าง ${result.topics.length} หัวข้อเรียบร้อย!`);
        } catch (error) {
            addToast('error', 'ไม่สามารถสร้างหัวข้อได้');
        } finally {
            setLoading(false);
        }
    };

    const checkViralScore = async (topic: string) => {
        if (!apiKey) return;

        setSelectedTopic(topic);
        setLoadingPrediction(true);
        try {
            const prediction = await predictViralScore(topic, apiKey);
            setViralPrediction(prediction);
        } catch (error) {
            addToast('error', 'ไม่สามารถวิเคราะห์ได้');
        } finally {
            setLoadingPrediction(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 bg-green-500/10';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/10';
        if (score >= 40) return 'text-orange-400 bg-orange-500/10';
        return 'text-red-400 bg-red-500/10';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <Sparkles className="text-yellow-400" /> Auto Topic Generator
                </h2>
                <p className="text-slate-400 text-sm">
                    AI แนะนำหัวข้อ viral พร้อม Viral Score - เลือก niche แล้วกด Generate!
                </p>
            </div>

            {/* Niche Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <label className="block text-sm font-medium text-slate-400 mb-3">เลือก Niche:</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {NICHES.map(niche => (
                        <button
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedNiche === niche.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700'
                                }`}
                        >
                            {niche.name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={generateTopics}
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${loading
                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                        }`}
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" size={20} /> กำลังหาหัวข้อ Viral...</>
                    ) : (
                        <><Zap size={20} /> Generate Viral Topics</>
                    )}
                </button>
            </div>

            {/* Topics List */}
            {topics.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-green-400" size={18} />
                            หัวข้อ Viral ({topics.length})
                        </h3>
                        <button
                            onClick={generateTopics}
                            className="text-slate-400 hover:text-white transition"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-700/50">
                        {topics.map((topic, idx) => (
                            <div
                                key={idx}
                                className={`p-4 hover:bg-slate-700/30 transition cursor-pointer ${selectedTopic === topic.title ? 'bg-purple-500/10' : ''
                                    }`}
                                onClick={() => checkViralScore(topic.title)}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(topic.viralScore)}`}>
                                        {topic.viralScore}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{topic.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{topic.category}</p>
                                    </div>
                                    {onSelectTopic && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectTopic(topic.title);
                                            }}
                                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Viral Prediction Detail */}
            {selectedTopic && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">📊 Viral Analysis: {selectedTopic.slice(0, 50)}...</h3>

                    {loadingPrediction ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-purple-400" size={32} />
                        </div>
                    ) : viralPrediction ? (
                        <div className="space-y-4">
                            {/* Score */}
                            <div className="flex items-center gap-4">
                                <div className={`text-4xl font-bold ${getScoreColor(viralPrediction.score)}`}>
                                    {viralPrediction.score}
                                </div>
                                <div className="flex-1">
                                    <div className="w-full bg-slate-700 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all ${viralPrediction.score >= 80 ? 'bg-green-500' :
                                                    viralPrediction.score >= 60 ? 'bg-yellow-500' :
                                                        viralPrediction.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${viralPrediction.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div>
                                <p className="text-sm text-slate-400 mb-1">เหตุผล:</p>
                                <p className="text-white text-sm">{viralPrediction.reasoning}</p>
                            </div>

                            {/* Best Time */}
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-400 text-sm">⏰ เวลาโพสต์ที่ดีที่สุด: {viralPrediction.bestTimeToPost}</p>
                            </div>

                            {/* Suggestions */}
                            <div>
                                <p className="text-sm text-slate-400 mb-2">💡 แนะนำให้ viral มากขึ้น:</p>
                                <ul className="space-y-1">
                                    {viralPrediction.suggestions.map((s, i) => (
                                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                            <span className="text-purple-400">•</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default AutoTopicGenerator;
