// src/lib/score/pillars/marketHealth.ts
import type { MarketHealthInput, PillarBreakdown } from '../types';

const MAX = 15;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Market Health pillar (max −15).
 *
 * Deductions (liquidity tier and holder tier are each mutually exclusive,
 * pump-pattern is independent):
 * - Liquidity <$5,000: −10
 * - Liquidity $5k–$25k: −6
 * - Liquidity $25k–$100k: −2
 * - Holder count <50: −5
 * - Holder count 50–200: −2
 * - +500% in 24h on a token <24h old: −3 (pump pattern)
 */
export function marketHealthPillar(
  input: MarketHealthInput,
): PillarBreakdown {
  const flags: string[] = [];
  let deductions = 0;

  // -------------------------------------------------------------------------
  // Liquidity tiers
  // -------------------------------------------------------------------------
  const liq = input.liquidity;
  if (Number.isFinite(liq) && liq >= 0) {
    if (liq < 5_000) {
      deductions += 10;
      flags.push(`Very low liquidity ($${formatUsd(liq)})`);
    } else if (liq < 25_000) {
      deductions += 6;
      flags.push(`Low liquidity ($${formatUsd(liq)})`);
    } else if (liq < 100_000) {
      deductions += 2;
      flags.push(`Moderate liquidity ($${formatUsd(liq)})`);
    }
    // ≥ $100k → no deduction
  }

  // -------------------------------------------------------------------------
  // Holder count tiers
  // -------------------------------------------------------------------------
  const holders = input.holder;
  if (holders !== null && holders !== undefined && Number.isFinite(holders)) {
    if (holders < 50) {
      deductions += 5;
      flags.push(`Only ${holders} holders`);
    } else if (holders <= 200) {
      deductions += 2;
      flags.push(`${holders} holders — small community`);
    }
  }

  // -------------------------------------------------------------------------
  // Pump pattern
  // -------------------------------------------------------------------------
  const change = input.priceChange24hPercent;
  if (
    change !== null &&
    change !== undefined &&
    Number.isFinite(change) &&
    change > 500 &&
    input.age < ONE_DAY_MS
  ) {
    deductions += 3;
    flags.push(`+${Math.round(change)}% in 24h on a brand-new token — pump pattern`);
  }

  const cappedDeductions = Math.min(deductions, MAX);
  return { points: MAX - cappedDeductions, max: MAX, flags };
}

function formatUsd(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}