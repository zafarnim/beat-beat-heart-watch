import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, AlertTriangle, HelpCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScanResultType } from '@/lib/types';
import WaveformPlayer from '@/components/WaveformPlayer';

interface ScanRecord {
  id: string;
  recording_id: string | null;
  result: ScanResultType;
  result_title: string;
  result_description: string;
  condition_name: string | null;
  recommended_steps: string | null;
  created_at: string;
  sent_to_kry: boolean;
  file_url?: string | null;
}

const resultConfig: Record<ScanResultType, { label: string; labelClass: string; iconClass: string; icon: typeof Heart }> = {
  normal: { label: 'HEALTHY', labelClass: 'bg-success/15 text-success', iconClass: 'bg-success/15 text-success', icon: Heart },
  clear_classification: { label: 'DETECTED', labelClass: 'bg-warning/15 text-warning', iconClass: 'bg-warning/15 text-warning', icon: AlertTriangle },
  inconclusive: { label: 'REVIEW', labelClass: 'bg-accent text-muted-foreground', iconClass: 'bg-accent text-muted-foreground', icon: HelpCircle },
  emergency: { label: 'ACTION REQUIRED', labelClass: 'bg-destructive/15 text-destructive', iconClass: 'bg-destructive/15 text-destructive', icon: AlertTriangle },
  try_again: { label: 'RETRY', labelClass: 'bg-muted text-muted-foreground', iconClass: 'bg-muted text-muted-foreground', icon: HelpCircle },
};

const History = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      const { data, error } = await supabase
        .from('scans')
        .select('*, recordings(file_url)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: ScanRecord[] = (data as any[]).map(row => ({
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

    fetchScans();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Group scans by date
  const grouped = scans.reduce<Record<string, ScanRecord[]>>((acc, scan) => {
    const dateKey = new Date(scan.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(scan);
    return acc;
  }, {});

  return (
    <div className="flex flex-col pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 mb-6">
        <button onClick={() => navigate('/')} className="h-10 w-10 rounded-full flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">History</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 py-16 text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-accent/40 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">No recordings yet</h3>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Your scan history will appear here after your first recording.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateScans]) => (
              <div key={date}>
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">{date}</p>
                <div className="space-y-2">
                  {dateScans.map(scan => {
                    const config = resultConfig[scan.result];
                    const Icon = config.icon;
                    const time = new Date(scan.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={scan.id}
                        className="rounded-2xl bg-muted/30 transition-colors hover:bg-muted/50 cursor-pointer overflow-hidden"
                      >
                        <div
                          onClick={() => navigate(`/scan/${scan.id}`)}
                          className="flex items-center gap-3 p-4"
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
                            <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        {scan.file_url && (
                          <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                            <WaveformPlayer audioUrl={scan.file_url} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
