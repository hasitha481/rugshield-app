// src/components/scanner/PillarBreakdown.tsx
import { PillarBar } from './PillarBar';
import type { ScorePillars } from '@/lib/score/types';

interface Props {
  pillars: ScorePillars;
}

const PILLAR_ORDER: ReadonlyArray<{ key: keyof ScorePillars; label: string }> = [
  { key: 'authority', label: 'Authority' },
  { key: 'concentration', label: 'Holder Concentration' },
  { key: 'liquidity', label: 'Liquidity & LP Lock' },
  { key: 'deployer', label: 'Deployer Risk' },
  { key: 'marketHealth', label: 'Market Health' },
  { key: 'authenticity', label: 'Authenticity' },
];

export function PillarBreakdown({ pillars }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Pillar Breakdown
        </h3>
        <span className="text-[10px] text-text-secondary">Hover bars for details</span>
      </div>
      <div className="space-y-4">
        {PILLAR_ORDER.map(({ key, label }, i) => (
          <PillarBar
            key={key}
            label={label}
            pillar={pillars[key]}
            delayMs={i * 70}
          />
        ))}
      </div>
    </div>
  );
}