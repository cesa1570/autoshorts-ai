import React, { useState, useEffect } from 'react';
import { Share2, Wand2, Copy, Image as ImageIcon, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { generateSocialPost, generateImageForScene } from '../services/geminiService';
import { SocialPostData } from '../types';

interface SocialPostGeneratorProps {
  apiKey?: string;
  initialTopic?: string;
}

const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({ apiKey, initialTopic }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Facebook');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialPostData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
     if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setPreviewImage(null);
    try {
      const data = await generateSocialPost(topic, platform, apiKey);
      setResult(data);
      
      // Auto generate preview image
      setImageLoading(true);
      try {
        const img = await generateImageForScene(data.image_prompt, apiKey, 'gemini-3-pro-image-preview');
        setPreviewImage(img);
      } catch (e) {
        console.error("Image gen failed", e);
      } finally {
        setImageLoading(false);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="flex flex-col gap-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Share2 className="text-pink-400" /> Social Post Creator
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Topic / Idea</label>
              <textarea 
                placeholder="What do you want to post about? (e.g., ร้านกาแฟเปิดใหม่ธีมสวน, เคล็ดลับลดน้ำหนัก...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 outline-none transition h-24 resize-none"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Platform</label>
              <div className="flex gap-2">
                {['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${platform === p ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic || loading}
              className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition mt-2
                ${loading ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white shadow-lg'}`}
            >
              {loading ? <><RefreshCw className="animate-spin" /> Generating...</> : <><Wand2 size={20} /> Create Post & Image</>}
            </button>
          </div>
        </div>

        {/* Result Text Section */}
        {result && (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase">Caption & Content</h3>
                <button 
                    onClick={() => copyToClipboard(result.caption + "\n\n" + result.hashtags.map(t => `#${t}`).join(' '))}
                    className="text-xs flex items-center gap-1 text-pink-400 hover:text-pink-300 transition"
                >
                    <Copy size={12} /> Copy Text
                </button>
             </div>
             
             <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {result.caption}
                <div className="mt-4 text-blue-400">
                    {result.hashtags.map(t => `#${t}`).join(' ')}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Output / Preview Section */}
      <div className="flex flex-col gap-6">
        {result && (
            <>
                {/* Image Prompt Box */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Layers size={16} className="text-blue-400" /> Image Prompt (English)
                        </h3>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded">For Midjourney / Gemini Pro</span>
                    </div>
                    
                    <div className="relative group">
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-400 text-xs font-mono leading-relaxed h-32 overflow-y-auto">
                            {result.image_prompt}
                        </div>
                        <button 
                            onClick={() => copyToClipboard(result.image_prompt)}
                            className="absolute top-2 right-2 p-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition opacity-0 group-hover:opacity-100"
                            title="Copy Prompt"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        * Copy this prompt to generate high-quality images in other AI tools.
                    </p>
                </div>

                {/* Image Preview */}
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative flex items-center justify-center min-h-[400px]">
                    {imageLoading ? (
                        <div className="text-center">
                            <RefreshCw className="animate-spin w-10 h-10 text-pink-500 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Generating Preview...</p>
                        </div>
                    ) : previewImage ? (
                        <>
                            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-xs text-white backdrop-blur-md">
                                Preview (Gemini Generated)
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-600 flex flex-col items-center">
                            <ImageIcon size={48} className="mb-2 opacity-50" />
                            <p>Image Preview</p>
                        </div>
                    )}
                </div>
            </>
        )}

        {!result && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <Share2 size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Ready to create viral posts</p>
                <p className="text-sm">Enter a topic on the left to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SocialPostGenerator;