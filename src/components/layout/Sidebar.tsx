import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Logo } from '../ui/Logo';
import type { NavSection } from './nav';

function isInSection(section: NavSection, path: string) {
  const targets = section.to ? [section.to] : (section.links ?? []).map((l) => l.to);
  return targets.some((t) => path === t || path.startsWith(t + '/'));
}

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const { can } = useAuth();
  const { pathname } = useLocation();
  const allowed = (perms?: Parameters<typeof can>) => !perms || perms.length === 0 || can(...perms);

  return (
    <aside className="flex w-68 shrink-0 flex-col bg-gradient-to-b from-brand-700 to-brand-900 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        {/* white chip so a red logo stays visible on the red sidebar */}
        <div className="flex h-10 items-center rounded-lg bg-white px-3">
          <Logo className="h-7 max-w-32" />
        </div>
        <p className="text-xs text-white/80">HR Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {sections.filter((s) => allowed(s.perms)).map((section) => {
          const Icon = section.icon;
          const active = isInSection(section, pathname);
          const links = (section.links ?? []).filter((l) => allowed(l.perms));

          const heading = section.group && (
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-white/50">{section.group}</p>
          );

          if (section.to) {
            return (
              <div key={section.label}>
              {heading}
              <RouterLink to={section.to}
                className={({ isActive }) => clsx('flex items-center gap-3 rounded-lg px-3 py-2', isActive ? 'bg-white/15 font-medium' : 'text-white/80 hover:bg-white/10')}>
                <Icon className="h-4 w-4" /> {section.label}
              </RouterLink>
              </div>
            );
          }
          if (links.length === 0) return null;
          return (
            <div key={section.label}>
              {heading}
              {/* only the section you're in stays open */}
              <RouterLink to={links[0].to}
                className={clsx('flex items-center gap-3 rounded-lg px-3 py-2', active ? 'bg-white/15 font-medium' : 'text-white/80 hover:bg-white/10')}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{section.label}</span>
                <ChevronDown className={clsx('h-4 w-4 transition', active ? 'rotate-180' : 'opacity-60')} />
              </RouterLink>
              {active && (
                <div className="ml-7 mt-1 space-y-0.5 border-l border-white/15 pl-3">
                  {links.map((l) => (
                    <RouterLink key={l.to} to={l.to} end
                      className={({ isActive }) => clsx('block rounded-md px-2 py-1.5', isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white')}>
                      {l.label}
                    </RouterLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
