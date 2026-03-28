import { useState } from 'react';
import { Heart, Smartphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, UserSettings } from '@/lib/types';

const CONDITIONS = ['Hypertension', 'Arrhythmia', 'Heart failure', 'Diabetes', 'Asthma', 'None'];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });

  const toggleCondition = (c: string) => {
    if (c === 'None') {
      setSettings({ ...settings, knownConditions: [] });
      return;
    }
    const has = settings.knownConditions.includes(c);
    setSettings({
      ...settings,
      knownConditions: has
        ? settings.knownConditions.filter(k => k !== c)
        : [...settings.knownConditions, c],
    });
  };

  const handleFinish = () => {
    settings.onboarded = true;
    saveSettings(settings);
    onComplete();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated gradient orbs for depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/30 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="relative flex flex-col items-center gap-8 text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-[-8px] rounded-full glass opacity-60 animate-pulse" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full glass-strong text-primary">
              <Heart className="h-14 w-14" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Beat Beat
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Listen to your heart. Know what it says.
            </p>
          </div>
          <Button size="lg" className="mt-4 w-full max-w-xs rounded-full text-lg font-semibold" onClick={() => setStep(1)}>
            Get Started
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="relative w-full max-w-sm animate-in slide-in-from-right duration-300">
          <h2 className="font-display text-2xl font-bold text-foreground">About You</h2>
          <p className="mt-1 text-sm text-muted-foreground">Help us personalize your experience.</p>

          <Card className="mt-6">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={settings.age}
                  onChange={e => setSettings({ ...settings, age: Number(e.target.value) })}
                  min={1} max={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Select value={settings.sex} onValueChange={v => setSettings({ ...settings, sex: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Known Conditions</Label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => (
                    <Badge
                      key={c}
                      variant={settings.knownConditions.includes(c) || (c === 'None' && settings.knownConditions.length === 0) ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => toggleCondition(c)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="mt-6 w-full rounded-full text-lg font-semibold" onClick={() => setStep(2)}>
            Continue
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step 2: Tutorial */}
      {step === 2 && (
        <div className="relative w-full max-w-sm animate-in slide-in-from-right duration-300">
          <h2 className="font-display text-2xl font-bold text-foreground">How It Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">Place your phone on your chest for the best reading.</p>

          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-6 py-10">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl glass">
                <Smartphone className="h-12 w-12 text-foreground" />
              </div>
              <div className="space-y-3 text-center text-sm text-muted-foreground">
                <p><strong className="text-foreground">1.</strong> Find a quiet spot and sit still.</p>
                <p><strong className="text-foreground">2.</strong> Place your phone flat against your chest, microphone side down.</p>
                <p><strong className="text-foreground">3.</strong> Stay calm and breathe normally during the scan.</p>
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="mt-6 w-full rounded-full text-lg font-semibold" onClick={handleFinish}>
            Start Scanning
            <Heart className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
