
import React, { useState, useEffect } from 'react';
import { Share2, Wand2, Copy, Image as ImageIcon, RefreshCw, Layers } from 'lucide-react';
import { generateSocialPost, generateImageForScene } from '../services/geminiService';
import { SocialPostData } from '../types';

interface SocialPostGeneratorProps {
  initialTopic?: string;
  initialLanguage?: 'Thai' | 'English';
}

const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({ initialTopic, initialLanguage = 'Thai' }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Facebook');
  const [language, setLanguage] = useState<'Thai' | 'English'>(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialPostData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
     if (initialTopic) setTopic(initialTopic);
     if (initialLanguage) setLanguage(initialLanguage);
  }, [initialTopic, initialLanguage]);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setPreviewImage(null);
    try {
      const data = await generateSocialPost(topic, platform, language);
      setResult(data);
      setImageLoading(true);
      try {
        const img = await generateImageForScene(data.image_prompt, 'gemini-3-pro-image-preview');
        setPreviewImage(img);
      } catch (e) { console.error(e); } finally { setImageLoading(false); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col gap-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight"><Share2 className="text-pink-400" /> Post Creator</h2>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black uppercase text-slate-400">{language}</div>
          </div>
          <div className="space-y-4">
            <textarea placeholder="Write about..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-kanit outline-none h-28 resize-none" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <div className="flex gap-2">
              {['Facebook', 'Instagram', 'Twitter/X'].map((p) => (
                <button key={p} onClick={() => setPlatform(p)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition ${platform === p ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-500'}`}>{p}</button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={!topic || loading} className={`w-full py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition shadow-xl ${loading ? 'bg-slate-700' : 'bg-gradient-to-r from-pink-600 to-orange-500 text-white'}`}>
              {loading ? <RefreshCw className="animate-spin" /> : <Wand2 />} Generate
            </button>
          </div>
        </div>
        {result && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
             <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-slate-500 uppercase">Caption</h3><button onClick={() => navigator.clipboard.writeText(result.caption)} className="text-pink-400 text-xs font-black uppercase flex items-center gap-1"><Copy size={12} /> Copy</button></div>
             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300 text-sm font-kanit leading-relaxed whitespace-pre-wrap">{result.caption}<div className="mt-4 text-blue-400">{result.hashtags.map(t => `#${t}`).join(' ')}</div></div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-6">
        {result && (
            <div className="flex-1 bg-black rounded-[2.5rem] border border-slate-800 overflow-hidden relative flex items-center justify-center min-h-[400px] shadow-2xl">
                {imageLoading ? (
                    <div className="text-center"><RefreshCw className="animate-spin w-10 h-10 text-pink-500 mx-auto mb-2" /><p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Designing Visual...</p></div>
                ) : previewImage ? (
                    <img src={previewImage} className="w-full h-full object-contain" alt="Preview" />
                ) : <ImageIcon size={48} className="text-slate-800" />}
            </div>
        )}
      </div>
    </div>
  );
};

export default SocialPostGenerator;
