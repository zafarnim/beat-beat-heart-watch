import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Smartphone, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScanResultType } from '@/lib/types';
import NormalResult from '@/components/results/NormalResult';
import ClearClassificationResult from '@/components/results/ClearClassificationResult';
import InconclusiveResult from '@/components/results/InconclusiveResult';
import EmergencyResult from '@/components/results/EmergencyResult';
import TryAgainResult from '@/components/results/TryAgainResult';

type Phase = 'position' | 'recording' | 'analyzing' | 'result';

const SCAN_DURATION = 15;

function mockAnalyze(): { result: ScanResultType; title: string; description: string; condition?: string; steps?: string } {
  const roll = Math.random();
  if (roll < 0.5) return { result: 'normal', title: 'Normal Rhythm', description: 'Your heart rhythm appears normal and healthy.' };
  if (roll < 0.7) return { result: 'clear_classification', title: 'Irregular Pattern Detected', description: 'We detected a pattern consistent with atrial fibrillation. This is a common condition that can be managed effectively with proper care.', condition: 'Atrial Fibrillation (AFib)', steps: 'Schedule an appointment with your doctor for an ECG confirmation within the next 2 weeks.' };
  if (roll < 0.85) return { result: 'inconclusive', title: 'Inconclusive Reading', description: 'The recording shows some irregularities that need professional interpretation.' };
  if (roll < 0.92) return { result: 'emergency', title: 'Urgent Pattern Detected', description: 'Critical irregularity detected. Seek immediate medical attention.' };
  return { result: 'try_again', title: 'Poor Signal Quality', description: 'We could not capture a clear enough signal to analyze.' };
}

const Scan = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('position');
  const [countdown, setCountdown] = useState(SCAN_DURATION);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof mockAnalyze> | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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

  const handleAnalysis = async () => {
    setPhase('analyzing');

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
      }).select('id').single();
      if (recData) recordingId = recData.id;
    }

    await new Promise(r => setTimeout(r, 2500));
    const result = mockAnalyze();
    setAnalysisResult(result);

    if (result.result !== 'try_again') {
      await supabase.from('scans').insert({
        recording_id: recordingId,
        result: result.result,
        result_title: result.title,
        result_description: result.description,
        condition_name: result.condition || null,
        recommended_steps: result.steps || null,
      });
    }

    setPhase('result');
  };

  const handleSendToKry = () => {
    toast.success('Scan sent to Kry (mock)');
  };

  const resetScan = () => {
    setPhase('position');
    setAnalysisResult(null);
    setAudioUrl(null);
    setCountdown(SCAN_DURATION);
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pb-10 pt-6">
      {phase !== 'result' && (
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        {phase === 'position' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl glass">
              <Smartphone className="h-12 w-12 text-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Position Your Phone</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Place your phone flat against your chest with the microphone facing down. Sit still and breathe normally.
            </p>
            <Button size="lg" className="mt-4 w-full max-w-xs rounded-full text-lg font-semibold" onClick={startRecording}>
              I'm Ready
            </Button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-8 text-center animate-in fade-in duration-300">
            <div className="relative">
              <div className="absolute inset-[-24px] rounded-full glass opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-[-12px] rounded-full glass opacity-50 animate-pulse" />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full glass-strong">
                <Heart className="h-14 w-14 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <p className="font-display text-5xl font-bold tabular-nums text-foreground">{countdown}</p>
              <p className="mt-1 text-sm text-muted-foreground">seconds remaining</p>
            </div>
            <p className="text-sm text-muted-foreground">Listening to your heartbeat…</p>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
            <div className="flex h-24 w-24 items-center justify-center rounded-full glass">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Analyzing…</h2>
            <p className="text-sm text-muted-foreground">Processing your heartbeat recording.</p>
          </div>
        )}

        {phase === 'result' && analysisResult && (
          <div className="w-full max-w-sm space-y-6">
            {analysisResult.result === 'normal' && <NormalResult onDone={() => navigate('/')} />}
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
              <div className="rounded-2xl glass-card p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Your Recording</p>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scan;
