// src/lib/score/pillars/concentration.ts
import type { ConcentrationInput, PillarBreakdown } from '../types';

const MAX = 20;

/**
 * Holder Concentration pillar (max −20).
 *
 * Uses `top10UserPercent` (excludes LPs / contracts / burn addresses) as the
 * primary signal because it best reflects retail/whale concentration.
 * Falls back to `top10HolderPercent` when the user-filtered figure is missing.
 *
 * Deductions (mutually exclusive — only the highest matching tier fires):
 * - >0.80: −20
 * - >0.60: −12
 * - >0.40: −6
 * - >0.20: −2
 * - ≤0.20: 0
 */
export function concentrationPillar(
  input: ConcentrationInput,
): PillarBreakdown {
  const pct = input.top10UserPercent ?? input.top10HolderPercent;

  // No data — handled at the orchestrator level via dataQuality.
  // Returning full points here so the missing pillar doesn't double-penalize.
  if (pct === null || pct === undefined || !Number.isFinite(pct)) {
    return { points: MAX, max: MAX, flags: [] };
  }

  let deductions = 0;
  if (pct > 0.8) deductions = 20;
  else if (pct > 0.6) deductions = 12;
  else if (pct > 0.4) deductions = 6;
  else if (pct > 0.2) deductions = 2;

  const flags: string[] = [];
  if (deductions > 0) {
    const pctLabel = `${(pct * 100).toFixed(0)}%`;
    if (deductions === 20) {
      flags.push(`Top 10 holders own ${pctLabel} — extreme concentration`);
    } else if (deductions === 12) {
      flags.push(`Top 10 holders own ${pctLabel} — high concentration`);
    } else if (deductions === 6) {
      flags.push(`Top 10 holders own ${pctLabel} — elevated concentration`);
    } else {
      flags.push(`Top 10 holders own ${pctLabel}`);
    }
  }

  return { points: MAX - deductions, max: MAX, flags };
}