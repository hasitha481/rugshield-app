// src/lib/dflow/types.ts

/**
 * DFlow Trade API types.
 * Mirrors response shapes for /quote and /swap-instructions.
 * Fields are defensive (optional/nullable) because DFlow's response shape
 * can vary across route plans and error scenarios.
 */

export type SwapMode = 'ExactIn' | 'ExactOut';

export type DFlowQuoteErrorType =
  | 'toxic_flow'
  | 'no_route'
  | 'insufficient_liquidity'
  | 'unknown';

export interface DFlowQuoteError {
  type: DFlowQuoteErrorType;
  message: string;
}

export interface RouteHop {
  ammKey: string;
  /** Human-readable venue name (e.g. "Raydium CLMM", "Orca Whirlpool"). */
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount?: string | null;
  feeMint?: string | null;
}

export interface RoutePlanStep {
  swapInfo: RouteHop;
  /** Share of input flowing through this hop, 0–100. */
  percent: number;
}

export interface DFlowQuote {
  inputMint: string;
  outputMint: string;
  /** Raw smallest-unit integer string. */
  inAmount: string;
  /** Raw smallest-unit integer string. */
  outAmount: string;
  /**
   * Minimum out (ExactIn) or maximum in (ExactOut) after slippage.
   * Raw smallest-unit integer string.
   */
  otherAmountThreshold: string;
  swapMode: SwapMode;
  slippageBps: number;
  /** Price impact ratio 0..1. */
  priceImpactPct: number;
  routePlan: RoutePlanStep[];
  contextSlot?: number | null;
  /** Milliseconds DFlow spent computing the quote. */
  timeTaken?: number | null;
  /** Truthy when DFlow's JIT MEV-protected routing was engaged. */
  mevProtected?: boolean | null;
  /** Present when DFlow couldn't (or wouldn't) build a quote. */
  error?: DFlowQuoteError | null;
}

export interface DFlowSwapInstructions {
  /** Base64-encoded VersionedTransaction ready to sign. */
  swapTransaction: string;
  /** Used together with the tx's embedded blockhash for confirmation. */
  lastValidBlockHeight: number;
  /** Priority fee added by DFlow (lamports). */
  prioritizationFeeLamports?: number | null;
  /** Compute unit price (micro-lamports per CU). */
  computeUnitPriceMicroLamports?: number | null;
}