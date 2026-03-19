import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useModelStore } from '@/stores/useModelStore';

const links = [
  { to: '/generate', label: 'Generate' },
  { to: '/explain', label: 'Explain' },
  { to: '/models', label: 'Models' },
  { to: '/train', label: 'Train' },
  { to: '/config', label: 'Config' },
];

const Navbar = () => {
  // ✅ Fixed: was { connected, fetchHealth } — store uses backendOnline + checkHealth
  const { backendOnline, checkHealth } = useModelStore();
  const location = useLocation();

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 10000);
    return () => clearInterval(id);
  }, [checkHealth]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold tracking-tight text-foreground">HybridGen</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map((l) => {
          const active = location.pathname === l.to;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </NavLink>
          );
        })}
      </div>

      {/* Backend status dot */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`h-2 w-2 rounded-full ${
            backendOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className={backendOnline ? 'text-green-500' : 'text-red-500'}>
          {backendOnline ? 'Connected' : 'Offline'}
        </span>
      </div>
    </nav>
  );
};

export default Navbar;