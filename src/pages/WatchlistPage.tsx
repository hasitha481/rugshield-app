// src/pages/WatchlistPage.tsx
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useWatchStore, WATCHLIST_MAX } from '@/stores/watchStore';
import { useWatchlistRefresh } from '@/hooks/useWatchlistRefresh';
import { useTokenScan } from '@/hooks/useTokenScan';
import { WatchlistRow } from '@/components/watchlist/WatchlistRow';
import { WatchlistEmpty } from '@/components/watchlist/WatchlistEmpty';

function relativeTime(ms: number | null): string {
  if (ms === null) return 'never';
  const diff = Date.now() - ms;
  if (diff < 5_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function WatchlistPage() {
  const navigate = useNavigate();
  const entries = useWatchStore((s) => s.entries);
  const clear = useWatchStore((s) => s.clear);

  const { refreshNow, isRefreshing, lastRefreshAt } = useWatchlistRefresh();
  const { scan } = useTokenScan();

  const [clearConfirming, setClearConfirming] = useState(false);

  // Show newest-added first.
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.addedAt - a.addedAt),
    [entries],
  );

  const handleSelect = useCallback(
    (address: string) => {
      // Trigger a scan via the existing pipeline, then route into the scanner.
      void scan(address);
      navigate('/');
    },
    [scan, navigate],
  );

  const handleClear = useCallback(() => {
    if (clearConfirming) {
      clear();
      setClearConfirming(false);
    } else {
      setClearConfirming(true);
      window.setTimeout(() => setClearConfirming(false), 3000);
    }
  }, [clearConfirming, clear]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-violet/10 text-accent-violet"
          >
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">
              Watchlist
            </h1>
            <div className="text-xs text-text-secondary">
              {entries.length} of {WATCHLIST_MAX} tokens · auto-refreshes every 60s
            </div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <WatchlistEmpty />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-bg-secondary px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div
                aria-hidden
                className={`h-2 w-2 rounded-full ${
                  isRefreshing ? 'animate-pulse-soft bg-accent-violet' : 'bg-accent-green'
                }`}
              />
              <span>
                {isRefreshing
                  ? 'Refreshing scores…'
                  : `Last refresh ${relativeTime(lastRefreshAt)}`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNow}
                disabled={isRefreshing}
                leftIcon={
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                }
              >
                Refresh
              </Button>
              <Button
                variant={clearConfirming ? 'danger' : 'ghost'}
                size="sm"
                onClick={handleClear}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                {clearConfirming ? 'Click to confirm' : 'Clear all'}
              </Button>
            </div>
          </div>

          {/* List */}
          <ul className="space-y-2">
            {sortedEntries.map((entry) => (
              <li key={entry.address}>
                <WatchlistRow entry={entry} onSelect={handleSelect} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}