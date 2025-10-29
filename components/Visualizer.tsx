import React, { useRef, useEffect, useState } from 'react';
import { TimedLyric, Resolution } from '../App';
import { LyricSettings, LogoSettings } from './Controls';

export type VisualizerType = 'bar' | 'bar-center' | 'circle' | 'wave' | 'wave-fill' | 'particles' | 'progress-wave';
export type BarStyle = 'sharp' | 'rounded';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  barCount: number;
  color: string;
  color2: string;
  useGradient: boolean;
  type: VisualizerType;
  smoothing: number;
  backgroundImage: string | null;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundBlur: number;
  barStyle: BarStyle;
  activeLyric: TimedLyric | null;
  lyricSettings: LyricSettings;
  resolution: Resolution;
  visualizerPosition: number; // 0-100
  logoImage: string | null;
  logoSettings: LogoSettings;
  showTimer: boolean;
  showProgressBar: string;
  progress: number;
  duration: number;
  waveformData: number[] | null;
}

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; size: number;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const date = new Date(0);
  date.setSeconds(seconds);
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const Visualizer = React.forwardRef<HTMLCanvasElement, VisualizerProps>(({ 
  analyserNode, isPlaying, barCount, color, color2, useGradient, type, smoothing,
  backgroundImage, backgroundColor, backgroundOpacity, backgroundBlur, barStyle,
  activeLyric, lyricSettings, resolution, visualizerPosition, logoImage, logoSettings,
  showTimer, showProgressBar, progress, duration, waveformData
}, ref) => {
  const animationFrameIdRef = useRef<number>(0);
  const prevDataRef = useRef<number[]>([]);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = backgroundImage;
      img.onload = () => setBgImage(img);
    } else setBgImage(null);
  }, [backgroundImage]);
  
  useEffect(() => {
    if (logoImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoImage;
      img.onload = () => setLogoImg(img);
    } else setLogoImg(null);
  }, [logoImage]);

  useEffect(() => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
    if (!analyserNode || !isPlaying || !canvas) {
      cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }
    
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      if (bgImage) {
        canvasCtx.save();
        canvasCtx.globalAlpha = backgroundOpacity;
        canvasCtx.filter = `blur(${backgroundBlur}px)`;
        canvasCtx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        canvasCtx.restore();
      }

      if (type !== 'progress-wave') {
        if (type === 'wave' || type === 'wave-fill' || type === 'particles') analyserNode.getByteTimeDomainData(dataArray);
        else analyserNode.getByteFrequencyData(dataArray);
      }
      
      if (prevDataRef.current.length !== barCount) prevDataRef.current = new Array(barCount).fill(0);

      let fillStyle: string | CanvasGradient = color;
      if (useGradient) {
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color2);
        fillStyle = gradient;
      }
      canvasCtx.fillStyle = fillStyle;
      canvasCtx.strokeStyle = fillStyle;
      
      canvasCtx.save();
      const verticalOffset = ((visualizerPosition - 50) / 50) * (canvas.height / 4);
      canvasCtx.translate(0, verticalOffset);

      switch (type) {
        case 'bar': drawBars(canvasCtx, dataArray, canvas.width, canvas.height); break;
        case 'bar-center': drawBarsFromCenter(canvasCtx, dataArray, canvas.width, canvas.height); break;
        case 'circle': drawCircle(canvasCtx, dataArray, canvas.width, canvas.height); break;
        case 'wave': drawWave(canvasCtx, dataArray, canvas.width, canvas.height, false); break;
        case 'wave-fill': drawWave(canvasCtx, dataArray, canvas.width, canvas.height, true); break;
        case 'particles': drawParticles(canvasCtx, dataArray, canvas.width, canvas.height); break;
        case 'progress-wave': if (waveformData) drawProgressWave(canvasCtx, waveformData, canvas.width, canvas.height, fillStyle); break;
      }
      canvasCtx.restore();

      if (activeLyric) drawLyrics(canvasCtx, canvas.width, canvas.height);
      if (logoImg) drawLogo(canvasCtx, canvas.width, canvas.height);
      if (showTimer) drawTimer(canvasCtx, canvas.width, canvas.height);
      if (showProgressBar !== 'none') drawProgressBar(canvasCtx, canvas.width, canvas.height, fillStyle);
    };
    
    const applySmoothing = (currentValue: number, index: number): number => {
        const prevValue = prevDataRef.current[index];
        const smoothedValue = prevValue + (currentValue - prevValue) * (1 - smoothing);
        prevDataRef.current[index] = smoothedValue;
        return smoothedValue;
    };

    const drawBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number) => {
        const barWidth = (w / barCount) * 0.8;
        const barSpacing = (w / barCount) * 0.2;
        const cornerRadius = barStyle === 'rounded' ? barWidth / 2 : 0;
        let x = 0;
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.max(cornerRadius * 2, applySmoothing((data[i] / 255) * (h * 0.8), i));
            ctx.beginPath();
            ctx.roundRect(x, h - barHeight, barWidth, barHeight, [cornerRadius, cornerRadius, 0, 0]);
            ctx.fill();
            x += barWidth + barSpacing;
        }
    };
    const drawBarsFromCenter = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number) => {
        const barWidth = (w / barCount) * 0.8;
        const barSpacing = (w / barCount) * 0.2;
        const cornerRadius = barStyle === 'rounded' ? barWidth / 2 : 0;
        let x = 0;
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.max(cornerRadius * 2, applySmoothing((data[i] / 255) * h * 0.8, i));
            ctx.beginPath();
            ctx.roundRect(x, (h - barHeight) / 2, barWidth, barHeight, cornerRadius);
            ctx.fill();
            x += barWidth + barSpacing;
        }
    };
    const drawCircle = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number) => {
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.2;
        const maxBarLength = Math.min(w, h) * 0.25;
        const sliceAngle = (Math.PI * 2) / barCount;
        ctx.lineWidth = (w / barCount) * 0.8;
        ctx.lineCap = barStyle === 'rounded' ? 'round' : 'butt';
        for (let i = 0; i < barCount; i++) {
            const barLength = applySmoothing((data[i] / 255) * maxBarLength, i);
            const angle = i * sliceAngle - Math.PI / 2;
            const startX = centerX + Math.cos(angle) * radius, startY = centerY + Math.sin(angle) * radius;
            const endX = centerX + Math.cos(angle) * (radius + barLength), endY = centerY + Math.sin(angle) * (radius + barLength);
            ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        }
    };
    const drawWave = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number, isFilled: boolean) => {
        ctx.lineWidth = 4; ctx.beginPath();
        const sliceWidth = w * 1.0 / bufferLength; let x = 0; const centerY = h / 2;
        for (let i = 0; i < bufferLength; i++) {
            const v = (data[i] - 128) / 128.0; const y = centerY + v * (h / 4);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        if (isFilled) { ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); }
        else { ctx.lineTo(w, centerY); ctx.stroke(); }
    };
    // Fix: Pass fillStyle to drawProgressWave to fix scope issue.
    const drawProgressWave = (ctx: CanvasRenderingContext2D, data: number[], w: number, h: number, fillStyle: string | CanvasGradient) => {
      const barWidth = w / data.length;
      const progressIndex = Math.floor((progress / duration) * data.length);
      for(let i=0; i < data.length; i++) {
          const barHeight = data[i] * h * 0.8;
          // Fix: Use passed fillStyle variable.
          ctx.fillStyle = i <= progressIndex ? fillStyle : '#cccccc';
          ctx.fillRect(i * barWidth, (h - barHeight) / 2, barWidth - 1, barHeight);
      }
    };
    const drawParticles = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number) => {
        let bass = data.slice(0, bufferLength / 4).reduce((a, b) => a + b) / (bufferLength / 4);
        if (bass > 140) { // Spawn particles on a bass hit
            for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                    x: w / 2, y: h / 2,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    life: 100, size: Math.random() * 5 + 2,
                });
            }
        }
        // Update and draw particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            let p = particlesRef.current[i];
            p.x += p.vx; p.y += p.vy; p.life -= 1; p.size *= 0.98;
            if (p.life <= 0 || p.size < 0.5) particlesRef.current.splice(i, 1);
            else {
                ctx.globalAlpha = p.life / 100;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    };
    const drawLyrics = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!activeLyric) return;
      ctx.font = `bold ${lyricSettings.fontSize}px '${lyricSettings.fontFamily}'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const xPos = w * (lyricSettings.positionX / 100), yPos = h * (lyricSettings.positionY / 100);
      const textMetrics = ctx.measureText(activeLyric.text);
      const padding = lyricSettings.fontSize * 0.4;
      ctx.fillStyle = lyricSettings.highlightColor;
      ctx.save(); ctx.beginPath();
      ctx.roundRect(xPos - (textMetrics.width / 2) - padding, yPos - (lyricSettings.fontSize / 2) - padding, textMetrics.width + (padding * 2), lyricSettings.fontSize + (padding * 2), 15);
      ctx.fill(); ctx.restore();
      ctx.fillStyle = lyricSettings.fontColor;
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5;
      ctx.fillText(activeLyric.text, xPos, yPos);
      ctx.shadowBlur = 0;
    };
    const drawLogo = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const size = w * (logoSettings.size / 100);
        const aspectRatio = logoImg!.width / logoImg!.height;
        const logoW = size, logoH = size / aspectRatio;
        const padding = w * 0.02;
        let x = padding, y = padding;
        if (logoSettings.position.includes('right')) x = w - logoW - padding;
        if (logoSettings.position.includes('bottom')) y = h - logoH - padding;
        if (logoSettings.position === 'center') { x = (w - logoW) / 2; y = (h - logoH) / 2; }
        ctx.globalAlpha = logoSettings.opacity / 100;
        ctx.drawImage(logoImg!, x, y, logoW, logoH);
        ctx.globalAlpha = 1;
    };
    const drawTimer = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const text = `${formatTime(progress)} / ${formatTime(duration)}`;
        ctx.font = `bold ${w * 0.02}px 'Roboto Mono', monospace`;
        ctx.fillStyle = lyricSettings.fontColor;
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5;
        ctx.fillText(text, w - (w * 0.02), h - (w * 0.02));
        ctx.shadowBlur = 0;
    };
    // Fix: Pass fillStyle to drawProgressBar to fix scope issue.
    const drawProgressBar = (ctx: CanvasRenderingContext2D, w: number, h: number, fillStyle: string | CanvasGradient) => {
        const barHeight = h * 0.01;
        const yPos = showProgressBar === 'top' ? 0 : h - barHeight;
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, yPos, w, barHeight);
        // Fix: Use passed fillStyle variable.
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, yPos, w * (progress/duration), barHeight);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameIdRef.current);
  }, [analyserNode, isPlaying, barCount, color, color2, useGradient, type, smoothing, ref, bgImage, backgroundColor, backgroundOpacity, backgroundBlur, barStyle, activeLyric, lyricSettings, visualizerPosition, logoImg, logoSettings, showTimer, showProgressBar, progress, duration, waveformData]);
  
  useEffect(() => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
    if (canvas) { canvas.width = resolution.width; canvas.height = resolution.height; }
  }, [resolution, ref]);

  const aspectRatio = resolution.width / resolution.height;

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-inner" style={{ aspectRatio: `${aspectRatio}` }}>
        <canvas ref={ref} className="w-full h-full object-contain" />
    </div>
  );
});

export default Visualizer;