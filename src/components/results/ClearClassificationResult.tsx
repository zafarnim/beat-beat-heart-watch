import { Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import kryLogo from '@/assets/kry-logo.png';

interface Props {
  conditionName: string;
  description: string;
  steps: string;
  onSendToKry: () => void;
  onDone: () => void;
}

const ClearClassificationResult = ({ conditionName, description, steps, onSendToKry, onDone }: Props) => (
  <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-warning/15">
      <Activity className="h-12 w-12 text-warning" />
    </div>
    <h2 className="font-display text-3xl font-bold text-foreground">{conditionName}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>

    <div className="w-full rounded-2xl bg-accent/30 p-5 text-left">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/60">
          <FileText className="h-5 w-5 text-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">Recommended Next Steps</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{steps}</p>
    </div>

    <Button size="lg" variant="outline" className="w-full rounded-full font-semibold py-6" onClick={onSendToKry}>
      <Send className="mr-2 h-4 w-4" /> Send to Kry
    </Button>
    <Button
      size="lg"
      className="w-full rounded-full font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
      onClick={onDone}
    >
      Back to Home
    </Button>
  </div>
);

export default ClearClassificationResult;
