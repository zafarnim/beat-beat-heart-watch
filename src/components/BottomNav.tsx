import { Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/scan') return null;

  const active = location.pathname === '/';

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-full safe-bottom w-auto px-2">
      <div className="flex items-center justify-around py-2 px-4">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
            active ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;