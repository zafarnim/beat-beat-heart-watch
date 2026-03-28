import { HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSendToKry: () => void;
  onDone: () => void;
}

const InconclusiveResult = ({ onSendToKry, onDone }: Props) => (
  <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/40">
      <HelpCircle className="h-12 w-12 text-muted-foreground" />
    </div>
    <h2 className="font-display text-3xl font-bold text-foreground">Needs Professional Review</h2>
    <p className="text-sm text-muted-foreground">
      We detected some patterns that require a professional assessment. This doesn't necessarily mean something is wrong — a doctor can give you clarity.
    </p>
    <Button
      size="lg"
      variant="outline"
      className="w-full rounded-full font-semibold py-6"
      onClick={onSendToKry}
    >
      <Send className="mr-2 h-4 w-4" /> Send to Kry for Review
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

export default InconclusiveResult;
