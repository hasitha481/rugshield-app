// src/lib/score/index.ts
import { authorityPillar } from './pillars/authority';
import { concentrationPillar } from './pillars/concentration';
import { liquidityPillar } from './pillars/liquidity';
import { deployerPillar } from './pillars/deployer';
import { marketHealthPillar } from './pillars/marketHealth';
import { authenticityPillar } from './pillars/authenticity';
import { scoreToBucket } from './buckets';
import type {
  ScoreResult,
  ScorePillars,
  ScoreMeta,
  PillarBreakdown,
  DataQuality,
  LockInfo,
  AuthorityInput,
  ConcentrationInput,
  LiquidityInput,
  DeployerInput,
  MarketHealthInput,
  AuthenticityInput,
} from './types';

/* ---------------------------------------------------------------------------
 * Birdeye payload shapes
 *
 * Every field is optional and nullable on purpose. Real Birdeye responses
 * frequently omit fields, return null, or vary across token types
 * (SPL vs Token-2022). The orchestrator below treats all of these uniformly.
 * ------------------------------------------------------------------------- */

export interface BirdeyeSecurity {
  freezeAuthority?: string | null;
  mintAuthority?: string | null;
  mutableMetadata?: boolean | null;
  top10HolderPercent?: number | null;
  top10UserPercent?: number | null;
  transferFeeEnable?: boolean | null;
  transferFeeData?: { feeBps?: number | null } | null;
  nonTransferable?: boolean | null;
  /** Token creation time. Birdeye returns this in seconds OR ms — we detect. */
  creationTime?: number | null;
  creatorAddress?: string | null;
  creatorPercentage?: number | null;
  ownerAddress?: string | null;
  ownerPercentage?: number | null;
  /**
   * Lock metadata. Shape varies — we extract `unlockTime` / `unlockTimestamp` /
   * `endTime` if present. `null` here means "no LP lock detected".
   */
  lockInfo?: Record<string, unknown> | null;
  fakeToken?: boolean | null;
  jupStrictList?: boolean | null;
  isToken2022?: boolean | null;
}

export interface BirdeyeOverview {
  name?: string | null;
  symbol?: string | null;
  decimals?: number | null;
  liquidity?: number | null;
  mc?: number | null;
  fdv?: number | null;
  holder?: number | null;
  numberMarkets?: number | null;
  priceChange24hPercent?: number | null;
  v24hUSD?: number | null;
  uniqueWallet24h?: number | null;
  trade24h?: number | null;
  logoURI?: string | null;
}

export interface BirdeyeTradeData {
  uniqueWallet24h?: number | null;
  trade24h?: number | null;
}

export interface ComputeScoreInput {
  address: string;
  security: BirdeyeSecurity | null;
  overview: BirdeyeOverview | null;
  tradeData: BirdeyeTradeData | null;
}

/* ---------------------------------------------------------------------------
 * Main entry point
 * ------------------------------------------------------------------------- */

/**
 * Compute a Safety Score for the given token from raw Birdeye payloads.
 *
 * Behavior:
 * - If `security` is null (Birdeye 404'd it), returns a hardcoded
 *   INSUFFICIENT result with score 25 and a "not yet indexed" flag.
 * - Otherwise runs all 6 pillars, sums their points, then:
 *     - PARTIAL (one or more pillars had no usable data): caps score at 60.
 *     - COMPLETE: returns the raw computed score.
 *
 * Pure function — same input always produces the same output (modulo
 * `Date.now()` for the `computedAt` timestamp).
 */
export function computeScore(input: ComputeScoreInput): ScoreResult {
  const { address, security, overview, tradeData } = input;
  const now = Date.now();

  // INSUFFICIENT: no security data at all.
  if (security === null) {
    return buildInsufficientResult(address, overview, now);
  }

  const age = computeAge(security.creationTime ?? null, now);
  const lockInfo = buildLockInfo(security);

  // ---------------------------------------------------------------------
  // Build pillar inputs from raw payloads
  // ---------------------------------------------------------------------

  const authorityInput: AuthorityInput = {
    freezeAuthority: security.freezeAuthority ?? null,
    mintAuthority: security.mintAuthority ?? null,
    mutableMetadata: Boolean(security.mutableMetadata),
    transferFeeEnable: Boolean(security.transferFeeEnable),
    transferFeeBps: numberOr(security.transferFeeData?.feeBps, 0),
    nonTransferable: Boolean(security.nonTransferable),
    age,
  };

  const concentrationInput: ConcentrationInput = {
    top10UserPercent: numberOrNull(security.top10UserPercent),
    top10HolderPercent: numberOrNull(security.top10HolderPercent),
  };

  const liquidityInput: LiquidityInput = {
    lockInfo,
    liquidity: numberOr(overview?.liquidity, 0),
    numberMarkets: numberOrNull(overview?.numberMarkets),
  };

  const deployerInput: DeployerInput = {
    creatorPercentage: numberOrNull(security.creatorPercentage),
    ownerPercentage: numberOrNull(security.ownerPercentage),
    lockInfo,
    age,
  };

  const marketHealthInput: MarketHealthInput = {
    liquidity: numberOr(overview?.liquidity, 0),
    holder: numberOrNull(overview?.holder),
    priceChange24hPercent: numberOrNull(overview?.priceChange24hPercent),
    age,
  };

  const authenticityInput: AuthenticityInput = {
    fakeToken: Boolean(security.fakeToken),
    jupStrictList: security.jupStrictList ?? null,
    age,
    uniqueWallet24h: numberOrNull(
      overview?.uniqueWallet24h ?? tradeData?.uniqueWallet24h,
    ),
    trade24h: numberOrNull(overview?.trade24h ?? tradeData?.trade24h),
  };

  // ---------------------------------------------------------------------
  // Run pillars
  // ---------------------------------------------------------------------

  const pillars: ScorePillars = {
    authority: authorityPillar(authorityInput),
    concentration: concentrationPillar(concentrationInput),
    liquidity: liquidityPillar(liquidityInput),
    deployer: deployerPillar(deployerInput),
    marketHealth: marketHealthPillar(marketHealthInput),
    authenticity: authenticityPillar(authenticityInput),
  };

  const totalPoints =
    pillars.authority.points +
    pillars.concentration.points +
    pillars.liquidity.points +
    pillars.deployer.points +
    pillars.marketHealth.points +
    pillars.authenticity.points;

  // ---------------------------------------------------------------------
  // Data quality + final score capping
  // ---------------------------------------------------------------------

  const dataQuality = determineDataQuality(security, overview, tradeData);

  let finalScore = totalPoints;
  if (dataQuality === 'PARTIAL') {
    finalScore = Math.min(finalScore, 60);
  }
  finalScore = clamp(finalScore, 0, 100);

  const meta: ScoreMeta = {
    tokenName: overview?.name ?? 'Unknown Token',
    symbol: overview?.symbol ?? '???',
    age,
    liquidity: numberOr(overview?.liquidity, 0),
    holder: numberOr(overview?.holder, 0),
    computedAt: now,
  };

  return {
    address,
    score: finalScore,
    bucket: scoreToBucket(finalScore),
    pillars,
    meta,
    dataQuality,
  };
}

/* ---------------------------------------------------------------------------
 * Internal helpers
 * ------------------------------------------------------------------------- */

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const SECONDS_VS_MS_THRESHOLD = 1e12; // anything below this is interpreted as seconds

/**
 * Convert Birdeye's `creationTime` (which may be seconds OR milliseconds) to
 * an age in milliseconds. When unknown, returns 1 year so age-gated deductions
 * don't false-trigger; data quality is tracked separately.
 */
function computeAge(creationTime: number | null, now: number): number {
  if (creationTime === null || !Number.isFinite(creationTime)) {
    return ONE_YEAR_MS;
  }
  const ms =
    creationTime > SECONDS_VS_MS_THRESHOLD ? creationTime : creationTime * 1000;
  return Math.max(0, now - ms);
}

/**
 * Try to extract a meaningful `unlockTimestamp` from Birdeye's varied
 * `lockInfo` shapes. If lockInfo exists at all but no recognizable unlock
 * field is found, returns `{ unlockTimestamp: null }` (treated as locked
 * but with unknown duration — the liquidity pillar handles this gracefully).
 */
function buildLockInfo(security: BirdeyeSecurity): LockInfo | null {
  const raw = security.lockInfo;
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;

  const candidates = [
    'unlockTime',
    'unlockTimestamp',
    'endTime',
    'unlock_at',
    'unlockAt',
  ] as const;

  for (const key of candidates) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      const ms = value > SECONDS_VS_MS_THRESHOLD ? value : value * 1000;
      return { unlockTimestamp: ms };
    }
  }

  return { unlockTimestamp: null };
}

/**
 * Decide whether the available data is COMPLETE or PARTIAL. We mark PARTIAL
 * only when a pillar has NO usable inputs — partial data within a pillar
 * (e.g. one of two percentage fields available) is still considered complete.
 */
function determineDataQuality(
  security: BirdeyeSecurity,
  overview: BirdeyeOverview | null,
  tradeData: BirdeyeTradeData | null,
): DataQuality {
  let issues = 0;

  // Concentration: needs at least one of the two percentage fields.
  if (
    numberOrNull(security.top10UserPercent) === null &&
    numberOrNull(security.top10HolderPercent) === null
  ) {
    issues++;
  }

  // Liquidity & Market Health: both depend on overview.liquidity. Counts once.
  if (numberOrNull(overview?.liquidity) === null) {
    issues++;
  }

  // Authenticity: needs at least one signal (fakeToken, jupStrictList, or
  // a usable wash-trade ratio).
  const hasFakeToken =
    security.fakeToken !== null && security.fakeToken !== undefined;
  const hasJupStrict =
    security.jupStrictList !== null && security.jupStrictList !== undefined;
  const uw = numberOrNull(
    overview?.uniqueWallet24h ?? tradeData?.uniqueWallet24h,
  );
  const td = numberOrNull(overview?.trade24h ?? tradeData?.trade24h);
  const hasTradeRatio = uw !== null && td !== null && td > 0;

  if (!hasFakeToken && !hasJupStrict && !hasTradeRatio) {
    issues++;
  }

  return issues > 0 ? 'PARTIAL' : 'COMPLETE';
}

/**
 * Build the synthetic ScoreResult returned when Birdeye has no security
 * record for the token. Score is hardcoded to 25 (DANGER bucket) per spec.
 */
function buildInsufficientResult(
  address: string,
  overview: BirdeyeOverview | null,
  now: number,
): ScoreResult {
  const empty = (max: number, flags: string[] = []): PillarBreakdown => ({
    points: 0,
    max,
    flags,
  });

  return {
    address,
    score: 25,
    bucket: scoreToBucket(25),
    pillars: {
      authority: empty(20),
      concentration: empty(20),
      liquidity: empty(20),
      deployer: empty(15),
      marketHealth: empty(15),
      authenticity: empty(10, [
        'Token not yet indexed by Birdeye — likely under 2 hours old',
      ]),
    },
    meta: {
      tokenName: overview?.name ?? 'Unknown Token',
      symbol: overview?.symbol ?? '???',
      age: 0,
      liquidity: numberOr(overview?.liquidity, 0),
      holder: numberOr(overview?.holder, 0),
      computedAt: now,
    },
    dataQuality: 'INSUFFICIENT',
  };
}

function numberOr(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}