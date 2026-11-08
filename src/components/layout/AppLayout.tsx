import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { EMPLOYEE_NAV, HR_NAV } from './nav';
import { Sidebar } from './Sidebar';
import { Topbar, type PortalView } from './Topbar';

const VIEW_KEY = 'hrms.view';

// Remembers which view an HR user last used (wrapped in try/catch: storage can be blocked)
function readView(): PortalView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'employee' ? 'employee' : 'hr';
  } catch {
    return 'hr';
  }
}

export function AppLayout() {
  const { isHr } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<PortalView>(readView);
  const current: PortalView = isHr ? view : 'employee'; // employees and managers only have the employee view

  function switchView() {
    const next: PortalView = current === 'hr' ? 'employee' : 'hr';
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
    navigate(next === 'hr' ? '/dashboard' : '/home');
  }

  return (
    <div className="flex h-full">
      <Sidebar sections={current === 'hr' ? HR_NAV : EMPLOYEE_NAV} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar view={current} onSwitchView={isHr ? switchView : undefined} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
