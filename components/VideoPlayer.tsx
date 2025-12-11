import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene } from '../types';
import { Play, Pause, SkipBack, Loader2, Music, VolumeX, Volume2 } from 'lucide-react';
import { decodeAudioData } from '../utils/audioUtils';

interface VideoPlayerProps {
  scenes: Scene[];
  isReady: boolean;
  bgmUrl?: string;
  bgmVolume?: number; // 0.0 to 1.0
}

export interface VideoPlayerRef {
  renderVideo: () => Promise<Blob>;
}

// Helper to wrap text properly, supporting Thai word breaks if browser supports it
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = [];
  
  // Use Intl.Segmenter for proper Thai word breaking if available
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      const segments = segmenter.segment(text);
      for (const seg of segments) {
          words.push(seg.segment);
      }
  } else {
      // Fallback for older browsers (not ideal for Thai but functional)
      // Split by spaces, or if no spaces, character by character
      if (text.includes(' ')) {
        words.push(...text.split(' '));
      } else {
        words.push(...text.split('')); 
      }
  }

  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + word).width;
      if (width < maxWidth) {
          currentLine += word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
};

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ scenes, isReady, bgmUrl, bgmVolume = 0.2 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [bgmError, setBgmError] = useState(false);
  const [bgmLoading, setBgmLoading] = useState(false);
  
  // Use a ref for the scene index to ensure the render loop sees updates immediately
  const currentSceneIndexRef = useRef(0);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null); // For TTS
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);    // For BGM
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Rendering Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const renderResolveRef = useRef<((blob: Blob) => void) | null>(null);

  // State to hold loaded assets
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [bgmBuffer, setBgmBuffer] = useState<AudioBuffer | null>(null);

  // Helper function to draw the current frame to the canvas
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const index = currentSceneIndexRef.current;
    const img = loadedImages[index];
    const scene = scenes[index];

    // 1. Clear & Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Image
    if (img) {
        // Draw image (cover fit)
        const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        
        ctx.drawImage(
            img, 
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
        );
    } else {
        // Fallback text
        ctx.fillStyle = '#fff';
        ctx.font = '20px Kanit';
        ctx.textAlign = 'center';
        ctx.fillText(isReady ? 'Scene ' + (index + 1) : 'Loading...', canvas.width / 2, canvas.height / 2);
    }
    
    // 3. Draw Subtitles (Enhanced)
    if (scene) {
        const fontSize = 28; // Bigger font
        const lineHeight = fontSize * 1.3;
        ctx.font = `bold ${fontSize}px "Kanit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = scene.voiceover;
        // Wrap text to fit 90% of screen width
        const lines = wrapText(ctx, text, canvas.width * 0.9);
        
        // Positioning: Bottom third
        const totalHeight = lines.length * lineHeight;
        const startY = canvas.height - 180 - (totalHeight / 2); // Raised slightly
        
        // Draw text with outline (Stroke) for readability
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000'; // Black outline
        ctx.fillStyle = '#FFFFFF'; // White text (or yellow #FFD700)

        lines.forEach((line, i) => {
            const y = startY + (i * lineHeight);
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
        });
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
  };

  // Expose render method to parent
  useImperativeHandle(ref, () => ({
    renderVideo: async () => {
      if (scenes.length === 0 || !isReady) throw new Error("No scenes to render");
      
      // Stop playback first
      await stopAllAudio();

      setIsRendering(true);
      setCurrentSceneIndex(0);
      currentSceneIndexRef.current = 0;
      recordedChunksRef.current = [];

      drawFrame();

      // 1. Setup Audio Context & Destination
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new CtxClass();
      if (ctx.state === 'suspended') await ctx.resume();
      
      audioContextRef.current = ctx;
      const dest = ctx.createMediaStreamDestination(); // Record stream

      // 2. Setup Canvas Stream
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      const canvasStream = canvas.captureStream(30);

      // 3. Combine Tracks
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // 4. Recorder Setup
      const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      if (!selectedMime) throw new Error("No supported video MIME type found.");

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 4000000, // Higher bitrate for sharper text
        audioBitsPerSecond: 128000
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      const renderPromise = new Promise<Blob>((resolve) => {
        renderResolveRef.current = resolve;
      });

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
        if (renderResolveRef.current) renderResolveRef.current(blob);
        setIsRendering(false);
        setIsPlaying(false);
        stopAllAudio(); // Cleanup context
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      // 5. Play Logic (Route to Destination)
      playAudioMix(ctx, dest);

      return renderPromise;
    }
  }));

  // Initialize images
  useEffect(() => {
    if (!isReady || scenes.length === 0) return;
    const loadImages = async () => {
      const promises = scenes.map(scene => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; 
          img.src = scene.imageUrl || '';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image for scene ${scene.id}`));
        });
      });
      try {
        const imgs = await Promise.all(promises);
        setLoadedImages(imgs);
      } catch (err) {
        console.error("Error preloading images", err);
      }
    };
    loadImages();
  }, [scenes, isReady]);

  // Load BGM Buffer
  useEffect(() => {
    setBgmError(false);
    if (!bgmUrl) {
      setBgmBuffer(null);
      return;
    }
    const loadBgm = async () => {
      setBgmLoading(true);
      try {
        // Add cache busting and explicit no-cache to force fresh fetch
        const fetchUrl = bgmUrl.startsWith('data:') ? bgmUrl : `${bgmUrl}?t=${Date.now()}`;
        const response = await fetch(fetchUrl, { 
            mode: 'cors',
            cache: 'no-store' 
        });
        
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        
        const CtxClass = (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext);
        const tempCtx = new CtxClass(2, 44100 * 40, 44100); 
        const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        
        setBgmBuffer(decodedBuffer);
      } catch (error) {
        console.warn("Failed to load BGM:", error);
        setBgmError(true);
        setBgmBuffer(null);
      } finally {
        setBgmLoading(false);
      }
    };
    loadBgm();
  }, [bgmUrl]);

  // Preview Loop
  useEffect(() => {
    if (!isRendering) {
        currentSceneIndexRef.current = currentSceneIndex;
        drawFrame();
    }
  }, [currentSceneIndex, loadedImages, scenes, isRendering]);

  // Render Loop
  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
        if (isRendering) {
            drawFrame();
            animationFrameId = requestAnimationFrame(loop);
        }
    };
    if (isRendering) {
        loop();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRendering, loadedImages, scenes]);

  const stopAllAudio = async () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch(e) {}
      activeSourceRef.current = null;
    }
    if (bgmSourceRef.current) {
      try { bgmSourceRef.current.stop(); } catch(e) {}
      bgmSourceRef.current = null;
    }
    if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
    }
  };

  // Centralized Audio Logic
  const playAudioMix = (ctx: AudioContext, destination: AudioNode | null = null) => {
    // 1. Setup Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    
    // Connect Master to Output
    if (destination) {
        masterGain.connect(destination); // To Recorder
    } else {
        masterGain.connect(ctx.destination); // To Speakers
    }

    // 2. Play BGM
    if (bgmBuffer && bgmUrl) {
      const bgmSource = ctx.createBufferSource();
      bgmSource.buffer = bgmBuffer;
      bgmSource.loop = true;
      
      const bgmGain = ctx.createGain();
      bgmGain.gain.value = bgmVolume;

      bgmSource.connect(bgmGain);
      bgmGain.connect(masterGain);
      bgmSource.start(0);
      bgmSourceRef.current = bgmSource;
    }

    // 3. Play Scenes Sequence
    playSceneSequence(0, ctx, masterGain);
  };

  const playSceneSequence = (index: number, ctx: AudioContext, outputNode: AudioNode) => {
    if (index >= scenes.length) {
      // Finished
      // Add a small delay before stopping to ensure last audio frame is captured
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
           mediaRecorderRef.current.stop();
        } else {
           setIsPlaying(false);
           setCurrentSceneIndex(0);
           currentSceneIndexRef.current = 0;
           stopAllAudio();
        }
      }, 500);
      return;
    }

    setCurrentSceneIndex(index);
    currentSceneIndexRef.current = index; 

    const scene = scenes[index];
    const durationMs = scene.duration_est * 1000;

    if (scene.audioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = scene.audioBuffer;
      
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1.5; // Voice Boost
      
      source.connect(voiceGain);
      voiceGain.connect(outputNode);
      
      source.onended = () => {
        playSceneSequence(index + 1, ctx, outputNode);
      };
      
      source.start();
      activeSourceRef.current = source;
    } else {
      // Silent Scene Fallback
      setTimeout(() => {
        playSceneSequence(index + 1, ctx, outputNode);
      }, durationMs);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      await stopAllAudio();
    } else {
      // Create new fresh context
      const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new CtxClass();
      if (ctx.state === 'suspended') await ctx.resume();
      
      audioContextRef.current = ctx;
      setIsPlaying(true);
      
      // Play to speakers (destination = null)
      playAudioMix(ctx, null); 
    }
  };

  const handleReset = async () => {
      setIsPlaying(false);
      setCurrentSceneIndex(0);
      currentSceneIndexRef.current = 0;
      await stopAllAudio();
  }

  if (!isReady) {
    return (
      <div className="w-full aspect-[9/16] bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
            <p className="text-sm">Preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-lg overflow-hidden shadow-2xl border border-slate-700 bg-black">
        <canvas 
          ref={canvasRef} 
          width={360} 
          height={640} 
          className="w-[280px] h-[500px] object-cover"
        />
        
        {isRendering && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 text-center p-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-white font-bold">Rendering Video...</p>
             </div>
        )}

        {!isRendering && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center items-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
            <button 
                onClick={handleReset}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
                <SkipBack size={20} />
            </button>
            <button 
                onClick={handlePlay}
                className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition transform hover:scale-105"
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
        </div>
        )}
      </div>
      
      {/* Audio Status Indicator */}
      <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
         {bgmLoading ? (
            <span className="flex items-center gap-1 text-yellow-400"><Loader2 size={10} className="animate-spin" /> Loading Music...</span>
         ) : bgmError ? (
            <span className="flex items-center gap-1 text-red-400"><VolumeX size={10} /> Music Failed (Check Net)</span>
         ) : (
            <span className="flex items-center gap-1 text-green-400"><Volume2 size={10} /> Music Ready</span>
         )}
         <span className="w-1 h-1 rounded-full bg-slate-600"></span>
         <span>Scene {currentSceneIndex + 1}/{scenes.length}</span>
      </div>
    </div>
  );
});

export default VideoPlayer;