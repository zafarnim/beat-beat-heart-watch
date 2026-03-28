import { Home, Clock, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface BottomNavProps {
  visible?: boolean;
}

const BottomNav = ({ visible = true }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/scan' || location.pathname === '/auth') return null;

  return (
    <nav
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-full safe-bottom w-auto px-2 transition-all duration-500 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-around py-2 px-4 gap-2">
        {navItems.map(({ icon: Icon, label, path }) => {
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
