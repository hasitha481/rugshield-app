// api/birdeye/trade-data.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePreflight } from '../_lib/cors';
import { EnvValidationError } from '../_lib/env';
import {
  birdeyeGet,
  BirdeyeRateLimitError,
  BirdeyeUpstreamError,
} from '../_lib/birdeyeClient';

const ROUTE_LABEL = 'birdeye/trade-data';
const CACHE_TTL_SECONDS = 60;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

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

  const address =
    typeof req.query.address === 'string' ? req.query.address.trim() : '';

  if (!address) {
    res.status(400).json({ error: 'Missing required query parameter: address' });
    return;
  }
  if (!SOLANA_ADDRESS_REGEX.test(address)) {
    res.status(400).json({ error: 'Invalid Solana address format' });
    return;
  }

  try {
    const result = await birdeyeGet(
      '/defi/v3/token/trade-data/single',
      { address },
      { cacheTtlSeconds: CACHE_TTL_SECONDS },
    );

    res.setHeader('X-RugShield-Source', ROUTE_LABEL);
    res.setHeader('X-RugShield-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
    );

    if (result.status === 404) {
      res.status(200).json({ success: false, data: null });
      return;
    }
    res.status(200).json(result.data);
  } catch (err) {
    if (err instanceof BirdeyeRateLimitError) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
      res.status(429).json({
        error: 'Birdeye rate limit hit',
        retryAfterSeconds: err.retryAfterSeconds,
      });
      return;
    }
    if (err instanceof BirdeyeUpstreamError) {
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
      error: 'Failed to reach Birdeye',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}