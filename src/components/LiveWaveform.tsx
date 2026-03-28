import { useEffect, useRef, useState } from 'react';

interface LiveWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  elapsed: number;
  duration: number;
}

const BAR_WIDTH = 3;
const BAR_GAP = 1.5;

const LiveWaveform = ({ stream, isRecording, elapsed, duration }: LiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Calculate total bars that fit the canvas
  const getTotalBars = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 80;
    return Math.floor(canvas.clientWidth / (BAR_WIDTH + BAR_GAP));
  };

  useEffect(() => {
    if (!stream || !isRecording) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    return () => {
      audioCtx.close();
      analyserRef.current = null;
      audioCtxRef.current = null;
    };
  }, [stream, isRecording]);

  useEffect(() => {
    if (!isRecording) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const totalBars = getTotalBars();
    let lastBarTime = 0;
    const barInterval = (duration * 1000) / totalBars;

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const now = Date.now();

      // Add new bar based on current audio level
      if (analyser && now - lastBarTime >= barInterval) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        // Add some variation
        const level = Math.max(0.08, normalized + (Math.random() * 0.15 - 0.075));
        barsRef.current.push(level);
        lastBarTime = now;
      }

      // Draw all bars
      const bars = barsRef.current;
      const currentBarCount = bars.length;
      const totalBarWidth = BAR_WIDTH + BAR_GAP;
      const startX = 0;

      const rootStyles = getComputedStyle(document.documentElement);
      const foreground = rootStyles.getPropertyValue('--foreground').trim();
      const mutedFg = rootStyles.getPropertyValue('--muted-foreground').trim();

      for (let i = 0; i < currentBarCount && i < totalBars; i++) {
        const x = startX + i * totalBarWidth;
        const barHeight = Math.max(3, bars[i] * (h * 0.85));
        const y = (h - barHeight) / 2;

        ctx.fillStyle = `hsl(${destructive})`;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1);
        ctx.fill();
      }

      // Draw playhead line at current position
      if (currentBarCount > 0) {
        const playheadX = startX + currentBarCount * totalBarWidth - BAR_GAP;
        const gradient = ctx.createLinearGradient(playheadX, 0, playheadX, h);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, 'hsl(45, 90%, 55%)');
        gradient.addColorStop(0.5, 'hsl(45, 95%, 60%)');
        gradient.addColorStop(0.8, 'hsl(45, 90%, 55%)');
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();
      }

      // Draw unfilled bars as faint placeholders
      for (let i = currentBarCount; i < totalBars; i++) {
        const x = startX + i * totalBarWidth;
        const barHeight = 3;
        const y = (h - barHeight) / 2;

        ctx.fillStyle = `hsl(${destructive} / 0.15)`;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    // Reset bars on new recording
    barsRef.current = [];
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [isRecording, duration]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 mt-4"
    />
  );
};

export default LiveWaveform;
