import React, { useState } from 'react';
import { Subtitles, Download, Loader2, Copy, CheckCircle, Languages, FileText } from 'lucide-react';
import { useToast } from './ToastContext';
import { ScriptData } from '../types';

interface SubtitleGeneratorProps {
    script?: ScriptData | null;
}

const SubtitleGenerator: React.FC<SubtitleGeneratorProps> = ({ script }) => {
    const { addToast } = useToast();
    const [subtitleFormat, setSubtitleFormat] = useState<'srt' | 'vtt' | 'txt'>('srt');
    const [generatedSubtitles, setGeneratedSubtitles] = useState('');
    const [language, setLanguage] = useState('th');

    const LANGUAGES = [
        { code: 'th', name: 'ไทย' },
        { code: 'en', name: 'English' },
        { code: 'zh', name: '中文' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
    ];

    const generateSubtitles = () => {
        if (!script || !script.scenes || script.scenes.length === 0) {
            addToast('warning', 'ไม่มี script ให้สร้าง subtitle');
            return;
        }

        let currentTime = 0;
        let subtitleContent = '';

        if (subtitleFormat === 'vtt') {
            subtitleContent = 'WEBVTT\n\n';
        }

        script.scenes.forEach((scene, index) => {
            const startTime = currentTime;
            const duration = scene.duration_est || 5; // Default 5 seconds
            const endTime = startTime + duration;

            if (subtitleFormat === 'srt') {
                subtitleContent += `${index + 1}\n`;
                subtitleContent += `${formatTimeSRT(startTime)} --> ${formatTimeSRT(endTime)}\n`;
                subtitleContent += `${scene.voiceover}\n\n`;
            } else if (subtitleFormat === 'vtt') {
                subtitleContent += `${formatTimeVTT(startTime)} --> ${formatTimeVTT(endTime)}\n`;
                subtitleContent += `${scene.voiceover}\n\n`;
            } else {
                subtitleContent += `[${formatTimeSimple(startTime)} - ${formatTimeSimple(endTime)}]\n`;
                subtitleContent += `${scene.voiceover}\n\n`;
            }

            currentTime = endTime;
        });

        setGeneratedSubtitles(subtitleContent);
        addToast('success', 'Subtitle สร้างเรียบร้อย!');
    };

    const formatTimeSRT = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
    };

    const formatTimeVTT = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
    };

    const formatTimeSimple = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${pad(s)}`;
    };

    const pad = (num: number, size: number = 2): string => {
        return num.toString().padStart(size, '0');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedSubtitles);
        addToast('success', 'Copied to clipboard!');
    };

    const downloadSubtitles = () => {
        const extension = subtitleFormat;
        const mimeType = subtitleFormat === 'srt' ? 'application/x-subrip' :
            subtitleFormat === 'vtt' ? 'text/vtt' : 'text/plain';

        const blob = new Blob([generatedSubtitles], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subtitles-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('success', `Downloaded as .${extension}`);
    };

    const totalDuration = script?.scenes?.reduce((sum, s) => sum + (s.duration_est || 5), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <Subtitles className="text-cyan-400" /> Auto Subtitles Generator
                </h2>
                <p className="text-slate-400 text-sm">
                    สร้าง subtitle จาก script อัตโนมัติ - รองรับ SRT, VTT, TXT
                </p>
            </div>

            {/* Script Info */}
            {script ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <FileText size={18} className="text-purple-400" />
                            Script Loaded
                        </h3>
                        <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle size={16} /> Ready
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-900 rounded-lg p-3">
                            <p className="text-2xl font-bold text-white">{script.scenes?.length || 0}</p>
                            <p className="text-xs text-slate-400">Scenes</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3">
                            <p className="text-2xl font-bold text-white">{totalDuration}s</p>
                            <p className="text-xs text-slate-400">Duration</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3">
                            <p className="text-2xl font-bold text-white">{script.scenes?.reduce((sum, s) => sum + (s.voiceover?.length || 0), 0) || 0}</p>
                            <p className="text-xs text-slate-400">Characters</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
                    <p className="text-yellow-400">⚠️ ยังไม่มี script - สร้างวิดีโอใน Video Generator ก่อน</p>
                </div>
            )}

            {/* Format Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm text-slate-400">Format:</label>
                    <div className="flex gap-2">
                        {(['srt', 'vtt', 'txt'] as const).map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setSubtitleFormat(fmt)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${subtitleFormat === fmt
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                .{fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm text-slate-400 flex items-center gap-1">
                        <Languages size={14} /> ภาษา:
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={generateSubtitles}
                    disabled={!script}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${!script
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                        }`}
                >
                    <Subtitles size={20} /> Generate Subtitles
                </button>
            </div>

            {/* Generated Subtitles */}
            {generatedSubtitles && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-white">Generated Subtitles</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
                            >
                                <Copy size={14} /> Copy
                            </button>
                            <button
                                onClick={downloadSubtitles}
                                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm transition"
                            >
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </div>
                    <pre className="p-4 text-sm text-slate-300 bg-slate-900 max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
                        {generatedSubtitles}
                    </pre>
                </div>
            )}

            {/* Tips */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <h4 className="font-bold text-cyan-400 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li>• <strong>SRT</strong> - ใช้ได้กับ YouTube, Premiere, Final Cut</li>
                    <li>• <strong>VTT</strong> - ใช้กับ HTML5 video, Web</li>
                    <li>• <strong>TXT</strong> - สำหรับอ่านหรือแก้ไขเอง</li>
                    <li>• YouTube รองรับ auto-translate subtitle ได้</li>
                </ul>
            </div>
        </div>
    );
};

export default SubtitleGenerator;
