import { Heart, Bell, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onDone: () => void;
  bpm?: number;
  variability?: number;
}

const NormalResult = ({ onDone, bpm = 72, variability = 58 }: Props) => (
  <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
    {/* Icon */}
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/40 shadow-sm">
      <Heart className="h-10 w-10 text-foreground" />
    </div>

    {/* Title */}
    <div className="text-center">
      <h2 className="font-display text-3xl font-bold text-foreground">Normal Rhythm</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Your heart rhythm appears normal. This reading indicates a stable cardiovascular state at this moment.
      </p>
    </div>

    {/* Heart Rate */}
    <div className="w-full pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Heart Rate</span>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-4xl font-bold text-foreground">
        {bpm} <span className="text-lg font-medium text-muted-foreground">BPM</span>
      </p>
      <p className="text-sm text-muted-foreground mt-1">Within optimal range</p>
    </div>

    {/* Variability */}
    <div className="w-full pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Variability</span>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-4xl font-bold text-foreground">
        {variability} <span className="text-lg font-medium text-muted-foreground">ms</span>
      </p>
      <p className="text-sm text-muted-foreground mt-1">Good stress recovery</p>
    </div>

    {/* Clinical Summary */}
    <div className="w-full rounded-2xl bg-accent/30 p-5 mt-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/60">
          <FileText className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Clinical Summary</p>
          <p className="text-xs text-muted-foreground">Analysis generated via Beat Beat AI</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        No signs of atrial fibrillation or irregular patterns were detected during this 15-second capture.
        Your cardiovascular consistency is rated as <strong className="text-foreground">Excellent</strong> for your demographic profile.
      </p>
    </div>

    <Button
      size="lg"
      className="w-full rounded-full text-lg font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7 mt-2"
      onClick={onDone}
    >
      Back to Home
    </Button>
  </div>
);

export default NormalResult;
