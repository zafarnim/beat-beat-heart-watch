import { useMemo } from 'react';
import { Check, Zap } from 'lucide-react';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface WeekStreakProps {
  scanDates: string[];
}

const WeekStreak = ({ scanDates }: WeekStreakProps) => {
  const { weekData, streakCount } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const scanDateSet = new Set(
      scanDates.map(d => {
        const date = new Date(d);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );

    const weekData = DAY_LABELS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;
      const completed = scanDateSet.has(key);
      return { label, completed, isToday, isFuture };
    });

    let streak = 0;
    for (let i = todayIdx; i >= 0; i--) {
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
