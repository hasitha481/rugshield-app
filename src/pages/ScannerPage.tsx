// src/pages/ScannerPage.tsx
import { Sparkles } from 'lucide-react';
import { TokenInput } from '@/components/scanner/TokenInput';
import { ScoreCard } from '@/components/scanner/ScoreCard';
import { ScanError } from '@/components/scanner/ScanError';
import { RecentScans } from '@/components/scanner/RecentScans';
import { Card } from '@/components/ui';
import { useScanStore } from '@/stores/scanStore';
import { useTokenScan } from '@/hooks/useTokenScan';
import { SwapPanel } from '@/components/swap/SwapPanel';

const EXAMPLE_TOKENS: ReadonlyArray<{ label: string; address: string }> = [
  { label: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { label: 'SOL', address: 'So11111111111111111111111111111111111111112' },
  { label: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { label: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
];

interface EmptyStateProps {
  onTry: (address: string) => void;
}

function EmptyState({ onTry }: EmptyStateProps) {
  return (
    <Card padding="lg" className="text-center animate-fade-in">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-violet/15 ring-1 ring-accent-violet/30">
        <Sparkles className="h-5 w-5 text-accent-violet" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        Paste any Solana token to scan
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        We compute a 0–100 Safety Score across six risk pillars in seconds.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-text-secondary">Try:</span>
        {EXAMPLE_TOKENS.map((ex) => (
          <button
            key={ex.address}
            type="button"
            onClick={() => onTry(ex.address)}
            className="rounded-md border bg-bg-tertiary px-2.5 py-1 font-mono font-medium text-text-primary transition-colors hover:border-accent-violet/50 hover:bg-bg-secondary"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden animate-fade-in">
      <div className="border-b p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse-soft rounded-full bg-bg-tertiary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 max-w-full animate-pulse-soft rounded bg-bg-tertiary" />
            <div className="h-3 w-32 max-w-full animate-pulse-soft rounded bg-bg-tertiary" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-[280px_1fr] md:gap-8 md:p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="aspect-[2/1.15] w-full max-w-[280px] animate-pulse-soft rounded-xl bg-bg-tertiary" />
          <div className="h-5 w-40 animate-pulse-soft rounded bg-bg-tertiary" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 animate-pulse-soft rounded bg-bg-tertiary" />
                <div className="h-3 w-12 animate-pulse-soft rounded bg-bg-tertiary" />
              </div>
              <div className="h-1.5 w-full animate-pulse-soft rounded-full bg-bg-tertiary" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ScannerPage() {
  const isLoading = useScanStore((s) => s.isLoading);
  const error = useScanStore((s) => s.error);
  const currentScan = useScanStore((s) => s.currentScan);
  const { scan } = useTokenScan();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
          <Sparkles className="h-3 w-3" />
          Scanner
        </div>
        <h1 className="text-balance text-2xl font-semibold text-text-primary md:text-3xl">
          Paste a token. See the rug score.
        </h1>
        <p className="mt-1 max-w-prose text-sm text-text-secondary">
          Six weighted pillars audited in real time across Birdeye's on-chain data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-6">
          <TokenInput />

          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ScanError
              message={error}
              onRetry={
                currentScan ? () => void scan(currentScan.address) : undefined
              }
            />
          ) : currentScan ? (
            <>
              <ScoreCard result={currentScan} />
              <SwapPanel />
            </>
          ) : (
            <EmptyState onTry={(addr) => void scan(addr)} />
          )}
        </div>

        <aside>
          <RecentScans />
        </aside>
      </div>
    </div>
  );
}