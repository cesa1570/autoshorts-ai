
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Scene, SubtitleStyle } from '../types';
import {
  Play, Pause, SkipBack, Loader2, VolumeX, Volume2,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Music, Trash2, Volume1
} from 'lucide-react';

interface VideoPlayerProps {
  scenes: Scene[];
  isReady: boolean;
  bgmUrl?: string;
  bgmVolume?: number;
  onBgmChange?: (url: string | undefined) => void;
  onVolumeChange?: (volume: number) => void;
  aspectRatio?: '9:16' | '16:9';
  subtitleStyle?: SubtitleStyle;
  previewText?: string;
  hideSubtitles?: boolean;
  watermarkUrl?: string; // Add prop
}

export interface VideoPlayerRef {
  renderVideo: (onProgress?: (percent: number, stage: string, currentFrame?: number, totalFrames?: number) => void) => Promise<{ blob: Blob, extension: string }>;
}

const hexToRgba = (hex: string, opacity: number) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
    const segments = segmenter.segment(text);
    for (const seg of segments) words.push(seg.segment);
  } else {
    words.push(...text.split(' '));
  }
  const lines = [];
  let currentLine = words[0] || "";
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) currentLine += (currentLine ? " " : "") + word;
    else { lines.push(currentLine); currentLine = word; }
  }
  lines.push(currentLine);
  return lines;
};

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  scenes,
  isReady,
  bgmUrl,
  bgmVolume = 0.2,
  onBgmChange,
  onVolumeChange,
  aspectRatio = '16:9',
  subtitleStyle = { fontSize: 84, textColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.75, verticalOffset: 30, fontFamily: 'Kanit' },
  previewText = "AI MOTION PREVIEW",
  hideSubtitles = false,
  watermarkUrl
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const currentSceneIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isRenderingRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const renderResolveRef = useRef<((result: { blob: Blob, extension: string }) => void) | null>(null);

  const [loadedImages, setLoadedImages] = useState<Map<number, HTMLImageElement>>(new Map());
  const [loadedVideos, setLoadedVideos] = useState<Map<number, HTMLVideoElement>>(new Map());
  const [bgmBuffer, setBgmBuffer] = useState<AudioBuffer | null>(null);
  const [watermarkImg, setWatermarkImg] = useState<HTMLImageElement | null>(null);

  const isLandscape = aspectRatio === '16:9';
  const activeScenes = scenes.filter(s => s.status === 'completed');

  const WIDTH_1080P = isLandscape ? 1920 : 1080;
  const HEIGHT_1080P = isLandscape ? 1080 : 1920;
  const FPS = 30;

  useEffect(() => {
    if (!bgmUrl) { setBgmBuffer(null); return; }
    const loadBgm = async () => {
      try {
        const response = await fetch(bgmUrl);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        setBgmBuffer(buffer);
      } catch (err) { console.error("Failed to load BGM", err); }
    };
    loadBgm();
  }, [bgmUrl]);

  useEffect(() => {
    if (bgmGainRef.current) {
      bgmGainRef.current.gain.setTargetAtTime(bgmVolume, (audioContextRef.current?.currentTime || 0), 0.1);
    };
  }, [scenes, bgmUrl]);

  // Load Watermark
  useEffect(() => {
    if (watermarkUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = watermarkUrl;
      img.onload = () => setWatermarkImg(img);
    } else {
      setWatermarkImg(null);
    }
  }, [watermarkUrl]);

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const index = currentSceneIndexRef.current;
    const scene = activeScenes[index];
    const img = loadedImages.get(scene?.id);
    const video = loadedVideos.get(scene?.id);

    const playing = isPlayingRef.current;
    const rendering = isRenderingRef.current;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const source = video && !video.paused ? video : img;
    if (source) {
      const ratio = Math.max(canvas.width / (source instanceof HTMLVideoElement ? source.videoWidth : source.width), canvas.height / (source instanceof HTMLVideoElement ? source.videoHeight : source.height));
      const sw = (source instanceof HTMLVideoElement ? source.videoWidth : source.width);
      const sh = (source instanceof HTMLVideoElement ? source.videoHeight : source.height);
      const dw = sw * ratio;
      const dh = sh * ratio;
      const dx = (canvas.width - dw) / 2;
      const dy = (canvas.height - dh) / 2;
      ctx.drawImage(source, 0, 0, sw, sh, dx, dy, dw, dh);
    }

    // Draw Watermark
    if (watermarkImg) {
      const wmWidth = canvas.width * 0.15; // 15% of width
      const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
      const wmX = canvas.width - wmWidth - 40; // 40px padding right
      const wmY = 40; // 40px padding top
      ctx.globalAlpha = 0.8;
      ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
      ctx.globalAlpha = 1.0;
    }

    // Draw Subtitles
    if (!hideSubtitles) {
      const textToDraw = (playing || rendering) ? (scene?.voiceover || "") : previewText;
      if (textToDraw) {
        const baseFontSize = subtitleStyle.fontSize || 84;
        const scale = canvas.width / WIDTH_1080P;
        const fontSize = rendering ? baseFontSize : baseFontSize * scale;
        ctx.font = `900 ${fontSize}px "${subtitleStyle.fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        const wrapWidth = canvas.width * 0.85;
        const lines = wrapText(ctx, textToDraw, wrapWidth);
        const lineHeight = fontSize * 1.3;
        const yBase = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));
        const startY = yBase - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
          const lineY = startY + (i * lineHeight);
          const tw = ctx.measureText(line).width;
          const pad = fontSize * 0.3;
          ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
          ctx.fillRect(canvas.width / 2 - tw / 2 - pad, lineY - fontSize / 2 - pad / 2, tw + pad * 2, fontSize + pad);
          ctx.fillStyle = subtitleStyle.textColor;
          ctx.fillText(line, canvas.width / 2, lineY + fontSize / 3);
        });
      }
    }
  };

  useImperativeHandle(ref, () => ({
    renderVideo: async (onProgress) => {
      if (activeScenes.length === 0) throw new Error("No scenes ready for export");

      onProgress?.(0, "Initializing Engine...");
      setIsRendering(true);
      isRenderingRef.current = true;

      const canvas = canvasRef.current!;
      canvas.width = WIDTH_1080P;
      canvas.height = HEIGHT_1080P;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioCtx.resume();
      const dest = audioCtx.createMediaStreamDestination();

      // Determine supported mime types
      const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

      const canvasStream = canvas.captureStream(FPS);
      const outputStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 8000000 }); // 8Mbps
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      const totalDuration = activeScenes.reduce((acc, s) => acc + (s.audioBuffer?.duration || s.duration_est || 3), 0);
      const totalFrames = Math.floor(totalDuration * FPS);
      let progressInterval: number;

      return new Promise((resolve, reject) => {
        recorder.ondataavailable = e => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          clearInterval(progressInterval);
          onProgress?.(99, "Finalizing...");
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          setIsRendering(false);
          isRenderingRef.current = false;
          onProgress?.(100, "Done!");
          resolve({ blob, extension });
        };

        recorder.onerror = (e) => {
          clearInterval(progressInterval);
          setIsRendering(false);
          isRenderingRef.current = false;
          reject(e);
        };

        recorder.start();
        const startTime = Date.now();

        progressInterval = window.setInterval(() => {
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const currentFrame = Math.min(totalFrames, Math.floor(elapsedSeconds * FPS));
          const percent = Math.min(98, Math.floor((currentFrame / totalFrames) * 100));
          onProgress?.(percent, `Encoding...`, currentFrame, totalFrames);
        }, 200);

        playAudioMix(audioCtx, dest);
      });
    }
  }));

  useEffect(() => {
    let anim: number;
    const loop = (timestamp: number) => {
      animate(timestamp);
      if (isPlaying || isRendering) anim = requestAnimationFrame(loop);
    };
    loop(0); // Initial call with 0 timestamp
    return () => cancelAnimationFrame(anim);
  }, [isPlaying, isRendering, currentSceneIndex, loadedImages, loadedVideos, bgmBuffer, watermarkImg]);

  useEffect(() => {
    activeScenes.forEach(scene => {
      if (scene.imageUrl && !loadedImages.has(scene.id)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = scene.imageUrl;
        img.onload = () => setLoadedImages(prev => new Map(prev).set(scene.id, img));
      }
      if (scene.videoUrl && !loadedVideos.has(scene.id)) {
        const vid = document.createElement('video');
        vid.crossOrigin = "anonymous";
        vid.src = scene.videoUrl;
        vid.muted = true;
        vid.loop = true;
        vid.onloadeddata = () => setLoadedVideos(prev => new Map(prev).set(scene.id, vid));
      }
    });
  }, [activeScenes]);

  const stopAllAudio = async () => {
    if (activeSourceRef.current) { try { activeSourceRef.current.stop(); } catch (e) { } }
    if (bgmSourceRef.current) { try { bgmSourceRef.current.stop(); } catch (e) { } }
    loadedVideos.forEach(v => v.pause());
  };

  const playSceneSequence = (index: number, ctx: AudioContext, output: AudioNode) => {
    if (index >= activeScenes.length) {
      if (!isRenderingRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        stopAllAudio();
      } else {
        // Delay slightly to ensure the last frame is captured
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }, 500);
      }
      return;
    }

    setCurrentSceneIndex(index);
    currentSceneIndexRef.current = index;
    const scene = activeScenes[index];
    const video = loadedVideos.get(scene.id);
    if (video) { video.currentTime = 0; video.play(); }

    if (scene.audioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = scene.audioBuffer;
      source.connect(output);
      source.onended = () => {
        if (video) video.pause();
        playSceneSequence(index + 1, ctx, output);
      };
      source.start();
      activeSourceRef.current = source;
    } else {
      setTimeout(() => {
        if (video) video.pause();
        playSceneSequence(index + 1, ctx, output);
      }, (scene.duration_est || 3) * 1000);
    }
  };

  const playAudioMix = (ctx: AudioContext, dest: AudioNode | null) => {
    const out = dest || ctx.destination;
    audioContextRef.current = ctx;

    if (bgmBuffer) {
      const s = ctx.createBufferSource();
      s.buffer = bgmBuffer; s.loop = true;
      const g = ctx.createGain(); g.gain.value = bgmVolume;
      s.connect(g); g.connect(out);
      s.start();
      bgmSourceRef.current = s;
      bgmGainRef.current = g;
    }
    playSceneSequence(0, ctx, out);
  };

  const handlePlay = async () => {
    if (isPlaying) { stopAllAudio(); setIsPlaying(false); isPlayingRef.current = false; }
    else {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      setIsPlaying(true); isPlayingRef.current = true;
      playAudioMix(ctx, null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className={`relative overflow-hidden shadow-2xl bg-black rounded-[2.5rem] border-8 border-slate-900 ${isLandscape ? 'aspect-video w-full max-w-[800px]' : 'w-[320px] h-[568px]'}`}>
        <canvas ref={canvasRef} width={WIDTH_1080P} height={HEIGHT_1080P} className="w-full h-full object-cover" />
        {!isRendering && isReady && activeScenes.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
            <button onClick={handlePlay} className="p-6 rounded-full bg-purple-600 text-white shadow-2xl transform hover:scale-110 active:scale-95 transition-all">
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest">
        <CheckCircle2 size={12} className="text-green-500" /> AI Motion Engine: {activeScenes.length} Assets Synchronized
      </div>
    </div>
  );
});

export default VideoPlayer;
