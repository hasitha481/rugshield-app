// src/components/watchlist/WatchlistRow.tsx
import { type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowDown, ArrowUp, Minus, X } from 'lucide-react';
import { bucketToColor, bucketToLabel, scoreToBucket } from '@/lib/score/buckets';
import { useWatchStore, type WatchlistEntry } from '@/stores/watchStore';

interface Props {
  entry: WatchlistEntry;
  /** Optional click handler — when provided, the row becomes navigable. */
  onSelect?: (address: string) => void;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WatchlistRow({ entry, onSelect }: Props) {
  const remove = useWatchStore((s) => s.remove);

  const bucket = scoreToBucket(entry.lastScore);
  const bucketColor = bucketToColor(bucket);
  const bucketLabel = bucketToLabel(bucket);

  const delta = entry.lastScore - entry.initialScore;
  const avatarLetter = (entry.symbol || entry.name || '?').charAt(0).toUpperCase();

  const handleRowClick = () => {
    onSelect?.(entry.address);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick();
    }
  };

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    remove(entry.address);
  };

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? handleRowClick : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      className={[
        'group flex items-center gap-3 rounded-lg border bg-bg-secondary p-3 transition-colors',
        onSelect
          ? 'cursor-pointer hover:border-accent-violet/30 hover:bg-bg-tertiary focus:outline-none focus:ring-1 focus:ring-accent-violet'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Avatar */}
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold"
        style={{
          backgroundColor: `${bucketColor}20`,
          color: bucketColor,
        }}
      >
        {avatarLetter}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-mono text-sm font-semibold text-text-primary">
            {entry.symbol || 'UNKNOWN'}
          </span>
          {entry.name && entry.name !== entry.symbol && (
            <span className="truncate text-xs text-text-secondary">
              {entry.name}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-text-secondary">
          <span>{shortAddress(entry.address)}</span>
          <span aria-hidden> · </span>
          <span>added {relativeTime(entry.addedAt)}</span>
          <span aria-hidden> · </span>
          <span>updated {relativeTime(entry.lastUpdatedAt)}</span>
        </div>
      </div>

      {/* Delta + Score */}
      <div className="flex shrink-0 items-center gap-3 pr-1">
        <Delta delta={delta} />
        <div className="text-right">
          <div
            className="font-mono text-2xl font-bold leading-none tabular-nums"
            style={{ color: bucketColor }}
          >
            {entry.lastScore}
          </div>
          <div
            className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: bucketColor }}
          >
            {bucketLabel}
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${entry.symbol || 'token'} from watchlist`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 transition-opacity hover:bg-bg-tertiary hover:text-accent-red focus:opacity-100 focus:outline-none group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Delta({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <div className="flex items-center gap-1 rounded border bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
        <Minus className="h-2.5 w-2.5" aria-hidden />
        <span>0</span>
      </div>
    );
  }

  const positive = delta > 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  const tone = positive
    ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
    : 'border-accent-red/30 bg-accent-red/10 text-accent-red';

  return (
    <div
      className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${tone}`}
      aria-label={`Score change since added: ${positive ? '+' : ''}${delta}`}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      <span>
        {positive ? '+' : ''}
        {delta}
      </span>
    </div>
  );
}