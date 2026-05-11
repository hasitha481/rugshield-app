// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Search, Bookmark, History as HistoryIcon, Settings } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Scanner', icon: Search, end: true },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark, end: false },
  { to: '/history', label: 'History', icon: HistoryIcon, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-bg-primary md:flex">
      <nav className="flex-1 px-3 py-6">
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Workspace
        </div>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-accent-violet bg-bg-secondary text-text-primary'
                      : 'border-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t px-5 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Status
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-text-primary">
          <span className="h-2 w-2 rounded-full bg-accent-green animate-pulse-soft" />
          Birdeye + DFlow online
        </div>
      </div>
    </aside>
  );
}