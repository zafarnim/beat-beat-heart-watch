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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/20 backdrop-blur-2xl border-t border-white/15 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
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
