// api/dflow/swap-instructions.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePreflight } from '../_lib/cors.js';
import { EnvValidationError } from '../_lib/env.js';
import {
  dflowPost,
  DFlowRateLimitError,
  DFlowUpstreamError,
} from '../_lib/dflowClient.js';

const ROUTE_LABEL = 'dflow/swap-instructions';
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface SwapInstructionsBody {
  quote?: unknown;
  userPublicKey?: unknown;
  // Optional pass-through fields some DFlow versions support:
  wrapAndUnwrapSol?: unknown;
  prioritizationFeeLamports?: unknown;
  computeUnitPriceMicroLamports?: unknown;
}

function parseBody(raw: unknown): SwapInstructionsBody | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as SwapInstructionsBody;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as SwapInstructionsBody;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({
      error: 'Missing or invalid JSON body',
    });
    return;
  }

  if (!body.quote || typeof body.quote !== 'object') {
    res.status(400).json({
      error: 'Missing required field: quote (object)',
    });
    return;
  }

  if (typeof body.userPublicKey !== 'string') {
    res.status(400).json({
      error: 'Missing required field: userPublicKey (string)',
    });
    return;
  }

  const userPublicKey = body.userPublicKey.trim();
  if (!SOLANA_ADDRESS_REGEX.test(userPublicKey)) {
    res.status(400).json({
      error: 'Invalid userPublicKey — not a valid Solana address',
    });
    return;
  }

  // Construct upstream payload. Forward only known/expected fields to avoid
  // accidentally surfacing client-injected garbage to DFlow.
  const upstreamPayload: Record<string, unknown> = {
    quote: body.quote,
    userPublicKey,
  };
  if (body.wrapAndUnwrapSol !== undefined) {
    upstreamPayload.wrapAndUnwrapSol = body.wrapAndUnwrapSol;
  }
  if (body.prioritizationFeeLamports !== undefined) {
    upstreamPayload.prioritizationFeeLamports = body.prioritizationFeeLamports;
  }
  if (body.computeUnitPriceMicroLamports !== undefined) {
    upstreamPayload.computeUnitPriceMicroLamports = body.computeUnitPriceMicroLamports;
  }

  try {
    const data = await dflowPost('/swap-instructions', upstreamPayload);

    res.setHeader('X-RugShield-Source', ROUTE_LABEL);
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