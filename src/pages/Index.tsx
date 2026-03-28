import { useState } from 'react';
import { getSettings } from '@/lib/storage';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';

const Index = () => {
  const [onboarded, setOnboarded] = useState(() => getSettings().onboarded);

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return <Dashboard />;
};

export { Index as default };
export { type FC } from 'react';

// Re-export onboarded state for BottomNav visibility
export const useOnboardedState = () => {
  return getSettings().onboarded;
};
