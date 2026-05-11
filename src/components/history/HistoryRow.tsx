// src/components/history/HistoryRow.tsx
import { type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowRight, ExternalLink, ScanLine, Zap } from 'lucide-react';
import { bucketToColor, bucketToLabel } from '@/lib/score/buckets';
import type { HistoryEvent } from '@/stores/historyStore';

interface Props {
  event: HistoryEvent;
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
  if (!addr) return '';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function shortSig(sig: string): string {
  return `${sig.slice(0, 6)}…${sig.slice(-6)}`;
}

export function HistoryRow({ event, onSelect }: Props) {
  if (event.type === 'SCAN') return <ScanRow event={event} onSelect={onSelect} />;
  return <SwapRow event={event} />;
}

// Re-export discriminated members for narrowed prop typing below.
type ScanEventType = Extract<HistoryEvent, { type: 'SCAN' }>;
type SwapEventType = Extract<HistoryEvent, { type: 'SWAP' }>;

function ScanRow({
  event,
  onSelect,
}: {
  event: ScanEventType;
  onSelect?: (address: string) => void;
}) {
  const bucketColor = bucketToColor(event.bucket);
  const bucketLabel = bucketToLabel(event.bucket);
  const clickable = !!onSelect;

  const handleClick = () => onSelect?.(event.address);
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKey : undefined}
      className={[
        'flex items-center gap-3 rounded-lg border bg-bg-secondary p-3 transition-colors',
        clickable
          ? 'cursor-pointer hover:border-accent-violet/30 hover:bg-bg-tertiary focus:outline-none focus:ring-1 focus:ring-accent-violet'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${bucketColor}20`, color: bucketColor }}
      >
        <ScanLine className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Scan
          </span>
          <span className="truncate font-mono text-sm font-semibold text-text-primary">
            {event.symbol || 'UNKNOWN'}
          </span>
          {event.name && event.name !== event.symbol && (
            <span className="truncate text-xs text-text-secondary">
              {event.name}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-text-secondary">
          {shortAddress(event.address)} · {relativeTime(event.timestamp)}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className="font-mono text-2xl font-bold leading-none tabular-nums"
          style={{ color: bucketColor }}
        >
          {event.score}
        </div>
        <div
          className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: bucketColor }}
        >
          {bucketLabel}
        </div>
      </div>
    </div>
  );
}

function SwapRow({ event }: { event: SwapEventType }) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-bg-secondary p-3">
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-violet/15 text-accent-violet"
      >
        <Zap className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Swap
          </span>
          <span className="font-mono text-sm font-semibold text-text-primary">
            {event.inputAmount}
          </span>
          <span className="font-mono text-xs text-text-secondary">
            {event.inputSymbol}
          </span>
          <ArrowRight
            aria-hidden
            className="h-3 w-3 shrink-0 text-text-secondary"
          />
          <span className="font-mono text-sm font-semibold text-text-primary">
            {event.outputAmount}
          </span>
          <span className="font-mono text-xs text-text-secondary">
            {event.outputSymbol}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
          <span>{relativeTime(event.timestamp)}</span>
          <span aria-hidden>·</span>
          {/* FIXED LINK HERE */}
          <a
            href={`https://solscan.io/tx/${event.txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopProp}
            className="inline-flex items-center gap-1 text-accent-violet hover:underline"
          >
            {shortSig(event.txSignature)}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      <div className="hidden shrink-0 sm:block">
        <div className="rounded border border-accent-violet/30 bg-accent-violet/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-accent-violet">
          🛡 DFlow
        </div>
      </div>
    </div>
  );
}