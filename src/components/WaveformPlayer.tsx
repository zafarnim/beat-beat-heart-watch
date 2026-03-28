import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, FastForward } from 'lucide-react';

interface WaveformPlayerProps {
  audioUrl: string;
}

const BAR_COUNT = 60;
const BAR_WIDTH = 3;
const BAR_GAP = 2;

const WaveformPlayer = ({ audioUrl }: WaveformPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Decode audio and extract waveform peaks
  useEffect(() => {
    const extractWaveform = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        const blockSize = Math.floor(channelData.length / BAR_COUNT);
        const peaks: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          peaks.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...peaks, 0.01);
        setWaveformData(peaks.map(p => p / max));
        audioContext.close();
      } catch {
        // Fallback: generate random waveform
        setWaveformData(Array.from({ length: BAR_COUNT }, () => 0.15 + Math.random() * 0.85));
      }
    };

    extractWaveform();
  }, [audioUrl]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplaythrough', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    // For blob URLs, sometimes we need to seek to get the real duration
    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) {
        audio.currentTime = 1e101;
        audio.addEventListener('timeupdate', function seekBack() {
          audio.removeEventListener('timeupdate', seekBack);
          audio.currentTime = 0;
          updateDuration();
        });
      }
    });

    return () => {
      audio.pause();
      audio.src = '';
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioUrl]);

  // Animation loop for smooth progress
  useEffect(() => {
    const tick = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const progress = duration > 0 ? currentTime / duration : 0;
    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const startX = (w - BAR_COUNT * totalBarWidth + BAR_GAP) / 2;

    const rootStyles = getComputedStyle(document.documentElement);
    const mutedFg = rootStyles.getPropertyValue('--muted-foreground').trim();
    const foreground = rootStyles.getPropertyValue('--foreground').trim();

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = startX + i * totalBarWidth;
      const barHeight = Math.max(4, waveformData[i] * (h * 0.8));
      const y = (h - barHeight) / 2;
      const barProgress = i / BAR_COUNT;

      ctx.fillStyle = barProgress <= progress
        ? `hsl(${foreground})`
        : `hsl(${mutedFg} / 0.3)`;
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1.5);
      ctx.fill();
    }
  }, [waveformData, currentTime, duration]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration);
  }, [duration]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !canvasRef.current || duration === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(audioRef.current.currentTime);
  }, [duration]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl bg-muted/30 p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Your Recording</p>
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
        <button onClick={togglePlay} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-foreground transition hover:bg-muted-foreground/30">
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>

        <span className="text-xs tabular-nums text-muted-foreground w-10 shrink-0">{formatTime(currentTime)}</span>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="h-10 flex-1 cursor-pointer"
        />

        <span className="text-xs tabular-nums text-muted-foreground w-10 shrink-0 text-right">{formatTime(duration)}</span>

        <button onClick={skipForward} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground">
          <FastForward className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default WaveformPlayer;
