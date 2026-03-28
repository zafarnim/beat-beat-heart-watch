import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RecordingState = 'idle' | 'recording' | 'uploading' | 'done';

const Record = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

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
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        await uploadRecording(blob);
      };

      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);
    } catch (err) {
      console.error('Mic access denied:', err);
      toast.error('Microphone access is required to record.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setState('uploading');
  }, []);

  const uploadRecording = async (blob: Blob) => {
    const fileName = `recording_${Date.now()}.webm`;
    const filePath = fileName;

    const { error: storageError } = await supabase.storage
      .from('recordings')
      .upload(filePath, blob, { contentType: 'audio/webm' });

    if (storageError) {
      console.error('Upload failed:', storageError);
      toast.error('Failed to upload recording.');
      setState('idle');
      return;
    }

    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    const durationSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const { error: dbError } = await supabase.from('recordings').insert({
      file_path: filePath,
      file_url: urlData.publicUrl,
      duration_seconds: durationSecs,
    });

    if (dbError) {
      console.error('DB insert failed:', dbError);
      toast.error('Failed to save recording metadata.');
      setState('idle');
      return;
    }

    toast.success('Recording saved!');
    setState('done');
    setTimeout(() => navigate('/'), 1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">Record</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture an audio recording of your heartbeat
      </p>

      <Card className="mt-8 border-0 shadow-sm">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          {/* Timer */}
          <p className="font-display text-5xl font-bold tabular-nums text-foreground">
            {formatTime(duration)}
          </p>

          {/* Visualizer ring */}
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300 ${
              state === 'recording'
                ? 'bg-destructive/10 animate-pulse shadow-[0_0_40px_hsl(var(--destructive)/0.25)]'
                : state === 'uploading'
                  ? 'bg-muted'
                  : state === 'done'
                    ? 'bg-success/10'
                    : 'bg-primary/10'
            }`}
          >
            {state === 'idle' && <Mic className="h-12 w-12 text-primary" />}
            {state === 'recording' && (
              <div className="h-10 w-10 rounded-sm bg-destructive" />
            )}
            {state === 'uploading' && (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            )}
            {state === 'done' && <Check className="h-12 w-12 text-success" />}
          </div>

          {/* Status text */}
          <p className="text-sm font-medium text-muted-foreground">
            {state === 'idle' && 'Tap to start recording'}
            {state === 'recording' && 'Recording… tap to stop'}
            {state === 'uploading' && 'Saving recording…'}
            {state === 'done' && 'Recording saved!'}
          </p>

          {/* Playback preview */}
          {audioUrl && state === 'done' && (
            <audio controls src={audioUrl} className="w-full max-w-xs" />
          )}
        </CardContent>
      </Card>

      {/* Record / Stop button */}
      {state === 'idle' && (
        <Button
          size="lg"
          className="mt-6 w-full rounded-full text-lg font-semibold"
          onClick={startRecording}
        >
          <Mic className="mr-2 h-5 w-5" />
          Start Recording
        </Button>
      )}

      {state === 'recording' && (
        <Button
          size="lg"
          variant="destructive"
          className="mt-6 w-full rounded-full text-lg font-semibold"
          onClick={stopRecording}
        >
          <Square className="mr-2 h-5 w-5" />
          Stop Recording
        </Button>
      )}
    </div>
  );
};

export default Record;
