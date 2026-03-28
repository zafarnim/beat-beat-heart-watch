import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, X, Bell, Upload } from 'lucide-react';
import phoneHeartbeatVideo from '@/assets/phone-heartbeat.mp4';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScanResultType } from '@/lib/types';
import NormalResult from '@/components/results/NormalResult';
import ClearClassificationResult from '@/components/results/ClearClassificationResult';
import InconclusiveResult from '@/components/results/InconclusiveResult';
import EmergencyResult from '@/components/results/EmergencyResult';
import TryAgainResult from '@/components/results/TryAgainResult';
import WaveformPlayer from '@/components/WaveformPlayer';

type Phase = 'position' | 'recording' | 'analyzing' | 'result';

const SCAN_DURATION = 15;

const API_URL = import.meta.env.VITE_BEATBEAT_API_URL || 'https://hamed-2--beatbeat-api.modal.run';

interface AnalysisResult {
  result: ScanResultType;
  title: string;
  description: string;
  condition?: string;
  steps?: string;
  bpm?: number;
  variability?: number;
}

async function analyzeAudio(blob: Blob): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return {
      result: data.result as ScanResultType,
      title: data.result_title,
      description: data.result_description,
      condition: data.condition_name || undefined,
      steps: data.recommended_steps || undefined,
      bpm: data.bpm,
      variability: data.variability,
    };
  } catch {
    console.error('ML API unavailable, using fallback');
    return {
      result: 'try_again',
      title: 'Analysis Unavailable',
      description: 'Could not reach the analysis server. Please check your connection and try again.',
    };
  }
}

const Scan = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('position');
  const [countdown, setCountdown] = useState(SCAN_DURATION);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); };

      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setPhase('recording');
      setCountdown(SCAN_DURATION);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = SCAN_DURATION - elapsed;
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          mediaRecorder.stop();
          handleAnalysis();
        } else {
          setCountdown(remaining);
        }
      }, 250);
    } catch {
      toast.error('Microphone access is required for scanning.');
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blob = new Blob([file], { type: file.type });
    chunksRef.current = [blob];
    startTimeRef.current = Date.now();

    const localUrl = URL.createObjectURL(blob);
    setAudioUrl(localUrl);
    setPhase('analyzing');

    const { data: { user } } = await supabase.auth.getUser();

    const fileName = `scan_${Date.now()}.${file.name.split('.').pop() || 'wav'}`;
    const { error: storageError } = await supabase.storage.from('recordings').upload(fileName, blob, { contentType: file.type });

    let recordingId: string | null = null;
    if (!storageError) {
      const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(fileName);
      const { data: recData } = await supabase.from('recordings').insert({
        file_path: fileName,
        file_url: urlData.publicUrl,
        duration_seconds: 0,
        user_id: user?.id,
      }).select('id').single();
      if (recData) recordingId = recData.id;
    }

    const result = await analyzeAudio(blob);
    setAnalysisResult(result);

    if (result.result !== 'try_again') {
      await supabase.from('scans').insert({
        recording_id: recordingId,
        result: result.result,
        result_title: result.title,
        result_description: result.description,
        condition_name: result.condition || null,
        recommended_steps: result.steps || null,
        user_id: user?.id,
      });
    }

    setPhase('result');
  }, []);

  const handleAnalysis = async () => {
    setPhase('analyzing');

    const { data: { user } } = await supabase.auth.getUser();

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const localUrl = URL.createObjectURL(blob);
    setAudioUrl(localUrl);

    const fileName = `scan_${Date.now()}.webm`;
    const { error: storageError } = await supabase.storage.from('recordings').upload(fileName, blob, { contentType: 'audio/webm' });

    let recordingId: string | null = null;
    if (!storageError) {
      const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(fileName);
      const durationSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const { data: recData } = await supabase.from('recordings').insert({
        file_path: fileName,
        file_url: urlData.publicUrl,
        duration_seconds: durationSecs,
        user_id: user?.id,
      }).select('id').single();
      if (recData) recordingId = recData.id;
    }

    const result = await analyzeAudio(blob);
    setAnalysisResult(result);

    if (result.result !== 'try_again') {
      await supabase.from('scans').insert({
        recording_id: recordingId,
        result: result.result,
        result_title: result.title,
        result_description: result.description,
        condition_name: result.condition || null,
        recommended_steps: result.steps || null,
        user_id: user?.id,
      });
    }

    setPhase('result');
  };

  const handleSendToKry = () => {
    toast.success('Scan sent to Kry for review');
  };

  const resetScan = () => {
    setPhase('position');
    setAnalysisResult(null);
    setAudioUrl(null);
    setCountdown(SCAN_DURATION);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      {phase !== 'result' && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-foreground">
              <X className="h-5 w-5" />
            </button>
            <span className="font-display text-lg font-bold text-foreground">Beat Beat</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-accent/60 flex items-center justify-center">
            <Heart className="h-4 w-4 text-foreground" />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
        {phase === 'position' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            <div className="w-48 h-48 rounded-2xl overflow-hidden">
              <video src={phoneHeartbeatVideo} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Position Your Phone</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Place your phone flat against your chest with the microphone facing down. Sit still and breathe normally.
            </p>
            <Button
              size="lg"
              className="mt-4 w-full max-w-xs rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
              onClick={startRecording}
            >
              I'm Ready
            </Button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            <p className="text-xs tracking-widest uppercase text-muted-foreground">Scanning Vital Signs</p>
            <p className="font-display text-6xl font-bold tabular-nums text-foreground">{formatTime(countdown)}</p>

            <div className="relative my-4">
              <div className="absolute inset-[-20px] rounded-full bg-muted/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-[-10px] rounded-full bg-muted/40 animate-pulse" />
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-muted-foreground to-foreground shadow-2xl">
                <Heart className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-4 py-2 text-xs font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Recording in progress...
            </span>

            <p className="text-sm text-muted-foreground max-w-xs">
              Keep your finger steady on the sensor and breathe naturally.
            </p>

            <div className="flex items-end gap-0.5 h-12 mt-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-muted-foreground/30 animate-pulse"
                  style={{
                    height: `${Math.max(8, Math.random() * 40 + 8)}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Analyzing…</h2>
            <p className="text-sm text-muted-foreground">Processing your heartbeat recording.</p>
          </div>
        )}

        {phase === 'result' && analysisResult && (
          <div className="w-full max-w-sm space-y-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/60 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-foreground" />
                </div>
                <span className="font-display text-lg font-bold text-foreground">Beat Beat</span>
              </div>
              <Bell className="h-5 w-5 text-foreground" />
            </div>

            {analysisResult.result === 'normal' && (
              <NormalResult onDone={() => navigate('/')} bpm={analysisResult.bpm} variability={analysisResult.variability} />
            )}
            {analysisResult.result === 'clear_classification' && (
              <ClearClassificationResult
                conditionName={analysisResult.condition!}
                description={analysisResult.description}
                steps={analysisResult.steps!}
                onSendToKry={handleSendToKry}
                onDone={() => navigate('/')}
              />
            )}
            {analysisResult.result === 'inconclusive' && <InconclusiveResult onSendToKry={handleSendToKry} onDone={() => navigate('/')} />}
            {analysisResult.result === 'emergency' && <EmergencyResult onDone={() => navigate('/')} />}
            {analysisResult.result === 'try_again' && <TryAgainResult onRetry={resetScan} />}

            {audioUrl && analysisResult.result !== 'try_again' && (
              <WaveformPlayer audioUrl={audioUrl} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scan;
