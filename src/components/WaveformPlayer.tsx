import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, FastForward, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface WaveformPlayerProps {
  audioUrl: string;
}

const BAR_COUNT = 60;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const SPECTRUM_BARS = 32;

const WaveformPlayer = ({ audioUrl }: WaveformPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceCreatedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [gain, setGain] = useState(1);
  const [showSpectrum, setShowSpectrum] = useState(true);

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

        const max = Math.max(...peaks, 0.01);
        setWaveformData(peaks.map(p => p / max));
        audioContext.close();
      } catch {
        setWaveformData(Array.from({ length: BAR_COUNT }, () => 0.15 + Math.random() * 0.85));
      }
    };

    extractWaveform();
  }, [audioUrl]);

  // Setup audio element + Web Audio nodes
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    sourceCreatedRef.current = false;

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplaythrough', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

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
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
      sourceCreatedRef.current = false;
    };
  }, [audioUrl]);

  // Connect Web Audio graph on first play
  const ensureAudioContext = useCallback(() => {
    if (sourceCreatedRef.current || !audioRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;
      sourceCreatedRef.current = true;
    } catch (e) {
      console.warn('Could not create audio context for spectrum:', e);
    }
  }, [gain]);

  // Update gain when slider changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gain;
    }
  }, [gain]);

  // Animation loop
  useEffect(() => {
    const tick = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      drawSpectrum();
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  // Draw spectrum
  const drawSpectrum = useCallback(() => {
    const canvas = spectrumCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = w / SPECTRUM_BARS;
    const rootStyles = getComputedStyle(document.documentElement);
    const primary = rootStyles.getPropertyValue('--primary').trim();
    const accent = rootStyles.getPropertyValue('--accent').trim();

    for (let i = 0; i < SPECTRUM_BARS; i++) {
      // Average a range of frequency bins
      const startBin = Math.floor((i / SPECTRUM_BARS) * dataArray.length);
      const endBin = Math.floor(((i + 1) / SPECTRUM_BARS) * dataArray.length);
      let sum = 0;
      for (let j = startBin; j < endBin; j++) sum += dataArray[j];
      const avg = sum / (endBin - startBin || 1);
      const normalized = avg / 255;

      const barHeight = Math.max(2, normalized * h * 0.95);
      const x = i * barWidth + 1;
      const bw = barWidth - 2;

      // Gradient from primary to accent based on frequency
      const gradient = ctx.createLinearGradient(x, h, x, h - barHeight);
      gradient.addColorStop(0, `hsl(${primary})`);
      gradient.addColorStop(1, `hsl(${primary} / 0.4)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, h - barHeight, bw, barHeight, 2);
      ctx.fill();
    }
  }, []);

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
    const primary = rootStyles.getPropertyValue('--primary').trim();
    const mutedFg = rootStyles.getPropertyValue('--muted-foreground').trim();

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = startX + i * totalBarWidth;
      const barHeight = Math.max(4, waveformData[i] * (h * 0.8));
      const y = (h - barHeight) / 2;
      const barProgress = i / BAR_COUNT;

      if (barProgress <= progress) {
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, `hsl(${primary})`);
        grad.addColorStop(1, `hsl(${primary} / 0.6)`);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = `hsl(${mutedFg} / 0.2)`;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1.5);
      ctx.fill();
    }
  }, [waveformData, currentTime, duration]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    ensureAudioContext();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, ensureAudioContext]);

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
    if (!isFinite(t) || isNaN(t)) return '00:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const gainLabel = gain <= 0.05 ? 'Muted' : `${Math.round(gain * 100)}%`;

  return (
    <div className="rounded-2xl bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Your Recording</p>
        <button
          onClick={() => setShowSpectrum(!showSpectrum)}
          className="text-[10px] font-medium text-primary/70 hover:text-primary transition-colors"
        >
          {showSpectrum ? 'Hide Spectrum' : 'Show Spectrum'}
        </button>
      </div>

      {/* Spectrum Visualizer */}
      {showSpectrum && (
        <canvas
          ref={spectrumCanvasRef}
          className="w-full h-20 rounded-xl bg-muted/20"
        />
      )}

      {/* Waveform + Controls */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
        <button onClick={togglePlay} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30">
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

      {/* Volume / Amplification Control */}
      <div className="flex items-center gap-3 px-1">
        <button
          onClick={() => setGain(g => g > 0.05 ? 0 : 1)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {gain <= 0.05 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <Slider
          value={[gain]}
          onValueChange={([v]) => setGain(v)}
          min={0}
          max={5}
          step={0.1}
          className="flex-1"
        />
        <span className="text-[10px] font-medium text-muted-foreground w-10 text-right tabular-nums">
          {gainLabel}
        </span>
      </div>
    </div>
  );
};

export default WaveformPlayer;
