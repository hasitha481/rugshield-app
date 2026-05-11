// src/components/scanner/TokenHeader.tsx
import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { ScoreResult } from '@/lib/score/types';
import { AddToWatchButton } from '@/components/watchlist/AddToWatchButton';

interface Props {
  result: ScoreResult;
}

function formatAge(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return '—';
  const minutes = ms / 60_000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;
  return `${(months / 12).toFixed(1)}y`;
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

function shortenAddress(a: string): string {
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function TokenHeader({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const { meta, address, score } = result; // NEW: get score for the watchlist
  const initial = (meta.symbol || '?').charAt(0).toUpperCase();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br from-accent-violet/30 to-bg-tertiary text-base font-semibold text-text-primary"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-text-primary">
            {meta.tokenName}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-text-secondary">
            <span className="font-mono font-semibold text-text-primary">{meta.symbol}</span>
            <span aria-hidden className="text-[color:var(--border-default)]">·</span>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 font-mono transition-colors hover:text-text-primary"
              aria-label={copied ? 'Address copied' : 'Copy token address'}
            >
              <span>{shortenAddress(address)}</span>
              {copied ? (
                <Check className="h-3 w-3 text-accent-green" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <a
              href={`https://solscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-colors hover:text-text-primary"
              aria-label="Open on Solscan"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* NEW: Wrapper div for Stats + Watchlist Button */}
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <dl className="grid grid-cols-3 gap-4 md:gap-6 md:text-right flex-1">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Age
            </dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-text-primary">
              {formatAge(meta.age)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Liquidity
            </dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-text-primary">
              {formatUsd(meta.liquidity)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Holders
            </dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-text-primary">
              {formatCount(meta.holder)}
            </dd>
          </div>
        </dl>
        
        {/* NEW: Watchlist Button */}
        <div className="border-l border-bg-tertiary pl-4 flex shrink-0">
          <AddToWatchButton
            address={address}
            symbol={meta.symbol}
            name={meta.tokenName}
            score={score}
          />
        </div>
      </div>
    </div>
  );
}