// src/components/scanner/RiskFlags.tsx
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScorePillars, PillarBreakdown } from '@/lib/score/types';

interface Props {
  pillars: ScorePillars;
}

interface AggregatedFlag {
  text: string;
  color: string;
}

const PILLAR_KEYS: ReadonlyArray<keyof ScorePillars> = [
  'authority',
  'concentration',
  'liquidity',
  'deployer',
  'marketHealth',
  'authenticity',
];

function pillarColor(p: PillarBreakdown): string {
  if (p.max === 0) return '#9CA3AF';
  const ratio = p.points / p.max;
  if (ratio >= 0.8) return '#10B981';
  if (ratio >= 0.6) return '#F59E0B';
  if (ratio >= 0.4) return '#F97316';
  return '#EF4444';
}

function aggregate(pillars: ScorePillars): AggregatedFlag[] {
  const out: AggregatedFlag[] = [];
  for (const key of PILLAR_KEYS) {
    const p = pillars[key];
    const color = pillarColor(p);
    for (const text of p.flags) {
      out.push({ text, color });
    }
  }
  return out;
}

export function RiskFlags({ pillars }: Props) {
  const flags = aggregate(pillars);

  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 border-t bg-accent-green/5 px-5 py-4 text-sm text-text-secondary md:px-6">
        <ShieldCheck className="h-4 w-4 text-accent-green" />
        <span>
          <span className="font-medium text-text-primary">No red flags detected.</span>{' '}
          All six pillars look healthy.
        </span>
      </div>
    );
  }

  return (
    <div className="border-t bg-bg-tertiary/40 px-5 py-4 md:px-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>
          Risk Flags <span className="font-mono text-text-primary">({flags.length})</span>
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {flags.map((flag, i) => (
          <li
            key={i}
            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs text-text-primary"
            style={{
              borderColor: `${flag.color}40`,
              backgroundColor: `${flag.color}12`,
            }}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: flag.color }}
            />
            <span className="leading-snug">{flag.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}