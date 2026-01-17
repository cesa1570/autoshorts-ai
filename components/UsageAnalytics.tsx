import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Zap, Coins } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Model Display Names (Human Readable)
const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'gemini-3-flash-preview': 'Gemini 3 Flash',
    'gemini-2.5-flash-preview': 'Gemini 2.5 Flash',
    'gemini-2.5-flash-image': 'Gemini 2.5 Flash (Image)',
    'gemini-2.0-flash-preview': 'Gemini 2.0 Flash',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash Exp',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'veo-3.1-fast-generate-preview': 'Veo 3.1 Video (Fast)',
    'veo-2.0-generate-001': 'Veo 2.0 Video',
    'imagen-3.0-generate-001': 'Imagen 3.0 Image',
    'gpt-4o': 'GPT-4o (OpenAI)',
    'gpt-4o-mini': 'GPT-4o Mini (OpenAI)',
    'dall-e-3': 'DALL-E 3 (OpenAI)',
    'unknown': 'Unknown Model',
};

// Gemini API Pricing (USD per 1M tokens) - Source: Google AI Studio 2025
export const MODEL_PRICING: Record<string, { input: number, output: number }> = {
    'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
    'gemini-2.5-flash-preview': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash-image': { input: 0.10, output: 0.40 },
    'gemini-2.0-flash-preview': { input: 0.10, output: 0.40 },
    'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'default': { input: 0.10, output: 0.40 },
};

const getModelDisplayName = (modelId: string): string => {
    return MODEL_DISPLAY_NAMES[modelId] || modelId || 'Unknown Model';
};

const calculateCost = (modelId: string, tokens: number): number => {
    const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['default'];
    // Assume 50/50 split between input/output for simplicity
    const avgRate = (pricing.input + pricing.output) / 2;
    return (tokens / 1000000) * avgRate;
};

const UsageAnalytics: React.FC = () => {
    const { userTier, usageHistory } = useApp(); // Removed generic unused imports if any

    // Graphing Logic
    const [period, setPeriod] = useState<'24h' | '14d' | '28d'>('24h');
    const [graphData, setGraphData] = useState<{ label: string, value: number }[]>([]);
    const [maxGraphValue, setMaxGraphValue] = useState(0);
    const [modelStats, setModelStats] = useState<{ [key: string]: { requests: number, tokens: number, cost: number } }>({});

    // Currency Logic
    const [currency, setCurrency] = useState<'USD' | 'THB'>('THB');
    const THB_RATE = 34.5; // Approx rate

    useEffect(() => {
        if (!usageHistory) return;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        let filteredData: any[] = [];
        let labels: string[] = [];
        let dataPoints: number[] = [];
        let stats: any = {};

        if (period === '24h') {
            // Last 24 hours, grouped by hour
            const cutoff = now - oneDay;
            filteredData = usageHistory.filter(r => r.timestamp > cutoff);

            // Init buckets
            const map = new Map<number, number>(); // hour -> count
            for (let i = 0; i < 24; i++) map.set(i, 0);

            filteredData.forEach(r => {
                const hour = new Date(r.timestamp).getHours();
                map.set(hour, (map.get(hour) || 0) + 1); // Count Requests


                // Aggregate Stats
                if (!stats[r.model]) stats[r.model] = { requests: 0, tokens: 0, cost: 0 };
                stats[r.model].requests++;
                stats[r.model].tokens += r.tokens;
                // Use new calculateCost function for accurate pricing
                stats[r.model].cost += calculateCost(r.model, r.tokens);
            });

            // Convert to array
            const currentHour = new Date().getHours();
            for (let i = 23; i >= 0; i--) {
                const h = (currentHour - i + 24) % 24;
                dataPoints.push(map.get(h) || 0);
                labels.push(`${h}:00`);

            }

        } else {
            // 14 or 28 Days
            const days = period === '14d' ? 14 : 28;
            const cutoff = now - (days * oneDay); // approximate
            filteredData = usageHistory.filter(r => r.timestamp > cutoff);

            const map = new Map<string, number>(); // YYYY-MM-DD -> count

            // Pre-fill dates
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now - (i * oneDay));
                const dateStr = d.toISOString().split('T')[0];
                map.set(dateStr, 0);
                labels.push(dateStr.slice(5)); // MM-DD
            }

            filteredData.forEach(r => {
                // If r.date matches our map
                if (map.has(r.date)) {
                    map.set(r.date, (map.get(r.date) || 0) + 1);
                }

                if (!stats[r.model]) stats[r.model] = { requests: 0, tokens: 0, cost: 0 };
                stats[r.model].requests++;
                stats[r.model].tokens += r.tokens;

                // Use new calculateCost function for accurate pricing
                stats[r.model].cost += calculateCost(r.model, r.tokens);
            });

            dataPoints = Array.from(map.values());
        }

        // Final Cost Rounding handled in display

        setGraphData(labels.map((l, i) => ({ label: l, value: dataPoints[i] })));
        setMaxGraphValue(Math.max(...dataPoints, 5));
        setModelStats(stats);

    }, [usageHistory, period]);

    // Calculate totals safely
    const statsValues = Object.values(modelStats) as { requests: number, tokens: number, cost: number }[];
    const totalRequests = statsValues.reduce((acc, s) => acc + (s.requests || 0), 0);
    const totalTokens = statsValues.reduce((acc, s) => acc + (s.tokens || 0), 0);
    const totalCostUSD = statsValues.reduce((acc, s) => acc + (s.cost || 0), 0);
    const totalCostDisplay = currency === 'THB' ? totalCostUSD * THB_RATE : totalCostUSD;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-white/5 text-[#C5A059] shadow-lg">
                    <Activity size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Usage Analytics</h2>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Real-time System Monitoring</p>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 shadow-2xl space-y-10">

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[#C5A059]">
                            <BarChart3 size={20} />
                            <h3 className="text-lg font-black uppercase tracking-widest">Traffic Overview</h3>
                        </div>

                        {/* Period Toggle */}
                        <div className="flex bg-black border border-white/5 rounded-lg p-1">
                            {(['24h', '14d', '28d'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${period === p ? 'bg-[#C5A059] text-black' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem] space-y-8">

                        {/* Main Graph (Bar Chart) */}
                        <div className="h-64 flex items-end gap-1 border-b border-white/5 pb-2 px-2 relative">
                            {/* Empty State / No Data */}
                            {graphData.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs font-mono uppercase tracking-widest">
                                    No Data Available
                                </div>
                            )}

                            {graphData.map((d, i) => {
                                const height = maxGraphValue > 0 ? (d.value / maxGraphValue) * 100 : 0;
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                        <div className="relative w-full bg-[#1a1a1a] rounded-t-sm overflow-hidden" style={{ height: `${Math.max(height, 5)}%` }}>
                                            <div className={`absolute inset-0 opacity-60 ${height > 0 ? 'bg-[#C5A059]' : 'bg-neutral-800'}`}></div>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[9px] font-mono px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                            {d.label}: {d.value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-600 font-mono uppercase">
                            <span>{period === '24h' ? '24 Hours ago' : 'Past'}</span>
                            <span>{period === '24h' ? 'Now' : 'Today'}</span>
                        </div>

                        {/* Totals Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BarChart3 size={64} />
                                </div>
                                <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">Total Requests</h4>
                                <div className="text-3xl font-black text-white">{totalRequests}</div>
                            </div>
                            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={64} />
                                </div>
                                <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">Total Tokens</h4>
                                <div className="text-3xl font-black text-white">{(totalTokens / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Coins size={64} />
                                </div>
                                <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">Estimated Cost</h4>
                                <div className="text-3xl font-black text-emerald-400">
                                    {currency === 'THB' ? '฿' : '$'}
                                    {totalCostDisplay.toFixed(currency === 'THB' ? 2 : 5)}
                                </div>
                            </div>
                        </div>

                        {/* Model Breakdown Table */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Model Breakdown</h4>
                            <div className="border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#1a1a1a] text-[9px] font-black uppercase tracking-widest text-[#C5A059]">
                                        <tr>
                                            <th className="p-4 rounded-tl-xl text-left">Model Name</th>
                                            <th className="p-4 text-center">Requests</th>
                                            <th className="p-4 text-center">Tokens</th>
                                            <th className="p-4 rounded-tr-xl text-right">Est. Cost ({currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {Object.entries(modelStats).length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-neutral-600 text-xs text-left">No activity recorded for this period.</td></tr>
                                        ) : (
                                            Object.entries(modelStats).map(([model, stats]: [string, any]) => (
                                                <tr key={model} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 text-xs font-bold text-neutral-300 text-left">{getModelDisplayName(model)}</td>
                                                    <td className="p-4 text-center text-xs font-mono text-neutral-400">{stats.requests}</td>
                                                    <td className="p-4 text-center text-xs font-mono text-neutral-400">{(stats.tokens / 1000).toFixed(1)}k</td>
                                                    <td className="p-4 text-right text-xs font-mono text-emerald-400">
                                                        {currency === 'THB' ? '฿' : '$'}
                                                        {(stats.cost * (currency === 'THB' ? THB_RATE : 1)).toFixed(currency === 'THB' ? 2 : 5)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UsageAnalytics;
