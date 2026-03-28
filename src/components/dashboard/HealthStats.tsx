import { Heart, HeartPulse } from 'lucide-react';
import { useMemo } from 'react';

interface ScanStat {
  bpm?: number | null;
  hrv_ms?: number | null;
  created_at: string;
}

interface HealthStatsProps {
  scans: ScanStat[];
}

const HealthStats = ({ scans }: HealthStatsProps) => {
  const stats = useMemo(() => {
    const withBpm = scans.filter(s => s.bpm != null);
    const withHrv = scans.filter(s => s.hrv_ms != null);

    if (withBpm.length === 0 && withHrv.length === 0) return null;

    // Latest BPM
    const latestBpm = withBpm.length > 0 ? Math.round(withBpm[0].bpm!) : null;


    // Latest HRV
    const latestHrv = withHrv.length > 0 ? Math.round(withHrv[0].hrv_ms!) : null;
    const hrvStatus = latestHrv != null
      ? latestHrv >= 50 ? 'Good' : 'Needs rest'
      : null;
    const hrvStatusClass = latestHrv != null
      ? latestHrv >= 50 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      : '';

    return { latestBpm, latestHrv, hrvStatus, hrvStatusClass };
  }, [scans]);

  const hasData = stats && (stats.latestBpm != null || stats.latestHrv != null);

  return (
    <div className="grid grid-cols-2 gap-3 px-5 mb-8">
      {/* Latest BPM */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Heart Rate</span>
        </div>
        {hasData && stats.latestBpm != null ? (
          <>
            <p className="text-xs text-muted-foreground mb-0.5">Latest</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{stats.latestBpm}</span>
              <span className="text-sm text-muted-foreground">BPM</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground/40 mb-0.5">Latest</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-muted-foreground/30">--</span>
              <span className="text-sm text-muted-foreground/30">BPM</span>
            </div>
          </>
        )}
      </div>

      {/* Latest HRV */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Latest HRV</span>
        </div>
        {hasData && stats.latestHrv != null ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{stats.latestHrv}</span>
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
            <span className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${stats.hrvStatusClass}`}>
              {stats.hrvStatus}
            </span>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-muted-foreground/30">--</span>
              <span className="text-sm text-muted-foreground/30">ms</span>
            </div>
            <span className="inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground/40">
              No data
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default HealthStats;
