// src/lib/score/buckets.ts
import type { ScoreBucket } from './types';

export interface BucketDefinition {
  readonly bucket: ScoreBucket;
  /** Inclusive lower bound. */
  readonly min: number;
  /** Inclusive upper bound. */
  readonly max: number;
  /** Hex color matching the dark terminal theme. */
  readonly color: string;
  /** Human label for UI surfaces. */
  readonly label: string;
  /**
   * Default UX behavior when the score falls in this bucket.
   * The orchestrator and SwapButton consume this signal.
   */
  readonly defaultBehavior: 'SWAP_ENABLED' | 'CONFIRM_REQUIRED' | 'OVERRIDE_REQUIRED' | 'BLOCKED';
}

export const BUCKETS: readonly BucketDefinition[] = [
  {
    bucket: 'SAFE',
    min: 80,
    max: 100,
    color: '#10B981',
    label: 'Safe',
    defaultBehavior: 'SWAP_ENABLED',
  },
  {
    bucket: 'CAUTION',
    min: 60,
    max: 79,
    color: '#F59E0B',
    label: 'Caution',
    defaultBehavior: 'CONFIRM_REQUIRED',
  },
  {
    bucket: 'HIGH_RISK',
    min: 40,
    max: 59,
    color: '#F97316',
    label: 'High Risk',
    defaultBehavior: 'OVERRIDE_REQUIRED',
  },
  {
    bucket: 'DANGER',
    min: 0,
    max: 39,
    color: '#EF4444',
    label: 'Danger',
    defaultBehavior: 'BLOCKED',
  },
] as const;

/**
 * Maps a 0..100 score to its bucket. Inputs are clamped and rounded so
 * non-integer or out-of-range values are handled gracefully.
 */
export function scoreToBucket(score: number): ScoreBucket {
  if (!Number.isFinite(score)) return 'DANGER';
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 80) return 'SAFE';
  if (clamped >= 60) return 'CAUTION';
  if (clamped >= 40) return 'HIGH_RISK';
  return 'DANGER';
}

export function getBucketDefinition(bucket: ScoreBucket): BucketDefinition {
  const def = BUCKETS.find((b) => b.bucket === bucket);
  // BUCKETS is exhaustive over ScoreBucket — this is unreachable.
  if (!def) throw new Error(`No bucket definition for: ${bucket}`);
  return def;
}

export function bucketToColor(bucket: ScoreBucket): string {
  return getBucketDefinition(bucket).color;
}

export function bucketToLabel(bucket: ScoreBucket): string {
  return getBucketDefinition(bucket).label;
}