// src/components/layout/MobileNav.tsx
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { X, Search, Bookmark, History as HistoryIcon, Settings } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useUIStore } from '@/stores/uiStore';

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

export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const close = useUIStore((s) => s.closeMobileNav);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={close}
        className={clsx(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-bg-primary shadow-card transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-mono text-sm font-semibold">RugShield</span>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={close}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-bg-secondary text-text-primary'
                        : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
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
      </div>
    </>
  );
}