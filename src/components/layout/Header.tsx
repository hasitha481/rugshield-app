// src/components/layout/Header.tsx
import { Menu, Shield } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);

  return (
    <header
      className={
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b ' +
        'bg-bg-primary/85 px-4 backdrop-blur-md md:h-16 md:px-6'
      }
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className={
            'flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary ' +
            'transition-colors hover:bg-bg-tertiary hover:text-text-primary md:hidden'
          }
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-violet shadow-glow-violet"
            aria-hidden
          >
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide text-text-primary">
            RugShield
          </span>
          <span
            className={
              'ml-1 hidden items-center gap-1.5 rounded-md border bg-bg-tertiary px-2 py-0.5 ' +
              'text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-green md:inline-flex'
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse-soft" />
            Mainnet
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <WalletMultiButton />
      </div>
    </header>
  );
}