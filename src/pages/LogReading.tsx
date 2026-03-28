import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSettings, saveReading } from '@/lib/storage';
import { classifyReading, detectSuddenChange, sendNotification } from '@/lib/anomaly';
import { HeartRateReading } from '@/lib/types';

const LogReading = () => {
  const navigate = useNavigate();
  const settings = getSettings();
  const [bpm, setBpm] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<HeartRateReading['status'] | null>(null);

  const handleBpmChange = (val: string) => {
    setBpm(val);
    const num = Number(val);
    if (num > 0) {
      setPreview(classifyReading(num, settings));
    } else {
      setPreview(null);
    }
  };

  const handleSave = () => {
    const num = Number(bpm);
    if (num <= 0) return;

    const status = classifyReading(num, settings);
    const isSudden = detectSuddenChange(num);

    const reading: HeartRateReading = {
      id: crypto.randomUUID(),
      bpm: num,
      note,
      timestamp: new Date().toISOString(),
      status: isSudden && status === 'normal' ? 'elevated' : status,
    };

    saveReading(reading);

    if ((status === 'anomaly' || isSudden) && settings.notificationsEnabled) {
      sendNotification(num);
    }

    setSaved(true);
    setTimeout(() => navigate('/'), 1200);
  };

  const feedbackColors = {
    normal: 'border-success/50 bg-success/5',
    elevated: 'border-warning/50 bg-warning/5',
    anomaly: 'border-destructive/50 bg-destructive/5',
  };

  const feedbackLabels = {
    normal: { text: 'Normal range', color: 'bg-success text-success-foreground' },
    elevated: { text: 'Elevated', color: 'bg-warning text-warning-foreground' },
    anomaly: { text: 'Anomaly detected!', color: 'bg-destructive text-destructive-foreground' },
  };

  if (saved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <Check className="h-10 w-10 text-success" />
        </div>
        <p className="font-display text-xl font-bold text-foreground">Reading Saved!</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">Log Reading</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your current heart rate</p>

      <Card className={`mt-6 transition-colors ${preview ? feedbackColors[preview] : ''}`}>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="bpm">Heart Rate (BPM)</Label>
            <div className="relative">
              <Input
                id="bpm"
                type="number"
                inputMode="numeric"
                placeholder="72"
                value={bpm}
                onChange={e => handleBpmChange(e.target.value)}
                className="pr-16 text-3xl font-bold h-16 font-display"
                min={20}
                max={300}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">BPM</span>
            </div>
            {preview && (
              <Badge className={feedbackLabels[preview].color}>
                <Heart className="mr-1 h-3 w-3" />
                {feedbackLabels[preview].text}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              placeholder="e.g., after exercise, resting, feeling dizzy"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="mt-6 w-full rounded-full text-lg font-semibold"
        onClick={handleSave}
        disabled={!bpm || Number(bpm) <= 0}
      >
        Save Reading
      </Button>
    </div>
  );
};

export default LogReading;
