// src/lib/score/pillars/deployer.ts
import type { DeployerInput, PillarBreakdown } from '../types';

const MAX = 15;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Deployer / Creator Risk pillar (max −15).
 *
 * Deductions:
 * - Creator wallet still holds >10% of supply: −8 (mutually exclusive with next)
 * - Creator wallet holds 5%–10%: −4
 * - Owner / update authority holds >10%: −5 (independent, can stack)
 * - Token <1 hour old AND no LP lock: −5 (more dangerous combo, takes precedence)
 * - Token <24 hours old: −2 (only fires if the <1h+no-lock rule didn't)
 *
 * V2 (not implemented in V1): creator wallet has ≥2 prior token deployments
 * with current liquidity <$1K → full −15 (overrides pillar).
 */
export function deployerPillar(input: DeployerInput): PillarBreakdown {
  const flags: string[] = [];
  let deductions = 0;

  // -------------------------------------------------------------------------
  // Creator concentration
  // -------------------------------------------------------------------------
  const creator = input.creatorPercentage;
  if (creator !== null && creator !== undefined && Number.isFinite(creator)) {
    if (creator > 0.1) {
      deductions += 8;
      flags.push(`Creator wallet holds ${(creator * 100).toFixed(1)}% of supply`);
    } else if (creator >= 0.05) {
      deductions += 4;
      flags.push(`Creator wallet holds ${(creator * 100).toFixed(1)}% of supply`);
    }
  }

  // -------------------------------------------------------------------------
  // Owner / update authority concentration
  // -------------------------------------------------------------------------
  const owner = input.ownerPercentage;
  if (owner !== null && owner !== undefined && Number.isFinite(owner) && owner > 0.1) {
    deductions += 5;
    flags.push(`Owner / update authority holds ${(owner * 100).toFixed(1)}% of supply`);
  }

  // -------------------------------------------------------------------------
  // Age + lock combo
  // -------------------------------------------------------------------------
  if (input.age < ONE_HOUR_MS && input.lockInfo === null) {
    deductions += 5;
    flags.push('Token under 1 hour old with no LP lock — instant rug risk');
  } else if (input.age < ONE_DAY_MS) {
    deductions += 2;
    flags.push('Token under 24 hours old');
  }

  const cappedDeductions = Math.min(deductions, MAX);
  return { points: MAX - cappedDeductions, max: MAX, flags };
}