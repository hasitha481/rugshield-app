// src/pages/HistoryPage.tsx
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useHistoryStore, HISTORY_MAX } from '@/stores/historyStore';
import { useTokenScan } from '@/hooks/useTokenScan';
import { HistoryRow } from '@/components/history/HistoryRow';
import { HistoryEmpty } from '@/components/history/HistoryEmpty';

type Filter = 'all' | 'scans' | 'swaps';

export function HistoryPage() {
  const navigate = useNavigate();
  const events = useHistoryStore((s) => s.events);
  const clear = useHistoryStore((s) => s.clear);
  const { scan } = useTokenScan();

  const [filter, setFilter] = useState<Filter>('all');
  const [clearConfirming, setClearConfirming] = useState(false);

  const counts = useMemo(
    () => ({
      all: events.length,
      scans: events.filter((e) => e.type === 'SCAN').length,
      swaps: events.filter((e) => e.type === 'SWAP').length,
    }),
    [events],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'scans') return events.filter((e) => e.type === 'SCAN');
    return events.filter((e) => e.type === 'SWAP');
  }, [events, filter]);

  const handleSelect = useCallback(
    (address: string) => {
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
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-violet/10 text-accent-violet">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary">History</h1>
          <div className="text-xs text-text-secondary">
            {events.length} of {HISTORY_MAX} events · stored locally
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <HistoryEmpty />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border bg-bg-secondary p-1">
              <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
                All <Pill>{counts.all}</Pill>
              </FilterTab>
              <FilterTab
                active={filter === 'scans'}
                onClick={() => setFilter('scans')}
              >
                Scans <Pill>{counts.scans}</Pill>
              </FilterTab>
              <FilterTab
                active={filter === 'swaps'}
                onClick={() => setFilter('swaps')}
              >
                Swaps <Pill>{counts.swaps}</Pill>
              </FilterTab>
            </div>
            <Button
              variant={clearConfirming ? 'danger' : 'ghost'}
              size="sm"
              onClick={handleClear}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {clearConfirming ? 'Click to confirm' : 'Clear history'}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border bg-bg-secondary p-6 text-center text-sm text-text-secondary">
              No {filter} yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((event) => (
                <li key={event.id}>
                  <HistoryRow
                    event={event}
                    onSelect={event.type === 'SCAN' ? handleSelect : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-bg-tertiary text-text-primary'
          : 'text-text-secondary hover:text-text-primary',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
      {children}
    </span>
  );
}