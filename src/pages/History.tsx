import { useState, useMemo } from 'react';
import { ArrowLeft, Heart, AlertTriangle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getReadings } from '@/lib/storage';
import { HeartRateReading } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getSettings } from '@/lib/storage';
import { format } from 'date-fns';

type Period = '7d' | '30d' | '90d' | 'all';

const History = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('7d');
  const readings = getReadings();
  const settings = getSettings();

  const filtered = useMemo(() => {
    if (period === 'all') return [...readings].reverse();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return readings.filter(r => new Date(r.timestamp) >= cutoff).reverse();
  }, [readings, period]);

  const chartData = filtered.map(r => ({
    time: format(new Date(r.timestamp), 'MMM d'),
    bpm: r.bpm,
    status: r.status,
  }));

  const statusIcons = {
    normal: Heart,
    elevated: Activity,
    anomaly: AlertTriangle,
  };

  const statusColors = {
    normal: 'bg-success/10 text-success',
    elevated: 'bg-warning/10 text-warning',
    anomaly: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="flex flex-col px-5 pb-28 pt-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground">History & Trends</h1>

      {/* Period Selector */}
      <div className="mt-4 flex gap-2">
        {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => setPeriod(p)}
          >
            {p === 'all' ? 'All' : p}
          </Button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 ? (
        <Card className="mt-5 border-0 shadow-sm">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: 13,
                  }}
                />
                <ReferenceLine y={settings.restingBpmHigh} stroke="hsl(var(--warning))" strokeDasharray="4 4" />
                <ReferenceLine y={settings.restingBpmLow} stroke="hsl(var(--warning))" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.status === 'anomaly') {
                      return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="hsl(var(--destructive))" />;
                    }
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-5 border-0">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Not enough data to show a chart yet.
          </CardContent>
        </Card>
      )}

      {/* Readings List */}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No readings in this period.</p>
        )}
        {[...filtered].reverse().map(r => {
          const Icon = statusIcons[r.status];
          return (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusColors[r.status]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold text-foreground">{r.bpm}</span>
                    <span className="text-xs text-muted-foreground">BPM</span>
                  </div>
                  {r.note && <p className="text-xs text-muted-foreground italic">"{r.note}"</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.timestamp), 'MMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.timestamp), 'h:mm a')}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default History;
