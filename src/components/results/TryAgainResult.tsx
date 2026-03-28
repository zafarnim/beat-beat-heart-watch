import { RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TryAgainResult = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/40">
      <Volume2 className="h-12 w-12 text-muted-foreground" />
    </div>
    <h2 className="font-display text-3xl font-bold text-foreground">Let's Try Again</h2>
    <p className="text-sm text-muted-foreground">We couldn't get a clear reading. Here's what might help:</p>

    <div className="w-full rounded-2xl bg-muted/30 p-5 text-left space-y-2 text-sm text-muted-foreground">
      <p>• Find a quieter environment</p>
      <p>• Press your phone firmly against your chest</p>
      <p>• Stay as still as possible during the scan</p>
      <p>• Make sure your microphone isn't blocked</p>
    </div>

    <Button
      size="lg"
      className="w-full rounded-full font-semibold bg-gradient-to-r from-muted-foreground to-foreground text-primary-foreground py-7"
      onClick={onRetry}
    >
      <RefreshCw className="mr-2 h-4 w-4" /> Try Again
    </Button>
  </div>
);

export default TryAgainResult;
