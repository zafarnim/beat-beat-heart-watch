import { useState, useEffect } from 'react';
import { Heart, ChevronDown, ChevronUp, Send, CheckCircle2, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ScanRecord, ScanResultType } from '@/lib/types';

interface ScanWithAudio extends ScanRecord {
  file_url?: string | null;
}

const resultStyles: Record<ScanResultType, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'bg-success/15 text-success border-success/30' },
  clear_classification: { label: 'Detected', className: 'bg-warning/15 text-warning border-warning/30' },
  inconclusive: { label: 'Review Needed', className: 'bg-muted text-muted-foreground border-border' },
  emergency: { label: 'Urgent', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  try_again: { label: 'Retry', className: 'bg-muted text-muted-foreground border-border' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanWithAudio[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
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

  const sendToKry = async (id: string) => {
    await supabase.from('scans').update({ sent_to_kry: true }).eq('id', id);
    setScans(prev => prev.map(s => s.id === id ? { ...s, sent_to_kry: true } : s));
    toast.success('Scan sent to Kry (mock)');
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beat Beat</h1>
          <p className="text-sm text-muted-foreground">Your heart, at a glance</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/50">
          <Heart className="h-5 w-5 text-foreground" />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full rounded-2xl py-8 text-lg font-bold shadow-md"
        onClick={() => navigate('/scan')}
      >
        <Heart className="mr-2 h-6 w-6" />
        Start Scan
      </Button>

      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">Scan History</h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <Card className="mt-3 border-0">
            <CardContent className="py-8 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No scans yet. Start your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {scans.map(scan => {
              const style = resultStyles[scan.result];
              const isExpanded = expanded === scan.id;
              return (
                <Card key={scan.id} className="border-0 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : scan.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={style.className}>{style.label}</Badge>
                        <span className="text-sm font-medium text-foreground">{scan.result_title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-sm text-muted-foreground">{scan.result_description}</p>
                        {scan.condition_name && (
                          <p className="text-sm"><strong className="text-foreground">Condition:</strong> {scan.condition_name}</p>
                        )}
                        {scan.recommended_steps && (
                          <p className="text-sm"><strong className="text-foreground">Next steps:</strong> {scan.recommended_steps}</p>
                        )}

                        {/* Audio playback */}
                        {scan.file_url && (
                          <div className="rounded-lg bg-background p-3" onClick={e => e.stopPropagation()}>
                            <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              <Play className="h-3 w-3" /> Recording
                            </p>
                            <audio controls src={scan.file_url} className="w-full" />
                          </div>
                        )}

                        {scan.result !== 'try_again' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={scan.sent_to_kry}
                            onClick={e => { e.stopPropagation(); sendToKry(scan.id); }}
                          >
                            {scan.sent_to_kry ? (
                              <><CheckCircle2 className="mr-1 h-3 w-3" /> Sent to Kry</>
                            ) : (
                              <><Send className="mr-1 h-3 w-3" /> Send to Kry</>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
