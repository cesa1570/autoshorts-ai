
import React, { useState } from 'react';
import { Youtube, Upload, X, CheckCircle2, Loader2, Globe, Lock, EyeOff } from 'lucide-react';
import { ScriptData } from '../types';

interface YouTubeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    script: ScriptData | null;
    videoBlob: Blob | null;
}

const YouTubeUploadModal: React.FC<YouTubeUploadModalProps> = ({ isOpen, onClose, script, videoBlob }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const [metadata, setMetadata] = useState({
        title: script?.seoTitle || script?.title || '',
        description: script?.description || '',
        tags: script?.hashtags?.join(', ') || '',
        visibility: 'public'
    });

    if (!isOpen) return null;

    const handleUpload = async () => {
        setIsUploading(true);
        // Simulate API Call
        await new Promise(r => setTimeout(r, 2500));
        setIsUploading(false);
        setIsDone(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Youtube className="text-red-500" /> Upload to YouTube
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {isDone ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white text-center">Upload Successful!</h3>
                            <p className="text-sm text-slate-400 text-center max-w-xs">
                                Your video has been queued for processing on YouTube. <br />(Simulated Mode: No actual upload happened)
                            </p>
                            <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-800 rounded-full text-white font-bold hover:bg-slate-700 transition-all">
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                                    <input
                                        value={metadata.title}
                                        onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={metadata.description}
                                        onChange={e => setMetadata({ ...metadata, description: e.target.value })}
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:ring-2 focus:ring-red-500/50 outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</label>
                                    <input
                                        value={metadata.tags}
                                        onChange={e => setMetadata({ ...metadata, tags: e.target.value })}
                                        placeholder="comma, separated, tags"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
                                    <div className="flex gap-2">
                                        {['public', 'unlisted', 'private'].map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => setMetadata({ ...metadata, visibility: v })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${metadata.visibility === v ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {v === 'public' && <Globe size={12} />}
                                                {v === 'unlisted' && <EyeOff size={12} />}
                                                {v === 'private' && <Lock size={12} />}
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-800/50">
                                <span className="text-xs text-slate-500 flex items-center gap-2">
                                    {videoBlob ? (
                                        <><span className="w-2 h-2 rounded-full bg-green-500"></span> Video Ready ({Math.round(videoBlob.size / 1024 / 1024)} MB)</>
                                    ) : (
                                        <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Waiting for Render...</>
                                    )}
                                </span>
                                <button
                                    onClick={handleUpload}
                                    disabled={!videoBlob || isUploading}
                                    className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-wide rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all flex items-center gap-2"
                                >
                                    {isUploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><Upload size={18} /> Upload to Channel</>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouTubeUploadModal;
