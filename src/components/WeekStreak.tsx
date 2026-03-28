import { useMemo } from 'react';
import { Heart } from 'lucide-react';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeekStreakProps {
  scanDates: string[]; // ISO date strings of scans
}

const WeekStreak = ({ scanDates }: WeekStreakProps) => {
  const { weekData, streakCount } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
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

    const weekData = DAYS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;
      const completed = scanDateSet.has(key);
      return { label, completed, isToday, isFuture };
    });

    // Count consecutive days from today backwards
    let streak = 0;
    const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    for (let i = todayIdx; i >= 0; i--) {
      if (weekData[i].completed) streak++;
      else break;
    }

    return { weekData, streakCount: streak };
  }, [scanDates]);

  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-primary-foreground/60">
            Weekly Streak
          </span>
        </div>
        {streakCount > 0 && (
          <span className="text-xs font-bold text-primary-foreground/80">
            🔥 {streakCount} day{streakCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {weekData.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-medium ${
              day.isToday ? 'text-primary-foreground' : 'text-primary-foreground/40'
            }`}>
              {day.label}
            </span>
            <div className="relative">
              {day.completed ? (
                <Heart
                  className="h-7 w-7 text-accent"
                  fill="hsl(261 30% 86%)"
                  strokeWidth={0}
                />
              ) : (
                <Heart
                  className={`h-7 w-7 ${
                    day.isFuture
                      ? 'text-primary-foreground/15'
                      : 'text-primary-foreground/25'
                  }`}
                  strokeWidth={1.5}
                />
              )}
              {day.isToday && !day.completed && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekStreak;
