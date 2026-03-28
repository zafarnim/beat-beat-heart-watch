import { useState, useEffect, useMemo } from 'react';
import { Heart, ChevronRight, CheckCircle2, Play, AlertTriangle, HelpCircle, Hospital, Settings, Circle, CheckCircle } from 'lucide-react';
import WeekStreak from '@/components/WeekStreak';
import kryLogo from '@/assets/kry-logo.png';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ScanRecord, ScanResultType } from '@/lib/types';

interface ScanWithAudio extends ScanRecord {
  file_url?: string | null;
}

interface RecommendedStep {
  scanId: string;
  stepIndex: number;
  text: string;
  conditionName: string;
  date: string;
}

const COMPLETED_STEPS_KEY = 'beatbeat_completed_steps';

const getCompletedSteps = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_STEPS_KEY) || '[]');
  } catch { return []; }
};

const toggleCompletedStep = (key: string): string[] => {
  const completed = getCompletedSteps();
  const updated = completed.includes(key)
    ? completed.filter(k => k !== key)
    : [...completed, key];
  localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(updated));
  return updated;
};

const resultConfig: Record<ScanResultType, { label: string; labelClass: string; iconClass: string; icon: typeof Heart }> = {
  normal: { label: 'HEALTHY', labelClass: 'badge-gradient text-success', iconClass: 'bg-success/15 text-success', icon: Heart },
  clear_classification: { label: 'DETECTED', labelClass: 'badge-gradient text-warning', iconClass: 'bg-warning/15 text-warning', icon: AlertTriangle },
  inconclusive: { label: 'REVIEW', labelClass: 'badge-gradient text-muted-foreground', iconClass: 'bg-accent text-muted-foreground', icon: HelpCircle },
  emergency: { label: 'ACTION REQUIRED', labelClass: 'badge-gradient text-destructive', iconClass: 'bg-destructive/15 text-destructive', icon: AlertTriangle },
  try_again: { label: 'RETRY', labelClass: 'badge-gradient text-muted-foreground', iconClass: 'bg-muted text-muted-foreground', icon: HelpCircle },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanWithAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>(getCompletedSteps);

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

  const recommendedSteps = useMemo<RecommendedStep[]>(() => {
    const seen = new Set<string>();
    const steps: RecommendedStep[] = [];
    scans
      .filter(s => s.result === 'clear_classification' && s.recommended_steps)
      .forEach(scan => {
        const lines = scan.recommended_steps!
          .split(/\n|;|(?:\d+\.\s)/)
          .map(l => l.trim())
          .filter(l => l.length > 0);
        lines.forEach((text, i) => {
          const normalized = text.toLowerCase();
          if (seen.has(normalized)) return;
          seen.add(normalized);
          steps.push({
            scanId: scan.id,
            stepIndex: i,
            text,
            conditionName: scan.condition_name || 'Detected condition',
            date: scan.created_at,
          });
        });
      });
    return steps;
  }, [scans]);

  const visibleSteps = useMemo(() => {
    return recommendedSteps.filter(s => !completedSteps.includes(s.text.toLowerCase()));
  }, [recommendedSteps, completedSteps]);

  const handleToggleStep = (text: string) => {
    const key = text.toLowerCase();
    const updated = toggleCompletedStep(key);
    setCompletedSteps(updated);
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
        <div className="w-10" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/60 flex items-center justify-center">
            <Heart className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Beat Beat</h1>
        </div>
        <div className="w-10" />
      </div>


      {/* Hero CTA Card */}
      <div className="px-5 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground p-6 pb-7">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--accent)) 0%, transparent 60%)',
          }} />
          <div className="relative z-10">
            <p className="text-xs tracking-widest uppercase text-primary-foreground/60 mb-3">Heart Health Monitoring</p>
            <div className="mb-4">
              <WeekStreak scanDates={scans.map(s => s.created_at)} />
            </div>
            <h2 className="font-display text-2xl font-bold text-primary-foreground leading-tight">
              Ready for your<br />daily check?
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/70">
              Put the phone near your heart to record your heart rate.
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

      {/* Recommended Steps */}
      {visibleSteps.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="font-display text-lg font-bold text-foreground">Next Steps</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {recommendedSteps.length - visibleSteps.length}/{recommendedSteps.length} done
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {visibleSteps.map((step) => (
              <button
                key={`${step.scanId}_${step.stepIndex}`}
                onClick={() => handleToggleStep(step.text)}
                className="flex-shrink-0 w-48 rounded-xl px-3.5 py-3 text-left transition-all bg-muted/30 border border-transparent hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground">
                    {step.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Recent Activity</h2>
          {scans.length > 3 && (
            <button onClick={() => navigate('/history')} className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">View All</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 py-16 text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-accent/40 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">No scans yet</h3>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Record your first heartbeat scan to see your heart health insights here.
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-full px-6"
              onClick={() => navigate('/scan')}
            >
              <Heart className="mr-2 h-4 w-4" />
              Start Your First Scan
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.slice(0, 3).map(scan => {
              const config = resultConfig[scan.result];
              const Icon = config.icon;
              return (
                <div
                  key={scan.id}
                  onClick={() => navigate(`/scan/${scan.id}`)}
                  className="flex items-start gap-3 rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full mt-0.5 ${config.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{scan.result_title}</span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full translate-y-[2px] ${config.labelClass}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(scan.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {scan.result !== 'try_again' && (
                      <button
                        onClick={(e) => sendToKry(scan.id, e)}
                        disabled={scan.sent_to_kry}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors translate-y-px ${
                          scan.sent_to_kry ? 'text-success' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {scan.sent_to_kry ? <CheckCircle2 className="h-4 w-4" /> : <Hospital className="h-5 w-5" />}
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
