// src/components/scanner/PillarBar.tsx
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { PillarBreakdown } from '@/lib/score/types';

interface Props {
  label: string;
  pillar: PillarBreakdown;
  delayMs?: number;
}

/**
 * Map a pillar's points/max ratio to a bucket color, mirroring the
 * overall score's bucket thresholds.
 */
function pillarColor(points: number, max: number): string {
  if (max === 0) return '#9CA3AF'; // text-secondary — "no data"
  const ratio = points / max;
  if (ratio >= 0.8) return '#10B981';
  if (ratio >= 0.6) return '#F59E0B';
  if (ratio >= 0.4) return '#F97316';
  return '#EF4444';
}

export function PillarBar({ label, pillar, delayMs = 0 }: Props) {
  const targetWidth =
    pillar.max > 0 ? Math.max(0, Math.min(100, (pillar.points / pillar.max) * 100)) : 0;
  const color = pillarColor(pillar.points, pillar.max);
  const hasFlags = pillar.flags.length > 0;

  // Animate the bar fill from 0 → target on mount, with optional stagger.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setWidth(targetWidth), delayMs);
    return () => window.clearTimeout(id);
  }, [targetWidth, delayMs]);

  return (
    <div
      className="group relative animate-fade-in-up"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 truncate text-sm font-medium text-text-primary">
          {label}
          {hasFlags && (
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
        </span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
          {pillar.points} / {pillar.max}
        </span>
      </div>

      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
        role="progressbar"
        aria-valuenow={pillar.points}
        aria-valuemin={0}
        aria-valuemax={pillar.max}
        aria-label={`${label}: ${pillar.points} of ${pillar.max}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            transition:
              'width 700ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms ease',
          }}
        />
      </div>

      {hasFlags && (
        <div
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute left-0 right-0 top-full z-10 mt-2',
            'rounded-lg border bg-bg-tertiary p-3 text-xs text-text-primary shadow-card',
            'opacity-0 -translate-y-1 transition-all duration-150',
            'group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0',
            'group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0',
          )}
        >
          <ul className="space-y-1.5">
            {pillar.flags.map((flag, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="shrink-0" style={{ color }}>
                  •
                </span>
                <span className="leading-snug">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}