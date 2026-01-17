import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Scene, SubtitleStyle } from '../types';
import {
  Play, Pause, Loader2, VolumeX, Volume2,
  Subtitles, Maximize2, Minimize2, X
} from 'lucide-react';

// --- Utility Helpers ---
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const hexToRgba = (hex: string, opacity: number) => {
  let r = 0, g = 0, b = 0;
  if (!hex) return `rgba(0,0,0,${opacity})`;
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
  if (!text) return [];
  const words = text.split("");
  const lines = [];
  let currentLine = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + word).width;
    if (width < maxWidth) currentLine += word;
    else { lines.push(currentLine); currentLine = word; }
  }
  lines.push(currentLine);
  return lines;
};

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
};

// --- Interfaces ---
interface RenderOptions {
  resolution?: '360p' | '720p' | '1080p' | '4k';
  bitrate?: number;
}

interface VideoPlayerProps {
  scenes: Scene[];
  isReady: boolean;
  bgmUrl?: string;
  bgmVolume?: number;
  voiceSpeed?: number;
  aspectRatio?: '9:16' | '16:9';
  subtitleStyle?: SubtitleStyle;
  previewText?: string;
  hideSubtitles?: boolean;
  onToggleSubtitles?: () => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (time: number) => void;
  isPro?: boolean;
  isActive?: boolean;
}

export interface VideoPlayerRef {
  renderVideo: (
    onProgress?: (percent: number, stage: string, currentFrame?: number, totalFrames?: number) => void,
    options?: RenderOptions
  ) => Promise<{ blob: Blob, extension: string }>;
  togglePlayback: () => void;
  seekTo: (time: number, forcePlay?: boolean) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  scenes,
  isReady,
  bgmUrl,
  bgmVolume = 0.2,
  voiceSpeed = 1.0,
  aspectRatio = '16:9',
  subtitleStyle = {
    fontSize: 84,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.75,
    verticalOffset: 30,
    fontFamily: 'Kanit',
    outlineColor: '#000000',
    outlineWidth: 4,
    shadowBlur: 5,
    shadowColor: 'rgba(0,0,0,0.8)',
    fontWeight: '900',
    animation: 'pop'
  },
  previewText = "AI MOTION ENGINE READY",
  hideSubtitles = false,
  onToggleSubtitles,
  onPlaybackChange,
  onTimeUpdate,
  isPro,
  isActive = true
}, ref) => {
  // Manual Garbage Collection / Stop Trigger
  useEffect(() => {
    if (!isActive) {
      if (isPlayingRef.current) stopAll();
      // Optional: Clear heavy image/video caches if memory pressure is high
      // setLoadedImages(new Map()); 
      // setLoadedVideos(new Map());
    }
  }, [isActive]);
  const [watermarkImg, setWatermarkImg] = useState<HTMLImageElement | null>(null);

  // Load Watermark
  useEffect(() => {
    const img = new Image();
    img.src = '/images/logo_new.png';
    img.crossOrigin = 'anonymous';
    img.onload = () => setWatermarkImg(img);
  }, []);

  const [isRendering, setIsRendering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for Engine
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const isRenderingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterStartTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const sceneTimestampsRef = useRef<{ start: number, end: number, id: number }[]>([]);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Asset Caches
  const [loadedImages, setLoadedImages] = useState<Map<number, HTMLImageElement>>(new Map());
  const [loadedVideos, setLoadedVideos] = useState<Map<number, HTMLVideoElement>>(new Map());
  const [audioBuffers, setAudioBuffers] = useState<Map<number, AudioBuffer>>(new Map());
  const [bgmBuffer, setBgmBuffer] = useState<AudioBuffer | null>(null);

  const activeScenes = useMemo(() => (scenes || []).filter(s => s.status === 'completed'), [scenes]);
  const isLandscape = aspectRatio === '16:9';
  const BASE_WIDTH = isLandscape ? 1920 : 1080;

  // FPS for smoothness
  const FPS = 60;

  // --- Asset Loading ---
  useEffect(() => {
    const dur = activeScenes.reduce((acc, s) => {
      const buffer = audioBuffers.get(s.id) || s.audioBuffer;
      if (buffer) return acc + (buffer.duration / voiceSpeed);
      return acc + (s.duration_est || 5);
    }, 0);
    setTotalDuration(dur);
  }, [activeScenes, audioBuffers, voiceSpeed]);

  useEffect(() => {
    if (!bgmUrl || typeof window === 'undefined') { setBgmBuffer(null); return; }
    fetch(bgmUrl).then(r => r.arrayBuffer()).then(ab => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      return ctx.decodeAudioData(ab);
    }).then(setBgmBuffer).catch(() => setBgmBuffer(null));
  }, [bgmUrl]);

  // Decode Audio Logic
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check which scenes need decoding
    const needed = activeScenes.filter(s => s.audioBase64 && !s.audioBuffer && !audioBuffers.has(s.id));
    if (needed.length === 0) return;

    const decode = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const newBuffers = new Map(audioBuffers);
      let changed = false;

      for (const scene of needed) {
        try {
          // Convert Base64 to ArrayBuffer
          if (!scene.audioBase64 || scene.audioBase64.length < 100) continue;

          const binaryString = window.atob(scene.audioBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const buffer = await ctx.decodeAudioData(bytes.buffer);
          newBuffers.set(scene.id, buffer);
          changed = true;
        } catch (e) {
          console.warn(`[VideoPlayer] Audio decode skipped for scene ${scene.id} (likely invalid format)`);
        }
      }

      if (changed) setAudioBuffers(newBuffers);
    };

    decode();
  }, [activeScenes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    activeScenes.forEach(scene => {
      if (scene.imageUrl && !loadedImages.has(scene.id)) {
        const img = new Image(); img.crossOrigin = "anonymous"; img.src = scene.imageUrl;
        img.onload = () => setLoadedImages(p => new Map(p).set(scene.id, img));
      }
      if (scene.videoUrl && !loadedVideos.has(scene.id)) {
        const vid = document.createElement('video'); vid.crossOrigin = "anonymous"; vid.src = scene.videoUrl;
        vid.muted = true; vid.loop = true; vid.preload = "auto";
        vid.onloadeddata = () => setLoadedVideos(p => new Map(p).set(scene.id, vid));
      }
    });
  }, [activeScenes]);

  // --- Keep Timestamps Synced ---
  useEffect(() => {
    let t = 0;
    const newTimestamps = activeScenes.map(s => {
      const buffer = audioBuffers.get(s.id) || s.audioBuffer;
      const duration = buffer ? (buffer.duration / voiceSpeed) : (s.duration_est || 5);
      const r = { start: t, end: t + duration, id: s.id };
      t += duration;
      return r;
    });
    sceneTimestampsRef.current = newTimestamps;
  }, [activeScenes, audioBuffers, voiceSpeed]);

  // --- 🔥 MAIN RENDER ENGINE 🔥 ---
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let elapsed = 0;

    if (isPlayingRef.current || isRenderingRef.current) {
      const now = audioContextRef.current ? audioContextRef.current.currentTime : 0;
      elapsed = now - masterStartTimeRef.current;
    } else {
      elapsed = pauseTimeRef.current;
    }

    if (Math.abs(elapsed - currentTime) > 0.05) {
      setCurrentTime(elapsed);
      onTimeUpdate?.(elapsed);
    }

    const timestamps = sceneTimestampsRef.current;
    let index = timestamps.findIndex(t => elapsed >= t.start && elapsed < t.end);

    if (analyserRef.current && (isPlayingRef.current || isRenderingRef.current)) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(avg / 255);
    }

    const lastSceneEnd = timestamps[timestamps.length - 1]?.end || 0;

    if (index === -1 && elapsed >= lastSceneEnd && lastSceneEnd > 0) {
      if (isPlayingRef.current && !isRenderingRef.current) stopAll();
      index = activeScenes.length - 1;
    } else if (index === -1) {
      index = 0;
    }

    if (index !== currentSceneIndex) setCurrentSceneIndex(index);

    const scene = activeScenes[index];
    const timestamp = timestamps[index];

    // Layer 1: Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const source = scene ? (loadedVideos.get(scene.id) || loadedImages.get(scene.id)) : null;

    if (source && timestamp) {
      if (source instanceof HTMLVideoElement) {
        const vidDur = source.duration || 10;
        const targetTime = ((elapsed - timestamp.start) * (voiceSpeed || 1)) % vidDur;

        if (isPlayingRef.current || isRenderingRef.current) {
          if (source.paused) source.play().catch(() => { });
          if (Math.abs(source.currentTime - targetTime) > 0.3) {
            source.currentTime = targetTime;
          }
        } else {
          source.pause();
          source.currentTime = targetTime;
        }
      }

      const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      const sceneDuration = timestamp.end - timestamp.start;
      const rawProgress = Math.max(0, Math.min(1, (elapsed - timestamp.start) / sceneDuration));
      const smoothProgress = easeInOutSine(rawProgress);

      const maxZoom = source instanceof HTMLVideoElement ? 1.05 : 1.25;
      const zoomLevel = 1.0 + (smoothProgress * (maxZoom - 1.0));
      const beatPulse = ((isPlayingRef.current || isRenderingRef.current) && audioLevel > 0.2) ? (audioLevel * 0.005) : 0;
      const totalScale = zoomLevel + beatPulse;

      const canvasAspect = canvas.width / canvas.height;
      const sourceAspect = sw / sh;

      let ratio;
      if (canvasAspect > sourceAspect) {
        ratio = (canvas.width / sw) * totalScale;
      } else {
        ratio = (canvas.height / sh) * totalScale;
      }

      const dw = sw * ratio;
      const dh = sh * ratio;

      // Ken Burns Pan Logic
      // Moves from center to a slight offset based on scene ID to vary movement direction
      const panDirection = index % 2 === 0 ? 1 : -1; // Toggle direction per scene
      const xOffset = (dw - canvas.width) * 0.2 * smoothProgress * panDirection;
      const yOffset = (dh - canvas.height) * 0.2 * smoothProgress * (index % 3 === 0 ? 1 : -1);

      ctx.save();
      ctx.filter = 'contrast(1.05) saturate(1.1) brightness(0.98)';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.translate(-xOffset, -yOffset); // Apply Pan
      ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      ctx.save();
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.45,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.95
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Layer 2.1: Cinematic Overlays (Film Grain & FX)
      if (isPlayingRef.current || isRenderingRef.current) {
        // Film Grain
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 30; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
          ctx.fillRect(x, y, 1.5, 1.5);
        }
        ctx.restore();

        // Scanlines (Very subtle)
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = '#000';
        for (let i = 0; i < canvas.height; i += 4) {
          ctx.fillRect(0, i, canvas.width, 1);
        }
        ctx.restore();
      }

      // Layer 3: Transitions
      const timeIntoScene = elapsed - (timestamp.start || 0);
      const transitionDuration = 0.35; // 350ms transition

      if (timeIntoScene < transitionDuration) {
        const transProgress = 1 - (timeIntoScene / transitionDuration);
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${transProgress * 0.4})`; // White Flash
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    // Layer 4: Subtitles
    if (!hideSubtitles) {
      const textToDraw = (isPlayingRef.current || isRenderingRef.current) && scene ? scene.voiceover : (isReady && activeScenes.length > 0 ? activeScenes[0].voiceover : previewText);

      if (textToDraw && textToDraw !== previewText && timestamp) {
        const scale = canvas.width / BASE_WIDTH;
        const fontSize = (subtitleStyle.fontSize || 84) * scale;
        const animationType = subtitleStyle.animation || 'pop';

        ctx.font = `${subtitleStyle.fontWeight || 900} ${fontSize}px "${subtitleStyle.fontFamily}", sans-serif`;
        ctx.textBaseline = 'middle';

        const sceneDur = (timestamp.end || 0) - (timestamp.start || 0) || 1;
        const elapsedScene = elapsed - (timestamp.start || 0);
        const progress = Math.max(0, Math.min(1, elapsedScene / sceneDur));
        const isAnimating = isPlayingRef.current || isRenderingRef.current;

        if (animationType === 'pop') {
          const tokens = textToDraw.split(/(\s+)/).filter(x => x);
          const maxWidth = canvas.width * 0.85;
          const lines: any[] = [];
          let currentLine: any[] = [];
          let currentLineWidth = 0;

          tokens.forEach((token, i) => {
            const w = ctx.measureText(token).width;
            if (currentLineWidth + w > maxWidth && currentLine.length > 0) {
              lines.push({ tokens: currentLine, width: currentLineWidth });
              currentLine = [];
              currentLineWidth = 0;
            }
            currentLine.push({ text: token, width: w, index: i });
            currentLineWidth += w;
          });
          if (currentLine.length > 0) lines.push({ tokens: currentLine, width: currentLineWidth });

          const animatableIndices = tokens.map((t, i) => ({ i, isSpace: !t.trim() })).filter(x => !x.isSpace).map(x => x.i);
          const totalAnimatable = animatableIndices.length;
          const currentWordCount = Math.floor(progress * (totalAnimatable + 1));
          const activeTokenIndex = animatableIndices[Math.min(currentWordCount - 1, totalAnimatable - 1)];
          const visibleLimitIndex = activeTokenIndex ?? -1;

          const lineHeight = fontSize * 1.3;
          const yBase = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));
          const totalHeight = lines.length * lineHeight;
          const startY = yBase - totalHeight / 2 + lineHeight / 2;

          lines.forEach((line, lineIdx) => {
            const y = startY + lineIdx * lineHeight;
            let x = (canvas.width - line.width) / 2;
            line.tokens.forEach((tokenObj: any) => {
              if (isAnimating && tokenObj.index > visibleLimitIndex) return;
              const isSpace = !tokenObj.text.trim();
              const isActive = tokenObj.index === activeTokenIndex && !isSpace;
              let s = 1; if (isActive && isAnimating) s = 1.25;

              ctx.save();
              ctx.translate(x + tokenObj.width / 2, y);
              ctx.scale(s, s);
              ctx.translate(-(x + tokenObj.width / 2), -y);

              if (!isSpace && subtitleStyle.backgroundOpacity > 0) {
                const pad = fontSize * 0.2;
                ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
                ctx.fillRect(x - pad, y - fontSize / 2 - pad / 2, tokenObj.width + pad * 2, fontSize + pad);
              }

              ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
              ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
              ctx.lineJoin = 'round';
              ctx.strokeText(tokenObj.text, x, y);
              ctx.fillStyle = isActive ? '#FFD700' : subtitleStyle.textColor;
              ctx.fillText(tokenObj.text, x, y);
              ctx.restore();
              x += tokenObj.width;
            });
          });
        }
        else if (animationType === 'sentence') {
          const sentences = textToDraw.split(/(?: > )|(?<=[.!?])\s+(?=[A-Zก-๙])/).map(s => s.trim()).filter(s => s);

          if (sentences.length > 0) {
            const totalSentences = sentences.length;
            const currentSentenceIndex = Math.min(totalSentences - 1, Math.floor(progress * totalSentences));
            const activeSentence = sentences[currentSentenceIndex];

            const sentenceDuration = 1 / totalSentences;
            const sentenceProgress = (progress - (currentSentenceIndex * sentenceDuration)) / sentenceDuration;

            let s = 1;
            if (isAnimating) {
              if (sentenceProgress < 0.2) s = 0.5 + (sentenceProgress / 0.2) * 0.7;
              else if (sentenceProgress < 0.4) s = 1.2 - ((sentenceProgress - 0.2) / 0.2) * 0.2;
            }

            const x = canvas.width / 2;
            const y = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s, s);
            ctx.translate(-x, -y);

            if (subtitleStyle.backgroundOpacity > 0) {
              const width = ctx.measureText(activeSentence).width;
              const pad = fontSize * 0.4;
              ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
              ctx.fillRect(x - width / 2 - pad, y - fontSize / 2 - pad / 2, width + pad * 2, fontSize + pad);
            }

            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.lineJoin = 'round';
            ctx.textAlign = 'center';

            ctx.shadowColor = subtitleStyle.shadowColor || 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = subtitleStyle.shadowBlur || 4;

            ctx.strokeText(activeSentence, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(activeSentence, x, y);
            ctx.restore();
          }
        }
        else if (animationType === 'line') {
          // 🆕 ONE LINE AT A TIME - Wraps text to max width and shows each line sequentially
          const lines = wrapText(ctx, textToDraw, canvas.width * 0.85);

          if (lines.length > 0) {
            const totalLines = lines.length;
            const currentLineIndex = Math.min(totalLines - 1, Math.floor(progress * totalLines));
            const activeLine = lines[currentLineIndex];

            const lineDuration = 1 / totalLines;
            const lineProgress = (progress - (currentLineIndex * lineDuration)) / lineDuration;

            // Pop animation for each new line
            let s = 1;
            if (isAnimating) {
              if (lineProgress < 0.15) s = 0.7 + (lineProgress / 0.15) * 0.5;
              else if (lineProgress < 0.3) s = 1.2 - ((lineProgress - 0.15) / 0.15) * 0.2;
            }

            const x = canvas.width / 2;
            const y = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s, s);
            ctx.translate(-x, -y);

            if (subtitleStyle.backgroundOpacity > 0) {
              const width = ctx.measureText(activeLine).width;
              const pad = fontSize * 0.4;
              ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
              ctx.fillRect(x - width / 2 - pad, y - fontSize / 2 - pad / 2, width + pad * 2, fontSize + pad);
            }

            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.lineJoin = 'round';
            ctx.textAlign = 'center';

            ctx.shadowColor = subtitleStyle.shadowColor || 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = subtitleStyle.shadowBlur || 4;

            ctx.strokeText(activeLine, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(activeLine, x, y);
            ctx.restore();
          }
        }
        else if (animationType === 'word') {
          // 🆕 ONE WORD AT A TIME - Shows exactly one word with pop animation
          const words = textToDraw.split(/\s+/).filter(w => w.trim());

          if (words.length > 0) {
            const totalWords = words.length;
            const currentWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
            const activeWord = words[currentWordIndex];

            const wordDuration = 1 / totalWords;
            const wordProgress = (progress - (currentWordIndex * wordDuration)) / wordDuration;

            // Pop animation for each new word
            let s = 1;
            if (isAnimating) {
              if (wordProgress < 0.2) s = 0.5 + (wordProgress / 0.2) * 0.7;
              else if (wordProgress < 0.4) s = 1.2 - ((wordProgress - 0.2) / 0.2) * 0.2;
            }

            const x = canvas.width / 2;
            // Adjust Y position slightly higher to give room for Thai lower vowels (สระล่าง)
            const y = canvas.height * (1 - (subtitleStyle.verticalOffset / 100)) - fontSize * 0.1;

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s, s);
            ctx.translate(-x, -y);

            if (subtitleStyle.backgroundOpacity > 0) {
              const width = ctx.measureText(activeWord).width;
              // Increase padding for Thai vowels (สระบน/ล่าง)
              const padX = fontSize * 0.5;
              const padY = fontSize * 0.6; // Extra vertical padding for Thai
              ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
              ctx.fillRect(x - width / 2 - padX, y - fontSize * 0.7 - padY / 2, width + padX * 2, fontSize * 1.4 + padY);
            }

            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.lineJoin = 'round';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic'; // Better for Thai vowels

            ctx.shadowColor = subtitleStyle.shadowColor || 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = subtitleStyle.shadowBlur || 4;

            ctx.strokeText(activeWord, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(activeWord, x, y);
            ctx.restore();
          }
        }
        else if (animationType === 'typewriter') {
          const charCount = textToDraw.length;
          const visibleCount = Math.floor(progress * charCount);
          const visibleText = textToDraw.substring(0, visibleCount);

          const lines = wrapText(ctx, visibleText, canvas.width * 0.85);
          const lineHeight = fontSize * 1.3;
          const yBase = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));
          const startY = yBase - (lines.length * lineHeight) / 2 + lineHeight / 2;

          lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            const x = (canvas.width - ctx.measureText(line).width) / 2;

            if (subtitleStyle.backgroundOpacity > 0) {
              const w = ctx.measureText(line).width;
              const pad = fontSize * 0.2;
              ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity);
              ctx.fillRect(x - pad, y - fontSize / 2 - pad / 2, w + pad * 2, fontSize + pad);
            }

            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.strokeText(line, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(line, x, y);
          });
        }
        else if (animationType === 'fade') {
          const alpha = isAnimating ? (progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1) : 1;
          ctx.globalAlpha = alpha;

          const lines = wrapText(ctx, textToDraw, canvas.width * 0.85);
          const lineHeight = fontSize * 1.3;
          const yBase = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));
          const startY = yBase - (lines.length * lineHeight) / 2 + lineHeight / 2;

          lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            const x = (canvas.width - ctx.measureText(line).width) / 2;

            if (subtitleStyle.backgroundOpacity > 0) {
              const w = ctx.measureText(line).width;
              const pad = fontSize * 0.2;
              ctx.fillStyle = hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity * alpha);
              ctx.fillRect(x - pad, y - fontSize / 2 - pad / 2, w + pad * 2, fontSize + pad);
            }

            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.strokeText(line, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(line, x, y);
          });
          ctx.globalAlpha = 1;
        }
        else {
          const lines = wrapText(ctx, textToDraw, canvas.width * 0.85);
          const lineHeight = fontSize * 1.3;
          const yBase = canvas.height * (1 - (subtitleStyle.verticalOffset / 100));
          const startY = yBase - (lines.length * lineHeight) / 2 + lineHeight / 2;
          lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            const x = (canvas.width - ctx.measureText(line).width) / 2;
            ctx.lineWidth = (subtitleStyle.outlineWidth || 4) * scale;
            ctx.strokeStyle = subtitleStyle.outlineColor || '#000';
            ctx.strokeText(line, x, y);
            ctx.fillStyle = subtitleStyle.textColor;
            ctx.fillText(line, x, y);
          });
        }
      }
    }

    if (!isPro && watermarkImg) {
      const padding = 40;
      const targetWidth = canvas.width * 0.15;
      const ratio = watermarkImg.height / watermarkImg.width;
      const targetHeight = targetWidth * ratio;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(watermarkImg, canvas.width - targetWidth - padding, padding, targetWidth, targetHeight);
      ctx.restore();
    }
  };


  // --- Playback Logic ---
  const stopAll = async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      pauseTimeRef.current = audioContextRef.current.currentTime - masterStartTimeRef.current;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    onPlaybackChange?.(false);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
    sourcesRef.current.clear();
    loadedVideos.forEach(v => { try { v.pause(); } catch (e) { } });
    setAudioLevel(0);
    const ctx = audioContextRef.current;
    if (ctx) {
      audioContextRef.current = null;
      if (ctx.state !== 'closed') {
        try { await ctx.close(); } catch (e) { }
      }
    }
  };

  // Volume Control
  const [masterVolume, setMasterVolume] = useState(1.0);
  const masterGainRef = useRef<GainNode | null>(null);

  // Update Master Gain when volume changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVolume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [masterVolume]);

  const startPlayback = async (ctx: AudioContext, dest: AudioNode | null, startTimeOffset: number = 0) => {
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    // Create Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(dest || ctx.destination);
    masterGainRef.current = masterGain;

    const output = masterGain; // Route everything to master gain
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    analyser.connect(output);

    const now = ctx.currentTime;
    masterStartTimeRef.current = now - startTimeOffset;

    let currentPos = 0;
    const timestamps: { start: number, end: number, id: number }[] = [];

    for (const scene of activeScenes) {
      let duration = 5;
      const buffer = audioBuffers.get(scene.id) || scene.audioBuffer;
      if (buffer) {
        duration = buffer.duration / voiceSpeed;
      } else if (scene.duration_est && scene.duration_est > 0) {
        duration = scene.duration_est;
      }

      const sceneStart = currentPos;
      const sceneEnd = currentPos + duration;
      timestamps.push({ start: sceneStart, end: sceneEnd, id: scene.id });

      if (sceneEnd > startTimeOffset) {
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = voiceSpeed;
          source.connect(analyser);
          let startAt = now + (sceneStart - startTimeOffset);
          let offset = 0;
          if (sceneStart < startTimeOffset) {
            offset = (startTimeOffset - sceneStart) * voiceSpeed;
            startAt = now;
          }
          source.start(startAt, offset);
          sourcesRef.current.add(source);
        }
      }
      currentPos += duration;
    }

    sceneTimestampsRef.current = timestamps;
    setTotalDuration(currentPos);

    if (bgmBuffer) {
      const bgmSource = ctx.createBufferSource();
      bgmSource.buffer = bgmBuffer;
      bgmSource.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = bgmVolume;
      bgmSource.connect(gain);
      gain.connect(output);
      const bgmOffset = (startTimeOffset % bgmBuffer.duration);
      bgmSource.start(now, bgmOffset);
      sourcesRef.current.add(bgmSource);
    }
    return currentPos;
  };

  const handlePlay = async () => {
    if (isPlayingRef.current) {
      await stopAll();
    } else {
      if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch (e) { }
        audioContextRef.current = null;
      }
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsPlaying(true);
      isPlayingRef.current = true;
      onPlaybackChange?.(true);
      const startFrom = pauseTimeRef.current >= totalDuration ? 0 : pauseTimeRef.current;
      await startPlayback(ctx, null, startFrom);
    }
  };

  // --- 🔥 EXPORT LOGIC ---
  useImperativeHandle(ref, () => ({
    renderVideo: async (onProgress, options) => {
      if (activeScenes.length === 0) throw new Error("Synthesis Required");
      if (!activeScenes.every(s => (s.imageUrl && loadedImages.has(s.id)) || (s.videoUrl && loadedVideos.has(s.id)))) {
        onProgress?.(0, "Finalizing Assets...");
        await new Promise(r => setTimeout(r, 2000));
      }

      setIsRendering(true);
      isRenderingRef.current = true;
      pauseTimeRef.current = 0;

      const canvas = canvasRef.current!;
      let targetW = 1920;
      let targetH = 1080;
      if (options?.resolution === '720p') { targetW = 1280; targetH = 720; }
      else if (options?.resolution === '1080p') { targetW = 1920; targetH = 1080; }
      else if (options?.resolution === '2k') { targetW = 2560; targetH = 1440; }
      else if (options?.resolution === '4k') { targetW = 3840; targetH = 2160; }

      const width = isLandscape ? targetW : targetH;
      const height = isLandscape ? targetH : targetW;

      const originalW = canvas.width;
      const originalH = canvas.height;
      canvas.width = width;
      canvas.height = height;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      const dest = audioCtx.createMediaStreamDestination();
      const mimeType = getSupportedMimeType();

      drawFrame();

      const canvasStream = canvas.captureStream(FPS);
      const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 15000000 // 15Mbps
      });

      return new Promise<{ blob: Blob, extension: string }>(async (resolve, reject) => {
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          canvas.width = originalW;
          canvas.height = originalH;
          isRenderingRef.current = false;
          setIsRendering(false);
          resolve({ blob, extension: mimeType.includes('mp4') ? 'mp4' : 'webm' });
        };
        recorder.start();
        const totalDur = await startPlayback(audioCtx, dest, 0);
        const interval = setInterval(() => {
          if (!isRenderingRef.current) { clearInterval(interval); return; }
          drawFrame();
          const now = audioCtx.currentTime;
          if (onProgress) {
            const pct = Math.min(99, Math.floor((now / totalDur) * 100));
            onProgress(pct, "Rendering Video...");
          }
          if (now >= totalDur) {
            clearInterval(interval);
            stopAll();
            recorder.stop();
          }
        }, 1000 / FPS);
      });
    },
    togglePlayback: handlePlay,
    seekTo: (time, forcePlay) => {
      pauseTimeRef.current = time;
      setCurrentTime(time);
      if (forcePlay) {
        handlePlay();
      } else {
        drawFrame();
      }
    }
  }));

  useEffect(() => {
    if (!isPlaying && !isRendering) {
      drawFrame();
    }
  }, [loadedImages, loadedVideos, activeScenes, subtitleStyle, isLandscape, currentTime]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (isPlayingRef.current || isRenderingRef.current) {
        drawFrame();
        animId = requestAnimationFrame(loop);
      }
    };
    if (isPlaying) loop();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isRendering]);


  const playerContent = (
    <div
      ref={containerRef}
      className={`
        flex flex-col bg-neutral-950 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 transition-all duration-300 group/main
        ${isExpanded
          ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] z-[9999] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-neutral-700'
          : 'w-full h-full relative'
        }
      `}
    >
      {isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover/main:opacity-100"
        >
          <X size={24} />
        </button>
      )}

      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden group/player select-none">
        <canvas
          ref={canvasRef}
          width={BASE_WIDTH}
          height={isLandscape ? 1080 : 1920}
          className="max-w-full max-h-full object-contain shadow-2xl z-10"
        />

        {!isPlaying && !isRendering && isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all cursor-pointer z-20" onClick={handlePlay}>
            <div className="p-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-2xl transform hover:scale-110 transition-all group-hover/player:bg-orange-600/90 group-hover/player:border-orange-500">
              <Play size={48} fill="white" className="ml-1 text-white" />
            </div>
          </div>
        )}

        {(!isReady || isRendering) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <span className="text-white font-medium tracking-wider animate-pulse">
              {isRendering ? 'RENDERING CINEMATIC CUT...' : 'AI ENGINE WARMING UP...'}
            </span>
          </div>
        )}
      </div>

      <div className="h-16 bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-800 flex items-center px-6 gap-4 z-20 select-none">
        <button
          onClick={handlePlay}
          disabled={!isReady || isRendering}
          className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors disabled:opacity-50"
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>

        <div className="flex items-center gap-2 group/vol relative">
          <button
            onClick={() => setMasterVolume(prev => prev === 0 ? 1 : 0)}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            {masterVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 ease-out flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-20 accent-orange-500 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-400 min-w-[80px]">
          <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(totalDuration)}
        </div>

        <div
          className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden relative group/timeline cursor-pointer hover:h-3 transition-all"
          onClick={(e) => {
            if (!totalDuration || !containerRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.min(1, Math.max(0, x / rect.width));
            const seekTime = percent * totalDuration;
            pauseTimeRef.current = seekTime;
            setCurrentTime(seekTime);
            drawFrame();
            if (isPlaying) {
              stopAll();
              setTimeout(async () => {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                setIsPlaying(true);
                isPlayingRef.current = true;
                await startPlayback(ctx, null, seekTime);
              }, 50);
            }
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-red-500 transition-all duration-100 ease-linear"
            style={{ width: `${Math.min(100, (currentTime / (totalDuration || 1)) * 100)}%` }}
          />
          <div className="absolute inset-0 bg-white/0 group-hover/timeline:bg-white/10 transition-colors" />
        </div>

        <div className="flex items-center gap-3 border-l border-neutral-800 pl-4">

          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors ml-2">
            {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  if (isExpanded) {
    return createPortal(
      <>
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9998] animate-in fade-in duration-300"
          onClick={() => setIsExpanded(false)}
        />
        {playerContent}
      </>,
      document.body
    );
  }

  return playerContent;
});

export default VideoPlayer;
