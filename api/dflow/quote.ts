// api/dflow/quote.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePreflight } from '../_lib/cors';
import { EnvValidationError } from '../_lib/env';
import {
  dflowGet,
  DFlowRateLimitError,
  DFlowUpstreamError,
} from '../_lib/dflowClient';

const ROUTE_LABEL = 'dflow/quote';
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
const MAX_SLIPPAGE_BPS = 5000; // 50% — prevents misuse
const ALLOWED_SWAP_MODES = new Set(['ExactIn', 'ExactOut']);

function parseInteger(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (handlePreflight(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const inputMint =
    typeof req.query.inputMint === 'string' ? req.query.inputMint.trim() : '';
  const outputMint =
    typeof req.query.outputMint === 'string' ? req.query.outputMint.trim() : '';
  const amount =
    typeof req.query.amount === 'string' ? req.query.amount.trim() : '';
  const slippageBpsRaw =
    typeof req.query.slippageBps === 'string' ? req.query.slippageBps.trim() : '';
  const swapMode =
    typeof req.query.swapMode === 'string' ? req.query.swapMode.trim() : 'ExactIn';

  // Validate mints
  if (!inputMint || !outputMint) {
    res.status(400).json({
      error: 'Missing required parameters: inputMint, outputMint',
    });
    return;
  }
  if (!SOLANA_ADDRESS_REGEX.test(inputMint) || !SOLANA_ADDRESS_REGEX.test(outputMint)) {
    res.status(400).json({ error: 'Invalid Solana mint address format' });
    return;
  }
  if (inputMint === outputMint) {
    res.status(400).json({ error: 'inputMint and outputMint must differ' });
    return;
  }

  // Validate amount (raw smallest-units integer)
  const amountInt = parseInteger(amount);
  if (amountInt === null || amountInt <= 0) {
    res.status(400).json({
      error: 'Invalid amount — must be a positive integer in smallest units',
    });
    return;
  }

  // Validate slippage
  let slippageBps = DEFAULT_SLIPPAGE_BPS;
  if (slippageBpsRaw) {
    const parsed = parseInteger(slippageBpsRaw);
    if (parsed === null || parsed < 0 || parsed > MAX_SLIPPAGE_BPS) {
      res.status(400).json({
        error: `slippageBps must be an integer between 0 and ${MAX_SLIPPAGE_BPS}`,
      });
      return;
    }
    slippageBps = parsed;
  }

  // Validate swap mode
  if (!ALLOWED_SWAP_MODES.has(swapMode)) {
    res.status(400).json({
      error: `swapMode must be one of: ${Array.from(ALLOWED_SWAP_MODES).join(', ')}`,
    });
    return;
  }

  try {
    const data = await dflowGet('/quote', {
      inputMint,
      outputMint,
      amount: amountInt,
      slippageBps,
      swapMode,
    });

    res.setHeader('X-RugShield-Source', ROUTE_LABEL);
    // Quotes are time-sensitive. Do NOT cache aggressively.
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof DFlowRateLimitError) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
      res.status(429).json({
        error: 'DFlow rate limit hit',
        retryAfterSeconds: err.retryAfterSeconds,
      });
      return;
    }
    if (err instanceof DFlowUpstreamError) {
      res.status(err.status >= 500 ? 502 : err.status).json({
        error: err.message,
        detail: err.detail,
      });
      return;
    }
    if (err instanceof EnvValidationError) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(502).json({
      error: 'Failed to reach DFlow',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}