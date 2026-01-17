
import React, { useState } from 'react';
import { Youtube, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { getAccounts, uploadVideoToYoutube } from '../services/socialService';

interface YoutubeUploadModalProps {
    videoBlob: Blob;
    initialTitle: string;
    initialDescription: string;
    initialTags?: string[];
    onClose: () => void;
}

const YoutubeUploadModal: React.FC<YoutubeUploadModalProps> = ({ videoBlob, initialTitle, initialDescription, initialTags = [], onClose }) => {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [tags, setTags] = useState(initialTags.join(', '));
    const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>('private');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedAccount, setSelectedAccount] = useState<string>(''); // Account ID

    const accounts = getAccounts().filter(a => a.platform === 'youtube');

    React.useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) setSelectedAccount(accounts[0].id);
    }, []);

    const handleUpload = async () => {
        if (!selectedAccount) { alert("Please select a YouTube account."); return; }
        setUploading(true);
        try {
            await uploadVideoToYoutube(selectedAccount, videoBlob, {
                title,
                description: `${description}\n\nTags: ${tags}`,
                tags: tags.split(',').map(t => t.trim())
            });
            alert("Upload Successful!");
            onClose();
        } catch (e: any) {
            alert("Upload Failed: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-2xl rounded-[2rem] p-10 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition"><X size={24} /></button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg"><Youtube size={24} /></div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Broadcast to YouTube</h3>
                </div>

                <div className="space-y-6">
                    {/* Account Selector */}
                    {accounts.length > 0 ? (
                        <div>
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Channel</label>
                            <div className="flex gap-2">
                                {accounts.map(acc => (
                                    <button
                                        key={acc.id}
                                        onClick={() => setSelectedAccount(acc.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${selectedAccount === acc.id ? 'bg-red-600/20 border-red-600 text-white' : 'bg-black border-white/10 text-neutral-500'}`}
                                    >
                                        {acc.avatarUrl && <img src={acc.avatarUrl} className="w-5 h-5 rounded-full" />}
                                        <span className="text-xs font-bold">{acc.username}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-900/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold">
                            No YouTube accounts connected. Please connect in Social Hub.
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-red-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Description</label>
                        <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-red-500 transition-colors resize-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Tags (Comma separated)</label>
                        <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-red-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Visibility</label>
                        <div className="flex gap-4">
                            {(['private', 'unlisted', 'public'] as const).map(p => (
                                <button key={p} onClick={() => setPrivacy(p)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${privacy === p ? 'bg-white text-black border-white' : 'bg-black text-neutral-500 border-white/10 hover:border-white/30'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={handleUpload} disabled={uploading} className="w-full mt-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all">
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                    {uploading ? `Uploading ${progress}%` : 'Upload Stream'}
                </button>
            </div>
        </div>
    );
};

export default YoutubeUploadModal;
