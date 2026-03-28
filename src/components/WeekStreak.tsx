import { useMemo } from 'react';
import { Check, Zap } from 'lucide-react';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface WeekStreakProps {
  scanDates: string[];
}

const WeekStreak = ({ scanDates }: WeekStreakProps) => {
  const { weekData, streakCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scanDateSet = new Set(
      scanDates.map(d => {
        const date = new Date(d);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );

    // Build 7 days starting from today
    const weekData = DAY_LABELS_FULL.map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isToday = i === 0;
      const completed = scanDateSet.has(key);
      const dayIdx = date.getDay(); // 0=Sun
      const label = DAY_LABELS_FULL[dayIdx === 0 ? 6 : dayIdx - 1];
      return { label, completed, isToday, isFuture: i > 0 };
    });

    // Streak = consecutive completed days starting from today
    let streak = 0;
    for (let i = 0; i < weekData.length; i++) {
      if (weekData[i].completed) streak++;
      else break;
    }

    return { weekData, streakCount: streak };
  }, [scanDates]);

  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-primary-foreground/60">
          Weekly Streak
        </span>
        {streakCount > 0 && (
          <span className="text-xs font-bold text-primary-foreground/80">
            {streakCount} day{streakCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {weekData.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            {/* Circle */}
            <div
              className={`relative flex items-center justify-center rounded-full h-10 w-10 transition-all ${
                day.completed
                  ? 'bg-primary-foreground/50'
                  : day.isToday
                    ? 'bg-primary-foreground/15 ring-2 ring-primary-foreground/30'
                    : day.isFuture
                      ? 'bg-primary-foreground/8'
                      : 'bg-primary-foreground/15'
              }`}
            >
              {day.completed ? (
                <Check className="h-4.5 w-4.5 text-white" strokeWidth={3} />
              ) : day.isToday ? (
                <Zap className="h-4 w-4 text-primary-foreground/60" strokeWidth={2} />
              ) : null}
            </div>
            {/* Label */}
            <span className={`text-[9px] font-bold tracking-wide ${
              day.isToday
                ? 'text-primary-foreground'
                : day.completed
                  ? 'text-primary-foreground/70'
                  : 'text-primary-foreground/35'
            }`}>
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekStreak;
