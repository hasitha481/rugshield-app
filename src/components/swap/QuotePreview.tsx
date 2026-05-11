// src/components/swap/QuotePreview.tsx
import { Shield } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSwapStore } from '@/stores/swapStore';
import { RouteVisualization } from './RouteVisualization';

/** Convert a raw integer-string amount + decimals → human UI string. */
function formatUiAmount(raw: string, decimals: number): string {
  try {
    const big = BigInt(raw);
    if (big === 0n) return '0';
    const padded = big.toString().padStart(decimals + 1, '0');
    const wholeIdx = padded.length - decimals;
    const whole = padded.slice(0, wholeIdx) || '0';
    const frac = padded.slice(wholeIdx).replace(/0+$/, '');
    if (!frac) return whole;
    return `${whole}.${frac.slice(0, 6)}`;
  } catch {
    return '—';
  }
}

function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—';
  const pct = ratio * 100;
  if (pct < 0.01) return '< 0.01%';
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(2)}%`;
}

function priceImpactColor(ratio: number): string {
  if (!Number.isFinite(ratio)) return 'text-text-secondary';
  if (ratio < 0.005) return 'text-accent-green';
  if (ratio < 0.02) return 'text-accent-yellow';
  if (ratio < 0.05) return 'text-accent-orange';
  return 'text-accent-red';
}

export function QuotePreview() {
  const quote = useSwapStore((s) => s.quote);
  const status = useSwapStore((s) => s.status);
  const outputSymbol = useSwapStore((s) => s.outputSymbol);
  const outputDecimals = useSwapStore((s) => s.outputDecimals);
  const slippageBps = useSwapStore((s) => s.slippageBps);

  // --- IDLE / no input yet ---
  if (status === 'IDLE') {
    return (
      <div className="rounded-xl border bg-bg-tertiary/50 p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          You receive
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-3xl font-semibold text-text-secondary/40">
            0.00
          </div>
          <div className="ml-auto shrink-0 rounded-md border bg-bg-secondary px-2.5 py-1.5 font-mono text-xs font-semibold text-text-secondary">
            {outputSymbol}
          </div>
        </div>
      </div>
    );
  }

  // --- QUOTING with no prior quote — show skeleton ---
  if (status === 'QUOTING' && !quote) {
    return (
      <div className="rounded-xl border bg-bg-tertiary/50 p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          You receive
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-40 animate-pulse-soft rounded bg-bg-tertiary" />
          <div className="ml-auto h-7 w-12 animate-pulse-soft rounded bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const outAmount = formatUiAmount(quote.outAmount, outputDecimals);
  const minReceived = formatUiAmount(quote.otherAmountThreshold, outputDecimals);
  const hopCount = quote.routePlan.length;

  return (
    <div className="space-y-3">
      {/* Output amount */}
      <div className="rounded-xl border bg-bg-tertiary p-4">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          <span>You receive</span>
          {status === 'QUOTING' && (
            <span className="flex items-center gap-1 normal-case tracking-normal text-accent-violet">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-violet" />
              Refreshing
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 truncate font-mono text-3xl font-semibold tabular-nums text-text-primary">
            {outAmount}
          </div>
          <div className="shrink-0 rounded-md border bg-bg-secondary px-2.5 py-1.5 font-mono text-xs font-semibold text-text-primary">
            {outputSymbol}
          </div>
        </div>
      </div>

      {/* 🛡 MEV-Protected via DFlow — the centerpiece */}
      <div
        className={
          'flex items-center justify-between gap-3 rounded-lg border ' +
          'border-accent-violet/30 bg-accent-violet/5 p-3 shadow-glow-violet'
        }
        role="status"
        aria-label="MEV-Protected via DFlow"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-violet/20 text-accent-violet">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <span aria-hidden>🛡</span>
              <span>MEV-Protected via DFlow</span>
            </div>
            <div className="text-[10px] text-text-secondary">
              JIT routing blocks sandwich attacks · {hopCount} hop{hopCount === 1 ? '' : 's'} aggregated
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border bg-bg-tertiary/30 p-3">
        <Stat label="Min received">
          <span className="font-mono tabular-nums text-text-primary">{minReceived}</span>
          <span className="ml-1 text-[10px] text-text-secondary">{outputSymbol}</span>
        </Stat>
        <Stat label="Price impact">
          <span className={`font-mono tabular-nums ${priceImpactColor(quote.priceImpactPct)}`}>
            {formatPercent(quote.priceImpactPct)}
          </span>
        </Stat>
        <Stat label="Slippage">
          <span className="font-mono tabular-nums text-text-primary">
            {(slippageBps / 100).toFixed(2)}%
          </span>
        </Stat>
      </div>

      {/* Route visualization */}
      <RouteVisualization routePlan={quote.routePlan} />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
        {label}
      </div>
      <div className="mt-1 truncate text-xs">{children}</div>
    </div>
  );
}