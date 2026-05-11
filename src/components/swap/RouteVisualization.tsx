// src/components/swap/RouteVisualization.tsx
import { ArrowRight } from 'lucide-react';
import type { RoutePlanStep } from '@/lib/dflow/types';

interface Props {
  routePlan: RoutePlanStep[];
}

export function RouteVisualization({ routePlan }: Props) {
  if (!routePlan || routePlan.length === 0) return null;

  return (
    <div className="rounded-lg border bg-bg-tertiary/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Route via DFlow
        </div>
        <div className="font-mono text-[10px] text-text-secondary">
          {routePlan.length} hop{routePlan.length === 1 ? '' : 's'}
        </div>
      </div>
      <ol className="flex flex-wrap items-center gap-1.5">
        {routePlan.map((step, i) => {
          const { swapInfo, percent } = step;
          const isSplit = percent !== 100;
          return (
            <li
              key={`${swapInfo.ammKey}-${i}`}
              className="flex items-center gap-1.5"
            >
              {i > 0 && (
                <ArrowRight
                  className="h-3 w-3 shrink-0 text-text-secondary"
                  aria-hidden
                />
              )}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-accent-violet/30 bg-accent-violet/5 px-2 py-0.5 font-mono text-[11px]">
                <span className="font-semibold text-text-primary">
                  {swapInfo.label || 'Unknown AMM'}
                </span>
                {isSplit && (
                  <span className="rounded bg-accent-violet/20 px-1 py-px text-[9px] font-bold text-accent-violet">
                    {percent}%
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}