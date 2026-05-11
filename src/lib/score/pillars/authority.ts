// src/lib/score/pillars/authority.ts
import type { AuthorityInput, PillarBreakdown } from '../types';

const MAX = 20;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Solana system program / "null" pubkey. Some tokens set freezeAuthority to
 * this address as a soft-revoke. We treat it identically to a true `null`.
 */
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111';

/**
 * Authority Risk pillar (max −20).
 *
 * Deductions:
 * - Active freeze authority: −15
 * - Mutable metadata on a token <7 days old: −5
 * - Transfer fee enabled, fee >5.00% (>500 bps): −10
 * - Transfer fee enabled, fee ≤5.00%: −3
 * - Non-transferable extension active: full −20 (cap, force DANGER)
 */
export function authorityPillar(input: AuthorityInput): PillarBreakdown {
  // Cap case: token is structurally unswappable.
  if (input.nonTransferable) {
    return {
      points: 0,
      max: MAX,
      flags: ['Token is non-transferable — cannot be swapped'],
    };
  }

  const flags: string[] = [];
  let deductions = 0;

  // Freeze authority active
  if (
    input.freezeAuthority !== null &&
    input.freezeAuthority !== '' &&
    input.freezeAuthority !== SYSTEM_PROGRAM_ADDRESS
  ) {
    deductions += 15;
    flags.push('Freeze authority active — deployer can freeze your tokens');
  }

  // Mutable metadata on a young token
  if (input.mutableMetadata && input.age < SEVEN_DAYS_MS) {
    deductions += 5;
    flags.push('Mutable metadata on a new token — name and image can be changed');
  }

  // Transfer fee
  if (input.transferFeeEnable) {
    const feePct = input.transferFeeBps / 100;
    if (input.transferFeeBps > 500) {
      deductions += 10;
      flags.push(`High transfer fee enabled (${feePct.toFixed(2)}%)`);
    } else {
      deductions += 3;
      flags.push(`Transfer fee enabled (${feePct.toFixed(2)}%)`);
    }
  }

  const points = Math.max(0, MAX - deductions);
  return { points, max: MAX, flags };
}