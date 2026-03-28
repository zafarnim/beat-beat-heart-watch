import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, AlertTriangle, HelpCircle, CheckCircle2, Hospital, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import WaveformPlayer from '@/components/WaveformPlayer';
import { toast } from 'sonner';
import type { ScanResultType } from '@/lib/types';

interface ScanDetail {
  id: string;
  result: ScanResultType;
  result_title: string;
  result_description: string;
  condition_name: string | null;
  recommended_steps: string | null;
  created_at: string;
  sent_to_kry: boolean;
  file_url: string | null;
  duration_seconds: number | null;
}

const resultConfig: Record<ScanResultType, { label: string; labelClass: string; iconClass: string; icon: typeof Heart; color: string }> = {
  normal: { label: 'HEALTHY', labelClass: 'bg-success/15 text-success', iconClass: 'bg-success/20 text-success', icon: Heart, color: 'text-success' },
  clear_classification: { label: 'DETECTED', labelClass: 'bg-warning/15 text-warning', iconClass: 'bg-warning/20 text-warning', icon: AlertTriangle, color: 'text-warning' },
  inconclusive: { label: 'REVIEW', labelClass: 'bg-accent text-muted-foreground', iconClass: 'bg-accent text-muted-foreground', icon: HelpCircle, color: 'text-muted-foreground' },
  emergency: { label: 'ACTION REQUIRED', labelClass: 'bg-destructive/15 text-destructive', iconClass: 'bg-destructive/20 text-destructive', icon: AlertTriangle, color: 'text-destructive' },
  try_again: { label: 'RETRY', labelClass: 'bg-muted text-muted-foreground', iconClass: 'bg-muted text-muted-foreground', icon: HelpCircle, color: 'text-muted-foreground' },
};

const ScanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchScan = async () => {
      const { data, error } = await supabase
        .from('scans')
        .select('*, recordings(file_url, duration_seconds)')
        .eq('id', id)
        .single();

      if (!error && data) {
        setScan({
          id: data.id,
          result: data.result,
          result_title: data.result_title,
          result_description: data.result_description,
          condition_name: data.condition_name,
          recommended_steps: data.recommended_steps,
          created_at: data.created_at,
          sent_to_kry: data.sent_to_kry,
          file_url: (data as any).recordings?.file_url ?? null,
          duration_seconds: (data as any).recordings?.duration_seconds ?? null,
        });
      }
      setLoading(false);
    };
    fetchScan();
  }, [id]);

  const sendToKry = async () => {
    if (!scan) return;
    await supabase.from('scans').update({ sent_to_kry: true }).eq('id', scan.id);
    setScan({ ...scan, sent_to_kry: true });
    toast.success('Scan sent to Kry for review');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-muted-foreground">Scan not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>Go back</Button>
      </div>
    );
  }

  const config = resultConfig[scan.result];
  const Icon = config.icon;

  return (
    <div className="flex flex-col pb-28 pt-4 px-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-foreground transition hover:bg-muted/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground flex-1">Scan Details</h1>
      </div>

      {/* Result Hero */}
      <div className="rounded-3xl bg-muted/30 p-6 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconClass}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${config.labelClass}`}>
              {config.label}
            </span>
            <h2 className="font-display text-xl font-bold text-foreground mt-1.5">{scan.result_title}</h2>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{scan.result_description}</p>

        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">{formatDate(scan.created_at)}</p>
          {scan.duration_seconds != null && (
            <p className="text-xs text-muted-foreground mt-1">Duration: {Math.round(scan.duration_seconds)}s</p>
          )}
        </div>
      </div>

      {/* Condition */}
      {scan.condition_name && (
        <div className="rounded-3xl bg-muted/30 p-5 mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">Condition</p>
          <p className="text-base font-semibold text-foreground">{scan.condition_name}</p>
        </div>
      )}

      {/* Recommended Steps */}
      {scan.recommended_steps && (
        <div className="rounded-3xl bg-muted/30 p-5 mb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Recommended Steps</p>
          <p className="text-sm text-foreground leading-relaxed">{scan.recommended_steps}</p>
        </div>
      )}

      {/* Audio Player */}
      {scan.file_url && (
        <div className="mb-4">
          <WaveformPlayer audioUrl={scan.file_url} />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mt-2">
        {scan.result !== 'try_again' && (
          <Button
            onClick={sendToKry}
            disabled={scan.sent_to_kry}
            className="w-full rounded-full py-6 text-base font-semibold"
            variant={scan.sent_to_kry ? 'secondary' : 'default'}
          >
            {scan.sent_to_kry ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Sent to Kry
              </>
            ) : (
              <>
                <Hospital className="mr-2 h-5 w-5" />
                Send to Kry for Review
              </>
            )}
          </Button>
        )}

        {scan.result === 'try_again' && (
          <Button
            onClick={() => navigate('/scan')}
            className="w-full rounded-full py-6 text-base font-semibold"
          >
            <Heart className="mr-2 h-5 w-5" />
            Try Another Scan
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScanDetailPage;
