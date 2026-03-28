import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, HelpCircle, X, ArrowRight, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AgeDialSelector from '@/components/AgeDialSelector';
import { saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, UserSettings } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import onboardingHero from '@/assets/onboarding-hero.jpg';

const CONDITIONS_SUGGESTIONS = ['Hypertension', 'Arrhythmia', 'Heart failure', 'Diabetes', 'Asthma'];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });
  const [newCondition, setNewCondition] = useState('');
  const [showConditionInput, setShowConditionInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        handleFinish();
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email for a verification link!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

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
    navigate('/scan');
  };

  const totalSteps = 3;

  {/* Step 0: Welcome — full-screen hero */}
  if (step === 0) {
    return (
      <div className="fixed inset-0 flex flex-col animate-in fade-in duration-700">
        <img
          src={onboardingHero}
          alt="Serene sunset meditation"
          className="absolute inset-0 h-full w-full object-cover blur-[6px] scale-105"
          width={960}
          height={1920}
        />
        {/* Gradient overlay with glass feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-accent/20 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/15 via-transparent to-transparent" />


        {/* Bottom content */}
        <div className="relative z-10 mt-auto px-6 pb-28">
          <p className="text-sm font-medium tracking-widest uppercase text-white/70 mb-3">Beat Beat</p>
          <h1 className="font-display text-[2.2rem] font-bold leading-[1.15] text-white">
            Monitor your<br />heart <em className="font-serif italic text-white/80">health</em>
          </h1>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            Pulse Check utilizes advanced ML algorithms to detect subtle cardiac patterns, providing clinical-grade health insights from the palm of your hand.
          </p>

          {/* Auth + Skip */}
          <div className="mt-8 space-y-3">
            <Button
              className="w-full rounded-full text-base font-semibold py-6 gap-3 bg-white text-black hover:bg-white/90"
              onClick={handleGoogle}
              disabled={authLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-full text-base font-medium py-6 border-white/20 text-white hover:bg-white/10 hover:text-white gap-2"
              onClick={() => setStep('email-auth')}
            >
              <Mail className="h-4 w-4" />
              Sign in with Email
            </Button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-white/60 hover:text-white/90 py-2 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  {/* Email Auth Step */}
  if (step === 'email-auth') {
    return (
      <div className="fixed inset-0 flex flex-col animate-in fade-in duration-500 bg-background">
        <div className="flex flex-col flex-1 px-6 pt-12 pb-8">
          <button
            onClick={() => setStep(0)}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back
          </button>

          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            {isLogin ? 'Welcome\nback.' : 'Create your\naccount.'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {isLogin ? 'Sign in to access your heart health data.' : 'Join Beat Beat for clinical-grade cardiac insights.'}
          </p>

          <form onSubmit={handleEmailAuth} className="mt-8 space-y-4 flex-1">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl border-0 bg-muted/50 pl-11 text-base"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 rounded-2xl border-0 bg-muted/50 pl-11 text-base"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={authLoading}
              className="w-full rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
            >
              {authLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-foreground underline underline-offset-2"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <button
            onClick={() => setStep(1)}
            className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-28 pt-6 relative overflow-hidden bg-background">
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

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="flex flex-1 flex-col animate-in slide-in-from-right duration-300">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight text-center">
            How old<br /><em className="font-serif italic text-muted-foreground">are you?</em>
          </h1>

          <div className="mt-6 flex-1 space-y-8">
            {/* Age Dial */}
            <AgeDialSelector
              value={settings.age}
              onChange={age => setSettings({ ...settings, age })}
            />

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
            ].map(({ num, text }, i) => (
              <div
                key={num}
                className="flex gap-4 items-start opacity-0 animate-fade-in"
                style={{ animationDelay: `${(i + 1) * 300}ms`, animationFillMode: 'forwards' }}
              >
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
