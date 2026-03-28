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

export default Index;
