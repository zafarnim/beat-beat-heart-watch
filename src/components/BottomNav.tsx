import { Home, SettingsIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/scan') return null;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card/20 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-2xl safe-bottom w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
