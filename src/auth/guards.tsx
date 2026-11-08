import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { Permission } from '../lib/permissions';
import { FullPageSpinner } from '../components/ui/Spinner';
import Forbidden from '../pages/Forbidden';

// Pages inside need a signed-in user; otherwise go to /login and come back afterwards
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

// Hides a page from users without the permission. The backend checks again on every request,
// so this is for a clean screen, not for security.
export function RequirePermission({ any }: { any: Permission[] }) {
  const { can } = useAuth();
  return can(...any) ? <Outlet /> : <Forbidden />;
}

// "/" sends HR staff to the HR dashboard and everyone else to the employee home
export function HomeRedirect() {
  const { isHr } = useAuth();
  return <Navigate to={isHr ? '/dashboard' : '/home'} replace />;
}
