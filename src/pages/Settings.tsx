import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, LogOut, Mail, Lock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getSettings, saveSettings, clearAllData } from '@/lib/storage';
import { requestNotificationPermission } from '@/lib/anomaly';
import { UserSettings } from '@/lib/types';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(() => getSettings());
  const [cleared, setCleared] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const update = (partial: Partial<UserSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  const handleNotifToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      update({ notificationsEnabled: granted });
    } else {
      update({ notificationsEnabled: false });
    }
  };

  const handleClear = () => {
    if (confirm('This will delete all your data and settings. Are you sure?')) {
      clearAllData();
      setCleared(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in successfully!');
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
    if (error) toast.error("Google sign-in failed.");
  };

  return (
    <div className="flex flex-col px-5 pb-28 pt-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      {/* Account Section */}
      {!session ? (
        <Card className="mt-5 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">Sign in to sync your data across devices.</p>
            
            <Button
              className="w-full rounded-full text-sm font-medium py-5 gap-3"
              variant="outline"
              onClick={handleGoogle}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border-0 bg-muted/50 pl-10 text-sm" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-12 rounded-xl border-0 bg-muted/50 pl-10 text-sm" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full rounded-full text-sm font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-5">
                {authLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-foreground underline underline-offset-2">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-5 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{session.user.email}</span></p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Age</Label>
            <Input
              type="number"
              value={settings.age}
              onChange={e => update({ age: Number(e.target.value) })}
              min={1} max={120}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Push Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified about scan results</p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotifToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-0 shadow-sm border-destructive/20">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full rounded-full"
            onClick={handleClear}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {cleared ? 'Cleared!' : 'Clear All Data'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            This will permanently delete all settings.
          </p>
        </CardContent>
      </Card>

      {session && (
        <Card className="mt-4 border-0 shadow-sm">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
