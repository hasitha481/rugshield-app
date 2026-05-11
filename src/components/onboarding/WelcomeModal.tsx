// src/components/onboarding/WelcomeModal.tsx
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Eye, ScanLine, Shield, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  // Show EVERY TIME on mount (Removed localStorage check for Hackathon demo)
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border bg-bg-secondary shadow-card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative border-b bg-gradient-to-br from-accent-violet/15 via-accent-violet/5 to-transparent px-6 pb-6 pt-8 text-center">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close welcome"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-violet/20 text-accent-violet shadow-glow-violet">
            <Shield className="h-7 w-7" />
          </div>
          <h2
            id="welcome-modal-title"
            className="text-xl font-bold text-text-primary"
          >
            Welcome to RugShield
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Real-time rug pull detection + MEV-protected swaps for Solana spot
            trading.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2.5 p-6">
          <Feature
            icon={<ScanLine className="h-4 w-4" />}
            title="Scan any token in 2 seconds"
            description="Paste a Solana address and RugShield computes a 0–100 safety score across 6 risk pillars: authority, concentration, liquidity, deployer, market health, and authenticity."
          />
          <Feature
            icon={<Zap className="h-4 w-4" />}
            title="Swap with MEV protection"
            description="Every trade routes through DFlow's JIT engine — sandwich attacks are blocked at the protocol level, not patched afterwards."
          />
          <Feature
            icon={<Eye className="h-4 w-4" />}
            title="Bookmark and track over time"
            description="Watchlist auto-refreshes every 60 seconds and surfaces score deltas the moment they happen — so you know before the rug pulls."
          />
        </div>

        {/* Footer */}
        <div className="border-t bg-bg-tertiary/30 px-6 py-4">
          <Button
            variant="primary"
            onClick={handleClose}
            fullWidth
            size="lg"
            leftIcon={<Zap className="h-4 w-4" />}
          >
            Get Started
          </Button>
          <p className="mt-2 text-center text-[10px] text-text-secondary">
            Open-source · Built for the Eitherway Frontier Hackathon
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-bg-tertiary/50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-violet/15 text-accent-violet">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="mt-0.5 text-xs leading-snug text-text-secondary">
          {description}
        </div>
      </div>
    </div>
  );
}