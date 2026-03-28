import { useState } from 'react';
import { ArrowLeft, Trash2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getSettings, saveSettings, clearAllData } from '@/lib/storage';
import { requestNotificationPermission } from '@/lib/anomaly';
import { UserSettings } from '@/lib/types';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(() => getSettings());
  const [cleared, setCleared] = useState(false);

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

  return (
    <div className="flex flex-col px-5 pb-28 pt-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      <Card className="mt-5 border-0 shadow-sm">
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
    </div>
  );
};

export default Settings;
