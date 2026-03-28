import { Activity, HeartPulse } from 'lucide-react';
import { useMemo } from 'react';

interface HealthStatsProps {
  scanDates: string[];
}

// Generate deterministic mock BPM/HRV from scan dates for demo
const seedFromDate = (dateStr: string) => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const HealthStats = ({ scanDates }: HealthStatsProps) => {
  const stats = useMemo(() => {
    if (scanDates.length === 0) return null;

    const recentDates = scanDates.slice(0, 7);
    const bpms = recentDates.map(d => 58 + (seedFromDate(d) % 30)); // 58-87 range
    const avgBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);

    const latestHrv = 35 + (seedFromDate(recentDates[0]) % 40); // 35-74 range
    const prevBpms = scanDates.slice(7, 14).map(d => 58 + (seedFromDate(d) % 30));
    const prevAvg = prevBpms.length > 0
      ? Math.round(prevBpms.reduce((a, b) => a + b, 0) / prevBpms.length)
      : avgBpm;
    const bpmDiff = prevAvg !== 0 ? Math.round(((avgBpm - prevAvg) / prevAvg) * 100) : 0;

    const hrvStatus = latestHrv >= 50 ? 'Good' : 'Needs rest';
    const hrvStatusClass = latestHrv >= 50
      ? 'bg-success/10 text-success'
      : 'bg-destructive/10 text-destructive';

    return { avgBpm, bpmDiff, latestHrv, hrvStatus, hrvStatusClass };
  }, [scanDates]);

  return (
    <div className="grid grid-cols-2 gap-3 px-5 mb-8">
      {/* Weekly BPM */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Weekly BPM</span>
        </div>
        {stats ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{stats.avgBpm}</span>
              <span className="text-sm text-muted-foreground">avg</span>
            </div>
            <p className={`text-xs mt-1 ${stats.bpmDiff <= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.bpmDiff <= 0 ? '↓' : '↑'} {Math.abs(stats.bpmDiff)}% vs last week
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-muted-foreground/30">--</span>
              <span className="text-sm text-muted-foreground/30">avg</span>
            </div>
            <p className="text-xs mt-1 text-muted-foreground/40">No data yet</p>
          </>
        )}
      </div>

      {/* Latest HRV */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Latest HRV</span>
        </div>
        {stats ? (
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
