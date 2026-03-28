import { useState, useEffect } from 'react';
import { Heart, ChevronRight, CheckCircle2, Play, Bell, AlertTriangle, HelpCircle } from 'lucide-react';
import kryLogo from '@/assets/kry-logo.png';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ScanRecord, ScanResultType } from '@/lib/types';

interface ScanWithAudio extends ScanRecord {
  file_url?: string | null;
}

const resultConfig: Record<ScanResultType, { label: string; labelClass: string; iconClass: string; icon: typeof Heart }> = {
  normal: { label: 'HEALTHY', labelClass: 'bg-success/15 text-success', iconClass: 'bg-success/15 text-success', icon: Heart },
  clear_classification: { label: 'DETECTED', labelClass: 'bg-warning/15 text-warning', iconClass: 'bg-warning/15 text-warning', icon: AlertTriangle },
  inconclusive: { label: 'REVIEW', labelClass: 'bg-accent text-muted-foreground', iconClass: 'bg-accent text-muted-foreground', icon: HelpCircle },
  emergency: { label: 'ACTION REQUIRED', labelClass: 'bg-destructive/15 text-destructive', iconClass: 'bg-destructive/15 text-destructive', icon: AlertTriangle },
  try_again: { label: 'RETRY', labelClass: 'bg-muted text-muted-foreground', iconClass: 'bg-muted text-muted-foreground', icon: HelpCircle },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanWithAudio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    const { data, error } = await supabase
      .from('scans')
      .select('*, recordings(file_url)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped: ScanWithAudio[] = (data as any[]).map(row => ({
        id: row.id,
        recording_id: row.recording_id,
        result: row.result,
        result_title: row.result_title,
        result_description: row.result_description,
        condition_name: row.condition_name,
        recommended_steps: row.recommended_steps,
        created_at: row.created_at,
        sent_to_kry: row.sent_to_kry,
        file_url: row.recordings?.file_url ?? null,
      }));
      setScans(mapped);
    }
    setLoading(false);
  };

  const sendToKry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('scans').update({ sent_to_kry: true }).eq('id', id);
    setScans(prev => prev.map(s => s.id === id ? { ...s, sent_to_kry: true } : s));
    toast.success('Scan sent to Kry for review');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + `, ${time}`;
  };

  return (
    <div className="flex flex-col pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/60 flex items-center justify-center">
            <Heart className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Beat Beat</h1>
        </div>
        <button className="h-10 w-10 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Hero CTA Card */}
      <div className="px-5 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground p-6 pb-7">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--accent)) 0%, transparent 60%)',
          }} />
          <div className="relative z-10">
            <p className="text-xs tracking-widest uppercase text-primary-foreground/60 mb-3">Heart Health Monitoring</p>
            <h2 className="font-display text-2xl font-bold text-primary-foreground leading-tight">
              Ready for your<br />daily check?
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/70">
              Place your finger on the camera lens for a 15-second heart rate and rhythm analysis.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-5 rounded-full px-6 font-semibold"
              onClick={() => navigate('/scan')}
            >
              <Heart className="mr-2 h-4 w-4" />
              Start Scan
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Recent Activity</h2>
          {scans.length > 3 && (
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">View All</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 py-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">No scans yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.map(scan => {
              const config = resultConfig[scan.result];
              const Icon = config.icon;
              return (
                <div
                  key={scan.id}
                  className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{scan.result_title}</span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${config.labelClass}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(scan.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {scan.result !== 'try_again' && (
                      <button
                        onClick={(e) => sendToKry(scan.id, e)}
                        disabled={scan.sent_to_kry}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                          scan.sent_to_kry ? 'text-success' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {scan.sent_to_kry ? <CheckCircle2 className="h-4 w-4" /> : <img src={kryLogo} alt="Kry" className="h-5 w-5 rounded" />}
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
