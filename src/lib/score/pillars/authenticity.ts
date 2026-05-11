// src/lib/score/pillars/authenticity.ts
import type { AuthenticityInput, PillarBreakdown } from '../types';

const MAX = 10;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Threshold below which 24h trade activity looks like wash trading. */
const WASH_TRADING_RATIO = 0.05;

/**
 * Authenticity pillar (max −10).
 *
 * Deductions:
 * - Birdeye flags token as fake/spam: full −10 (cap)
 * - Not on Jupiter strict list AND token >7 days old: −3
 *   (We don't penalize newness — strict-list inclusion takes time.)
 * - 24h unique buyers / 24h trade count <0.05 (wash-trading signal): −5
 */
export function authenticityPillar(
  input: AuthenticityInput,
): PillarBreakdown {
  // Cap case: Birdeye has explicitly flagged this token.
  if (input.fakeToken) {
    return {
      points: 0,
      max: MAX,
      flags: ['Birdeye flags this token as fake or spam'],
    };
  }

  const flags: string[] = [];
  let deductions = 0;

  // -------------------------------------------------------------------------
  // Jupiter strict list check (only meaningful for tokens >7 days old)
  // -------------------------------------------------------------------------
  if (input.jupStrictList === false && input.age > SEVEN_DAYS_MS) {
    deductions += 3;
    flags.push('Not on the Jupiter strict list');
  }

  // -------------------------------------------------------------------------
  // Wash-trading heuristic: unique buyers / total trades over 24h
  // -------------------------------------------------------------------------
  const uw = input.uniqueWallet24h;
  const td = input.trade24h;
  if (
    uw !== null &&
    uw !== undefined &&
    Number.isFinite(uw) &&
    td !== null &&
    td !== undefined &&
    Number.isFinite(td) &&
    td > 0
  ) {
    const ratio = uw / td;
    if (ratio < WASH_TRADING_RATIO) {
      deductions += 5;
      flags.push(`Wash-trading signal — ${uw} unique buyers across ${td} trades in 24h`);
    }
  }

  const cappedDeductions = Math.min(deductions, MAX);
  return { points: MAX - cappedDeductions, max: MAX, flags };
}