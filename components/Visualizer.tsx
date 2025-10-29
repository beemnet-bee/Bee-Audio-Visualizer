import React, { useRef, useEffect, useState } from 'react';
import { TimedLyric, Resolution } from '../App';
import { LyricSettings } from './Controls';

export type VisualizerType = 'bar' | 'bar-center' | 'circle' | 'wave' | 'wave-fill';
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
}

const Visualizer = React.forwardRef<HTMLCanvasElement, VisualizerProps>(({ 
  analyserNode, 
  isPlaying, 
  barCount, 
  color,
  color2,
  useGradient,
  type,
  smoothing,
  backgroundImage,
  backgroundColor,
  backgroundOpacity,
  backgroundBlur,
  barStyle,
  activeLyric,
  lyricSettings,
  resolution,
  visualizerPosition
}, ref) => {
  const animationFrameIdRef = useRef<number>(0);
  const prevDataRef = useRef<number[]>([]);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = backgroundImage;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [backgroundImage]);

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

      // Determine which data to get
      if (type === 'wave' || type === 'wave-fill') {
        analyserNode.getByteTimeDomainData(dataArray);
      } else {
        analyserNode.getByteFrequencyData(dataArray);
      }

      // Clear canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background color
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background image
      if (bgImage) {
        canvasCtx.save();
        canvasCtx.globalAlpha = backgroundOpacity;
        canvasCtx.filter = `blur(${backgroundBlur}px)`;
        canvasCtx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        canvasCtx.restore();
      }
      
      // Initialize or resize prevData array
      if (prevDataRef.current.length !== barCount) {
        prevDataRef.current = new Array(barCount).fill(0);
      }

      // Create fill style
      let fillStyle: string | CanvasGradient = color;
      if (useGradient) {
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color2);
        fillStyle = gradient;
      }
      canvasCtx.fillStyle = fillStyle;
      canvasCtx.strokeStyle = fillStyle;
      
      // Set glow effect for visualizer elements
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = useGradient ? color : color;
      
      canvasCtx.save();
      
      const verticalOffset = ((visualizerPosition - 50) / 50) * (canvas.height / 4);
      canvasCtx.translate(0, verticalOffset);

      // Call drawing function based on type
      switch (type) {
        case 'bar':
          drawBars(canvasCtx, dataArray, canvas.width, canvas.height);
          break;
        case 'bar-center':
          drawBarsFromCenter(canvasCtx, dataArray, canvas.width, canvas.height);
          break;
        case 'circle':
          drawCircle(canvasCtx, dataArray, canvas.width, canvas.height);
          break;
        case 'wave':
          drawWave(canvasCtx, dataArray, canvas.width, canvas.height, false);
          break;
        case 'wave-fill':
          drawWave(canvasCtx, dataArray, canvas.width, canvas.height, true);
          break;
      }
      
      canvasCtx.restore();

      // Reset glow effect before drawing lyrics
      canvasCtx.shadowBlur = 0;
      canvasCtx.shadowColor = 'transparent';

      // Draw lyrics
      if (activeLyric) {
        drawLyrics(canvasCtx, canvas.width, canvas.height);
      }
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
            
            const startX = centerX + Math.cos(angle) * radius;
            const startY = centerY + Math.sin(angle) * radius;
            const endX = centerX + Math.cos(angle) * (radius + barLength);
            const endY = centerY + Math.sin(angle) * (radius + barLength);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    };

    const drawWave = (ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number, isFilled: boolean) => {
        ctx.lineWidth = 4;
        ctx.beginPath();
        const sliceWidth = w * 1.0 / bufferLength;
        let x = 0;
        const centerY = h / 2;

        for (let i = 0; i < bufferLength; i++) {
            const v = (data[i] - 128) / 128.0; // Waveform data is signed, goes from -1 to 1
            const y = centerY + v * (h / 4);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        
        if (isFilled) {
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.lineTo(w, centerY);
          ctx.stroke();
        }
    };
    
    const drawLyrics = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!activeLyric) return;
      
      ctx.font = `bold ${lyricSettings.fontSize}px '${lyricSettings.fontFamily}'`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const xPos = w * (lyricSettings.positionX / 100);
      const yPos = h * (lyricSettings.positionY / 100);

      // Draw highlight background
      const textMetrics = ctx.measureText(activeLyric.text);
      const padding = lyricSettings.fontSize * 0.4;
      ctx.fillStyle = lyricSettings.highlightColor;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(
          xPos - (textMetrics.width / 2) - padding,
          yPos - (lyricSettings.fontSize / 2) - padding,
          textMetrics.width + (padding * 2),
          lyricSettings.fontSize + (padding * 2),
          15
      );
      ctx.fill();
      ctx.restore();

      // Draw text
      ctx.fillStyle = lyricSettings.fontColor;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 5;
      ctx.fillText(activeLyric.text, xPos, yPos);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [analyserNode, isPlaying, barCount, color, color2, useGradient, type, smoothing, ref, bgImage, backgroundColor, backgroundOpacity, backgroundBlur, barStyle, activeLyric, lyricSettings, visualizerPosition]);
  
  // Handle canvas resolution change
  useEffect(() => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
    if (canvas) {
      canvas.width = resolution.width;
      canvas.height = resolution.height;
    }
  }, [resolution, ref]);


  const aspectRatio = resolution.width / resolution.height;

  return (
    <div className="w-full bg-black/20 rounded-lg overflow-hidden shadow-inner shadow-black/50" style={{ aspectRatio: `${aspectRatio}` }}>
        <canvas ref={ref} className="w-full h-full object-contain" />
    </div>
  );
});

export default Visualizer;