import { AlertTriangle, Phone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmergencyResult = ({ onDone }: { onDone: () => void }) => (
  <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-destructive/15 animate-pulse">
      <AlertTriangle className="h-14 w-14 text-destructive" />
    </div>
    <h2 className="font-display text-3xl font-bold text-destructive">Urgent: Seek Help Now</h2>
    <p className="text-sm text-muted-foreground">
      We detected a pattern that may require immediate medical attention. Please contact emergency services right away.
    </p>
    <Button
      size="lg"
      variant="destructive"
      className="w-full rounded-full text-lg font-bold py-7"
      onClick={() => window.open('tel:112')}
    >
      <Phone className="mr-2 h-5 w-5" /> Call Emergency Services
    </Button>
    <Button
      size="lg"
      variant="outline"
      className="w-full rounded-full font-semibold py-6"
      onClick={onDone}
    >
      <Share2 className="mr-2 h-4 w-4" /> Share Scan with Responders
    </Button>
  </div>
);

export default EmergencyResult;
