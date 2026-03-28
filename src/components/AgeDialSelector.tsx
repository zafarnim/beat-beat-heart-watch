import { useRef, useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface AgeDialSelectorProps {
  value: number;
  onChange: (age: number) => void;
  min?: number;
  max?: number;
}

const AgeDialSelector = ({ value, onChange, min = 1, max = 100 }: AgeDialSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const startValue = useRef(value);

  // Map age range to arc angle (-90° to 90° = semicircle)
  const ageToAngle = (age: number) => {
    const pct = (age - min) / (max - min);
    return -90 + pct * 180;
  };

  const angleToAge = (angle: number) => {
    const clamped = Math.max(-90, Math.min(90, angle));
    const pct = (clamped + 90) / 180;
    return Math.round(min + pct * (max - min));
  };

  const currentAngle = ageToAngle(value);

  // Generate tick marks
  const ticks = [];
  const tickAges = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  for (const age of tickAges) {
    if (age >= min && age <= max) {
      const angle = ageToAngle(age);
      ticks.push({ age, angle });
    }
  }

  const getAngleFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height; // bottom center
    const dx = clientX - centerX;
    const dy = centerY - clientY;
    return Math.atan2(dx, dy) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startAngle.current = getAngleFromEvent(e.clientX, e.clientY);
    startValue.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [value, getAngleFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const angle = getAngleFromEvent(e.clientX, e.clientY);
    const newAge = angleToAge(angle);
    if (newAge !== value) onChange(newAge);
  }, [value, onChange, getAngleFromEvent]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const radius = 160;
  const labelRadius = radius + 20;

  return (
    <div className="flex flex-col items-center">
      {/* Age display */}
      <div className="text-center mb-2">
        <span className="text-6xl font-bold tabular-nums text-foreground">{String(value).padStart(3, '0')}</span>
        <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">Years Old</p>
      </div>

      {/* Dial */}
      <div
        ref={containerRef}
        className="relative w-full h-44 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Needle / indicator at top center */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Plus className="h-4 w-4" />
          </div>
          <div className="w-px h-12 bg-foreground/60" />
        </div>

        {/* Arc with ticks */}
        <svg
          viewBox="-200 -10 400 210"
          className="w-full h-full"
          style={{ transform: `rotate(${-currentAngle}deg)`, transformOrigin: '50% 100%', transition: isDragging.current ? 'none' : 'transform 0.15s ease-out' }}
        >
          {/* Dotted arc */}
          <path
            d={`M ${-radius} 200 A ${radius} ${radius} 0 0 1 ${radius} 200`}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.4"
          />

          {/* Tick marks and labels */}
          {ticks.map(({ age, angle }) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = Math.cos(rad) * (radius - 8);
            const y1 = 200 + Math.sin(rad) * (radius - 8);
            const x2 = Math.cos(rad) * (radius + 4);
            const y2 = 200 + Math.sin(rad) * (radius + 4);
            const lx = Math.cos(rad) * labelRadius;
            const ly = 200 + Math.sin(rad) * labelRadius;
            const isActive = Math.abs(age - value) < 3;

            return (
              <g key={age}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isActive ? 0.8 : 0.3}
                />
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="10"
                  fontWeight={isActive ? 600 : 400}
                  opacity={isActive ? 1 : 0.5}
                  transform={`rotate(${angle}, ${lx}, ${ly})`}
                >
                  {String(age).padStart(3, '0')}
                </text>
              </g>
            );
          })}

          {/* Minor ticks every 5 years */}
          {Array.from({ length: Math.floor((max - min) / 5) + 1 }, (_, i) => min + i * 5).map(age => {
            if (tickAges.includes(age)) return null;
            const angle = ageToAngle(age);
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = Math.cos(rad) * (radius - 4);
            const y1 = 200 + Math.sin(rad) * (radius - 4);
            const x2 = Math.cos(rad) * (radius + 2);
            const y2 = 200 + Math.sin(rad) * (radius + 2);

            return (
              <line
                key={age}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                opacity="0.25"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default AgeDialSelector;
