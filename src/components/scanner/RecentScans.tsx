// src/components/scanner/RecentScans.tsx
import { useCallback, useEffect, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { useScanStore } from '@/stores/scanStore';
import { useTokenScan } from '@/hooks/useTokenScan';
import { bucketToColor } from '@/lib/score/buckets';
import type { ScoreBucket } from '@/lib/score/types';

const STORAGE_KEY = 'rugshield:recent-scans';
const MAX_ENTRIES = 10;

interface RecentEntry {
  address: string;
  symbol: string;
  score: number;
  bucket: ScoreBucket;
  timestamp: number;
}

function loadRecent(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RecentEntry =>
          !!e &&
          typeof e === 'object' &&
          typeof (e as RecentEntry).address === 'string' &&
          typeof (e as RecentEntry).score === 'number',
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveRecent(entries: RecentEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / quota — ignore */
  }
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'now';
  const m = diff / 60_000;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function shortAddress(a: string): string {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function RecentScans() {
  const [entries, setEntries] = useState<RecentEntry[]>(() => loadRecent());
  const currentScan = useScanStore((s) => s.currentScan);
  const { scan } = useTokenScan();

  // Persist new scans into the rolling history.
  useEffect(() => {
    if (!currentScan) return;
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.address !== currentScan.address);
      const next: RecentEntry = {
        address: currentScan.address,
        symbol: currentScan.meta.symbol,
        score: currentScan.score,
        bucket: currentScan.bucket,
        timestamp: currentScan.meta.computedAt,
      };
      const updated = [next, ...filtered].slice(0, MAX_ENTRIES);
      saveRecent(updated);
      return updated;
    });
  }, [currentScan]);

  const onSelect = useCallback(
    (address: string) => {
      void scan(address);
    },
    [scan],
  );

  const header = (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
        <Clock className="h-3.5 w-3.5" />
        Recent Scans
      </div>
      {entries.length > 0 && (
        <span className="font-mono text-[10px] text-text-secondary">
          {entries.length}
        </span>
      )}
    </div>
  );

  if (entries.length === 0) {
    return (
      <Card padding="none">
        {header}
        <p className="px-4 py-6 text-xs text-text-secondary">
          Tokens you scan will appear here for one-tap re-scanning.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      {header}
      <ul className="divide-y">
        {entries.map((entry) => {
          const color = bucketToColor(entry.bucket);
          return (
            <li key={entry.address}>
              <button
                type="button"
                onClick={() => onSelect(entry.address)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-tertiary"
              >
                <div
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold tabular-nums"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {entry.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-primary">
                    {entry.symbol || '???'}
                  </div>
                  <div className="truncate font-mono text-[10px] text-text-secondary">
                    {shortAddress(entry.address)} · {timeAgo(entry.timestamp)}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}