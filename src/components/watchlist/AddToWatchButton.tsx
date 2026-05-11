// src/components/watchlist/AddToWatchButton.tsx
import { useCallback } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useIsWatched, useWatchStore, WATCHLIST_MAX } from '@/stores/watchStore';

interface Props {
  address: string;
  symbol: string;
  name: string;
  /** Current score — captured as initialScore when adding. */
  score: number;
  className?: string;
}

export function AddToWatchButton({
  address,
  symbol,
  name,
  score,
  className,
}: Props) {
  const isWatched = useIsWatched(address);
  const add = useWatchStore((s) => s.add);
  const remove = useWatchStore((s) => s.remove);
  const count = useWatchStore((s) => s.entries.length);

  const atCapacity = !isWatched && count >= WATCHLIST_MAX;

  const onClick = useCallback(() => {
    if (isWatched) {
      remove(address);
    } else if (!atCapacity) {
      add({ address, symbol, name, score });
    }
  }, [isWatched, atCapacity, address, symbol, name, score, add, remove]);

  const label = isWatched
    ? 'Remove from watchlist'
    : atCapacity
      ? `Watchlist full (${WATCHLIST_MAX} max)`
      : 'Add to watchlist';

  const stateClass = isWatched
    ? 'border-accent-violet/40 bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20'
    : 'bg-bg-tertiary text-text-secondary hover:border-accent-violet/30 hover:text-text-primary';

  const disabledClass = atCapacity ? 'cursor-not-allowed opacity-40' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={atCapacity}
      title={label}
      aria-label={label}
      aria-pressed={isWatched}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
        stateClass,
        disabledClass,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isWatched ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}