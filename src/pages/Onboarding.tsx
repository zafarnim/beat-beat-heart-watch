import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getSettings, saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, UserSettings } from '@/lib/types';
import { requestNotificationPermission } from '@/lib/anomaly';

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });

  const handleFinish = async () => {
    settings.onboarded = true;
    if (settings.notificationsEnabled) {
      await requestNotificationPermission();
    }
    saveSettings(settings);
    onComplete();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {step === 0 && (
        <div className="flex flex-col items-center gap-8 text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="h-14 w-14 animate-heartbeat" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Beat Beat
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Track your heart. Catch what matters.
            </p>
          </div>
          <Button size="lg" className="mt-4 w-full max-w-xs rounded-full text-lg font-semibold" onClick={() => setStep(1)}>
            Get Started
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="w-full max-w-sm animate-in slide-in-from-right duration-300">
          <h2 className="font-display text-2xl font-bold text-foreground">Set Your Baseline</h2>
          <p className="mt-1 text-sm text-muted-foreground">This helps us detect anomalies in your readings.</p>

          <Card className="mt-6">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="age">Your Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={settings.age}
                  onChange={e => setSettings({ ...settings, age: Number(e.target.value) })}
                  min={1} max={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Resting Heart Rate Range (BPM)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="Low"
                    value={settings.restingBpmLow}
                    onChange={e => setSettings({ ...settings, restingBpmLow: Number(e.target.value) })}
                    min={30} max={200}
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="High"
                    value={settings.restingBpmHigh}
                    onChange={e => setSettings({ ...settings, restingBpmHigh: Number(e.target.value) })}
                    min={30} max={220}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="mt-6 w-full rounded-full text-lg font-semibold" onClick={handleFinish}>
            Start Tracking
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
