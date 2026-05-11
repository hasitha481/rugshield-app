// src/components/scanner/ScoreCard.tsx
import { useEffect, useState, type CSSProperties } from 'react';
import { bucketToColor, bucketToLabel } from '@/lib/score/buckets';
import type { ScoreResult } from '@/lib/score/types';
import { TokenHeader } from './TokenHeader';
import { ScoreGauge } from './ScoreGauge';
import { DataQualityBadge } from './DataQualityBadge';
import { PillarBreakdown } from './PillarBreakdown';
import { RiskFlags } from './RiskFlags';

interface Props {
  result: ScoreResult;
}

/** Smoothly count up to the final score over 800ms, ease-out cubic. */
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function ScoreCard({ result }: Props) {
  const bucketColor = bucketToColor(result.bucket);
  const bucketLabel = bucketToLabel(result.bucket);
  const animatedScore = useCountUp(result.score);

  // Re-key animations off the address so a new scan re-triggers entry.
  const animationKey = result.address;

  // CSS vars consumed by inline styles below.
  const cardStyle: CSSProperties = {
    // @ts-expect-error — custom CSS property
    '--bucket': bucketColor,
    borderColor: `${bucketColor}40`,
    boxShadow: `
      0 32px 80px -24px ${bucketColor}33,
      0 0 0 1px ${bucketColor}22 inset,
      0 0 60px -20px ${bucketColor}66
    `,
  };

  return (
    <div
      key={animationKey}
      className="relative animate-rise-in"
      style={{ animationDelay: '0ms' }}
    >
      {/* --- Outer aura: pulses with the bucket color --- */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-3xl blur-2xl animate-glow-pulse"
        style={{
          background: `radial-gradient(60% 50% at 50% 0%, ${bucketColor}55, transparent 70%)`,
        }}
      />

      {/* --- Card body: glassmorphic, bucket-tinted border + shadow --- */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-bg-secondary/85 backdrop-blur-xl"
        style={cardStyle}
      >
        {/* Top gradient band — bucket-tinted */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background: `linear-gradient(180deg, ${bucketColor}1f 0%, transparent 70%)`,
          }}
        />

        {/* Subtle grid for "terminal" feel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(${bucketColor} 1px, transparent 1px),
              linear-gradient(90deg, ${bucketColor} 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 70%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at top, black 0%, transparent 70%)',
          }}
        />

        {/* Shimmer sweep over the top — runs once on mount */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-shimmer"
        />

        {/* --- Content (staggered entry) --- */}
        <div className="relative space-y-5 p-6">
          {/* Token identity */}
          <div className="animate-rise-in" style={{ animationDelay: '60ms' }}>
            <TokenHeader result={result} />
          </div>

          {/* Score hero: gauge + counted-up number */}
          <div
            className="relative flex flex-col items-center animate-rise-in"
            style={{ animationDelay: '140ms' }}
          >
            <ScoreGauge score={result.score} bucket={result.bucket} />

            {/* Counted score number overlay — sits on top of the gauge center */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
              <div
                className="font-mono text-5xl font-bold tabular-nums leading-none"
                style={{
                  color: bucketColor,
                  textShadow: `0 0 24px ${bucketColor}66`,
                }}
              >
                {animatedScore}
              </div>
              <div
                className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: bucketColor }}
              >
                {bucketLabel}
              </div>
            </div>
          </div>

          {/* Data quality - FIXED PROP NAME HERE */}
          <div className="animate-rise-in" style={{ animationDelay: '220ms' }}>
            <DataQualityBadge dataQuality={result.dataQuality} />
          </div>

          {/* Pillar breakdown — its internal stagger still runs */}
          <div className="animate-rise-in" style={{ animationDelay: '280ms' }}>
            <PillarBreakdown pillars={result.pillars} />
          </div>

          {/* Risk flags */}
          <div className="animate-rise-in" style={{ animationDelay: '360ms' }}>
            <RiskFlags pillars={result.pillars} />
          </div>
        </div>
      </div>
    </div>
  );
}