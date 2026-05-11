// src/components/scanner/ScoreGauge.tsx
import { type ScoreBucket } from '@/lib/score/types';
import { bucketToColor } from '@/lib/score/buckets';

interface Props {
  score: number;
  bucket: ScoreBucket;
}

export function ScoreGauge({ score, bucket }: Props) {
  const bucketColor = bucketToColor(bucket);
  // Calculate dash offset based on score (260 to 60)
  const dashoffset = 260 - (score / 100) * 200;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="8"
          strokeDasharray="200"
          strokeDashoffset="60"
          strokeLinecap="round"
          className="origin-center rotate-[135deg] opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={bucketColor}
          strokeWidth="8"
          strokeDasharray="200"
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="origin-center rotate-[135deg] transition-all duration-1000 ease-out drop-shadow-glow"
        />
      </svg>
      {/* Parana text eka meken remove kala, dan ScoreCard eken animated eka witharak penewi */}
    </div>
  );
}