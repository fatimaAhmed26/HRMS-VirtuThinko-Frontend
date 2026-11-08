import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Repeat } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as notificationsApi from '../../api/notifications';
import { useAuth } from '../../auth/useAuth';

export type PortalView = 'hr' | 'employee';

export function Topbar({ view, onSwitchView }: { view: PortalView; onSwitchView?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // refresh the bell every minute
  const { data: unread = 0 } = useQuery({ queryKey: ['notifications', 'unread'], queryFn: notificationsApi.unreadCount, refetchInterval: 60_000 });

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-900/20 bg-brand-800 px-6 text-white">
      <p className="text-sm text-white/80">{view === 'hr' ? 'HR view' : 'Employee view'}</p>
      <div className="flex items-center gap-2">
        {onSwitchView && (
          <button onClick={onSwitchView} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-white/10">
            <Repeat className="h-4 w-4" /> {view === 'hr' ? 'Employee view' : 'HR view'}
          </button>
        )}
        <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-white/10" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-white px-1 text-center text-xs font-semibold text-brand-700">{unread > 99 ? '99+' : unread}</span>
          )}
        </Link>
        <div className="ml-2 border-l border-white/20 pl-4 text-right text-sm leading-tight">
          <p className="font-medium">{user?.username}</p>
          <p className="text-xs text-white/70">{user?.roles.join(', ')}</p>
        </div>
        <button onClick={handleLogout} className="rounded-lg p-2 hover:bg-white/10" aria-label="Sign out" title="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
