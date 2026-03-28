import { useState } from 'react';
import { Heart, ChevronRight, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, UserSettings } from '@/lib/types';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

const CONDITIONS_SUGGESTIONS = ['Hypertension', 'Arrhythmia', 'Heart failure', 'Diabetes', 'Asthma'];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });
  const [newCondition, setNewCondition] = useState('');
  const [showConditionInput, setShowConditionInput] = useState(false);

  const removeCondition = (c: string) => {
    setSettings({ ...settings, knownConditions: settings.knownConditions.filter(k => k !== c) });
  };

  const addCondition = (c: string) => {
    if (c && !settings.knownConditions.includes(c)) {
      setSettings({ ...settings, knownConditions: [...settings.knownConditions, c] });
    }
    setNewCondition('');
    setShowConditionInput(false);
  };

  const handleFinish = () => {
    settings.onboarded = true;
    saveSettings(settings);
    onComplete();
  };

  const totalSteps = 3;

  return (
    <div className="flex min-h-screen flex-col px-6 pb-8 pt-6 relative overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-xl font-bold text-foreground">Beat Beat</h1>
        {step > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-widest uppercase">
            Phase {String(step).padStart(2, '0')}
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i < step ? 'w-6 bg-foreground' : 'w-4 bg-muted'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="flex flex-1 flex-col justify-center animate-in fade-in duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/40 mb-8">
            <Heart className="h-10 w-10 text-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground leading-tight">
            Listen to<br />your <em className="font-serif italic text-muted-foreground">heart.</em>
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-sm">
            Beat Beat utilizes advanced ML algorithms to detect subtle cardiac patterns, providing clinical-grade health insights from the palm of your hand.
          </p>
          <Button
            size="lg"
            className="mt-10 w-full rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
            onClick={() => setStep(1)}
          >
            Get Started
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="mt-4 w-full rounded-full text-base font-medium py-6 gap-3"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast.error("Google sign-in failed. Please try again.");
              }
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="flex flex-1 flex-col animate-in slide-in-from-right duration-300">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            Let's build your<br /><em className="font-serif italic text-muted-foreground">health profile.</em>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            To provide clinical-grade insights, we need to understand your baseline.
          </p>

          <div className="mt-8 space-y-6 flex-1">
            {/* Age */}
            <div>
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Age</label>
              <Input
                type="number"
                value={settings.age}
                onChange={e => setSettings({ ...settings, age: Number(e.target.value) })}
                min={1} max={120}
                className="mt-2 h-14 rounded-2xl border-0 bg-muted/50 text-lg px-5"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Sex</label>
              <div className="mt-2 flex gap-3">
                {['Male', 'Female'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSettings({ ...settings, sex: s.toLowerCase() })}
                    className={`flex-1 rounded-full py-3.5 text-base font-medium transition-all ${
                      settings.sex === s.toLowerCase()
                        ? 'bg-accent text-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Known Conditions */}
            <div>
              <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Known Conditions</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {settings.knownConditions.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {c}
                    <button onClick={() => removeCondition(c)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {showConditionInput ? (
                  <input
                    autoFocus
                    value={newCondition}
                    onChange={e => setNewCondition(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCondition(newCondition); if (e.key === 'Escape') setShowConditionInput(false); }}
                    onBlur={() => { if (newCondition) addCondition(newCondition); else setShowConditionInput(false); }}
                    placeholder="Type condition..."
                    className="rounded-full bg-muted/50 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/50 w-40"
                  />
                ) : (
                  <button
                    onClick={() => setShowConditionInput(true)}
                    className="text-sm italic text-muted-foreground hover:text-foreground transition-colors"
                  >
                    + Add condition
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Why do we ask */}
          <div className="flex items-center gap-3 mb-5 mt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Why do we ask this?</span>
          </div>

          <Button
            size="lg"
            className="w-full rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
            onClick={() => setStep(2)}
          >
            Continue
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-foreground' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Tutorial */}
      {step === 2 && (
        <div className="flex flex-1 flex-col animate-in slide-in-from-right duration-300">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            How to<br /><em className="font-serif italic text-muted-foreground">scan.</em>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Place your phone on your chest for the best reading.
          </p>

          <div className="mt-10 flex-1 space-y-6">
            {[
              { num: '01', text: 'Find a quiet spot and sit still.' },
              { num: '02', text: 'Place your phone flat against your chest, microphone side down.' },
              { num: '03', text: 'Stay calm and breathe normally during the scan.' },
            ].map(({ num, text }) => (
              <div key={num} className="flex gap-4 items-start">
                <span className="text-xs font-bold tracking-widest text-muted-foreground mt-1">{num}</span>
                <p className="text-base text-foreground">{text}</p>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
            onClick={handleFinish}
          >
            Start Scanning
            <Heart className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-2 w-2 rounded-full ${i === 2 ? 'bg-foreground' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
