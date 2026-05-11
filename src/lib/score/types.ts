// src/lib/score/types.ts

/* ---------------------------------------------------------------------------
 * Core enums
 * ------------------------------------------------------------------------- */

export type ScoreBucket = 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'DANGER';

/**
 * Confidence level of the score given upstream data availability.
 * - COMPLETE:    every pillar received the data it needed.
 * - PARTIAL:     one or more pillars had missing data; final score capped at 60.
 * - INSUFFICIENT: token_security returned null/404; score forced to 25.
 */
export type DataQuality = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';

export type PillarKey =
  | 'authority'
  | 'concentration'
  | 'liquidity'
  | 'deployer'
  | 'marketHealth'
  | 'authenticity';

/* ---------------------------------------------------------------------------
 * Result shapes
 * ------------------------------------------------------------------------- */

export interface PillarBreakdown {
  /** Remaining points after deductions are applied. Always 0..max inclusive. */
  points: number;
  /** Maximum points this pillar can contribute to the total. */
  max: number;
  /** Human-readable red flags this pillar surfaced. */
  flags: string[];
}

export interface ScorePillars {
  authority: PillarBreakdown;
  concentration: PillarBreakdown;
  liquidity: PillarBreakdown;
  deployer: PillarBreakdown;
  marketHealth: PillarBreakdown;
  authenticity: PillarBreakdown;
}

export interface ScoreMeta {
  tokenName: string;
  symbol: string;
  /** Token age in milliseconds. */
  age: number;
  /** Total USD liquidity from token_overview. */
  liquidity: number;
  /** On-chain holder count. */
  holder: number;
  /** When this score was computed (ms epoch). */
  computedAt: number;
}

export interface ScoreResult {
  /** SPL token mint address. */
  address: string;
  /** Final 0..100 score. */
  score: number;
  bucket: ScoreBucket;
  pillars: ScorePillars;
  meta: ScoreMeta;
  dataQuality: DataQuality;
}

/* ---------------------------------------------------------------------------
 * Shared substructures
 * ------------------------------------------------------------------------- */

export interface LockInfo {
  /**
   * Unlock time in milliseconds since epoch. `null` means "lock exists but
   * unlock timing is unknown" — treat as adequately locked for scoring.
   */
  unlockTimestamp: number | null;
}

/* ---------------------------------------------------------------------------
 * Per-pillar input shapes
 *
 * The orchestrator (computeScore) is responsible for normalizing the raw
 * Birdeye payloads into these shapes. Pillars never see Birdeye types directly.
 * ------------------------------------------------------------------------- */

export interface AuthorityInput {
  /**
   * Solana freeze authority. `null` = revoked.
   * The system program address ('11111111111111111111111111111111') is also
   * treated as revoked for our purposes.
   */
  freezeAuthority: string | null;
  /** Mint authority — currently informational only, retained for V2 use. */
  mintAuthority: string | null;
  /** Whether metadata can still be mutated by the update authority. */
  mutableMetadata: boolean;
  /** Token-2022 transfer fee extension enabled. */
  transferFeeEnable: boolean;
  /** Transfer fee in basis points (100 bps = 1%). 0 if no fee. */
  transferFeeBps: number;
  /** Token-2022 non-transferable extension. If true, token cannot be swapped. */
  nonTransferable: boolean;
  /** Token age in milliseconds. */
  age: number;
}

export interface ConcentrationInput {
  /**
   * Share (0..1) of supply held by top 10 wallets EXCLUDING LPs, contracts,
   * and known burn addresses. Preferred signal.
   */
  top10UserPercent: number | null;
  /**
   * Share (0..1) of supply held by raw top 10 wallets including LPs/contracts.
   * Used as fallback when `top10UserPercent` is null.
   */
  top10HolderPercent: number | null;
}

export interface LiquidityInput {
  /** LP lock info, or `null` when LP is unlocked / no lock data exists. */
  lockInfo: LockInfo | null;
  /** Total USD liquidity from token_overview. */
  liquidity: number;
  /** Number of distinct AMM pools / venues this token is listed on. */
  numberMarkets: number | null;
}

export interface DeployerInput {
  /** Share (0..1) of supply still held by the creator wallet. */
  creatorPercentage: number | null;
  /** Share (0..1) of supply held by the current owner/update authority. */
  ownerPercentage: number | null;
  /** Same shape as LiquidityInput.lockInfo — used for the new-token-no-lock combo. */
  lockInfo: LockInfo | null;
  /** Token age in milliseconds. */
  age: number;
}

export interface MarketHealthInput {
  /** Total USD liquidity. */
  liquidity: number;
  /** On-chain holder count. */
  holder: number | null;
  /**
   * Percent change over last 24h, expressed as a number (e.g. 521 = +521%).
   * `null` when token is too new for a 24h window.
   */
  priceChange24hPercent: number | null;
  /** Token age in milliseconds. */
  age: number;
}

export interface AuthenticityInput {
  /** Birdeye's own scam/fake flag. */
  fakeToken: boolean;
  /**
   * Jupiter strict list membership. `null` when Birdeye doesn't report it
   * (we don't want to penalize tokens we can't classify).
   */
  jupStrictList: boolean | null;
  /** Token age in milliseconds. */
  age: number;
  /** Distinct wallet count over last 24h. */
  uniqueWallet24h: number | null;
  /** Total trade count over last 24h. */
  trade24h: number | null;
}