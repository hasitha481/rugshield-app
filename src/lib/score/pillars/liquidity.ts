// src/lib/score/pillars/liquidity.ts
import type { LiquidityInput, PillarBreakdown } from '../types';

const MAX = 20;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const SIX_MONTHS_MS = 180 * ONE_DAY_MS;

/**
 * Liquidity & LP Lock pillar (max −20).
 *
 * Deductions are ADDITIVE (a single token can hit multiple) but capped at the
 * pillar maximum:
 * - LP not locked AND liquidity > 0: −12
 * - LP locked but unlock <30 days away: −6
 * - LP locked with >6 months remaining: 0 (no deduction)
 * - Liquidity < $10,000: −8 additional
 * - Listed on only 1 market: −4
 */
export function liquidityPillar(input: LiquidityInput): PillarBreakdown {
  const flags: string[] = [];
  let deductions = 0;
  const now = Date.now();

  // -------------------------------------------------------------------------
  // 1) LP lock status
  // -------------------------------------------------------------------------
  if (input.lockInfo === null) {
    if (input.liquidity > 0) {
      deductions += 12;
      flags.push('LP not locked — liquidity can be removed at any time');
    }
  } else {
    const unlock = input.lockInfo.unlockTimestamp;
    if (unlock !== null && Number.isFinite(unlock)) {
      const remaining = unlock - now;
      if (remaining < THIRTY_DAYS_MS) {
        deductions += 6;
        const days = Math.max(0, Math.round(remaining / ONE_DAY_MS));
        flags.push(`LP unlocks in ${days} day${days === 1 ? '' : 's'} — short lock window`);
      } else if (remaining < SIX_MONTHS_MS) {
        // Lock is okay but not extended — informational only (no deduction).
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2) Total liquidity threshold
  // -------------------------------------------------------------------------
  if (input.liquidity < 10_000) {
    deductions += 8;
    flags.push(`Low liquidity ($${formatUsd(input.liquidity)})`);
  }

  // -------------------------------------------------------------------------
  // 3) Single-venue listing
  // -------------------------------------------------------------------------
  if (input.numberMarkets === 1) {
    deductions += 4;
    flags.push('Listed on only 1 market — no venue diversity');
  }

  // Cap the pillar
  const cappedDeductions = Math.min(deductions, MAX);
  return { points: MAX - cappedDeductions, max: MAX, flags };
}

function formatUsd(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return safe.toLocaleString('en-US', { maximumFractionDigits: 0 });
}