import { useState, useMemo } from 'react';
import { Heart, Plus, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getReadings, getSettings } from '@/lib/storage';
import { getAnomalyCountThisWeek } from '@/lib/anomaly';
import { HeartRateReading } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const statusConfig = {
  normal: { label: 'Normal', color: 'bg-success text-success-foreground', icon: Heart },
  elevated: { label: 'Elevated', color: 'bg-warning text-warning-foreground', icon: Activity },
  anomaly: { label: 'Anomaly', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [readings] = useState<HeartRateReading[]>(() => getReadings());
  const settings = getSettings();
  const anomalyCount = getAnomalyCountThisWeek();
  const lastReading = readings[0];

  const weekData = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return readings
      .filter(r => new Date(r.timestamp) >= weekAgo)
      .reverse()
      .map(r => ({ bpm: r.bpm, status: r.status }));
  }, [readings]);

  const config = lastReading ? statusConfig[lastReading.status] : null;
  const StatusIcon = config?.icon || Heart;

  return (
    <div className="flex flex-col gap-5 px-5 pb-28 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beat Beat</h1>
          <p className="text-sm text-muted-foreground">Your heart, at a glance</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Status Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-accent">
        <CardContent className="flex items-center gap-5 p-6">
          {lastReading ? (
            <>
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm">
                <div className="text-center">
                  <span className="font-display text-3xl font-bold text-foreground">{lastReading.bpm}</span>
                  <p className="text-xs text-muted-foreground">BPM</p>
                </div>
              </div>
              <div className="flex-1">
                <Badge className={config!.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {config!.label}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Last reading · {new Date(lastReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {lastReading.note && (
                  <p className="mt-1 text-xs text-muted-foreground italic">"{lastReading.note}"</p>
                )}
              </div>
            </>
          ) : (
            <div className="w-full py-4 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No readings yet. Log your first one!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">This Week</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {readings.filter(r => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(r.timestamp) >= weekAgo;
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">readings</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${anomalyCount > 0 ? 'bg-destructive/5' : ''}`}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Anomalies</p>
            <p className={`font-display text-2xl font-bold ${anomalyCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {anomalyCount}
            </p>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend */}
      {weekData.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">7-Day Trend</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={weekData}>
                <YAxis domain={['auto', 'auto']} hide />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.status === 'anomaly') {
                      return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--destructive))" />;
                    }
                    return <circle cx={cx} cy={cy} r={2} fill="hsl(var(--primary))" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* FAB */}
      <Button
        size="lg"
        className="fixed bottom-24 right-5 z-50 h-16 w-16 rounded-full shadow-lg shadow-primary/30"
        onClick={() => navigate('/log')}
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  );
};

export default Dashboard;
