// api/birdeye/token-list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePreflight } from '../_lib/cors';
import { EnvValidationError } from '../_lib/env';
import {
  birdeyeGet,
  BirdeyeRateLimitError,
  BirdeyeUpstreamError,
} from '../_lib/birdeyeClient';

const ROUTE_LABEL = 'birdeye/token-list';
const CACHE_TTL_SECONDS = 600; // trending list changes slowly

const ALLOWED_SORT_BY = new Set(['v24hUSD', 'mc', 'liquidity', 'v24hChangePercent']);
const ALLOWED_SORT_TYPE = new Set(['asc', 'desc']);

const DEFAULT_SORT_BY = 'v24hUSD';
const DEFAULT_SORT_TYPE = 'desc';
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_MIN_LIQUIDITY = 100;

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function pickInt(value: unknown, fallback: number, max?: number): number {
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  if (max !== undefined && parsed > max) return max;
  return parsed;
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

  const sortBy = pickString(req.query.sort_by) ?? DEFAULT_SORT_BY;
  const sortType = pickString(req.query.sort_type) ?? DEFAULT_SORT_TYPE;
  const offset = pickInt(req.query.offset, DEFAULT_OFFSET);
  const limit = pickInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const minLiquidity = pickInt(req.query.min_liquidity, DEFAULT_MIN_LIQUIDITY);

  if (!ALLOWED_SORT_BY.has(sortBy)) {
    res.status(400).json({
      error: `Invalid sort_by. Allowed: ${Array.from(ALLOWED_SORT_BY).join(', ')}`,
    });
    return;
  }
  if (!ALLOWED_SORT_TYPE.has(sortType)) {
    res.status(400).json({ error: 'Invalid sort_type. Allowed: asc, desc' });
    return;
  }

  try {
    const result = await birdeyeGet(
      '/defi/tokenlist',
      {
        sort_by: sortBy,
        sort_type: sortType,
        offset,
        limit,
        min_liquidity: minLiquidity,
      },
      { cacheTtlSeconds: CACHE_TTL_SECONDS },
    );

    res.setHeader('X-RugShield-Source', ROUTE_LABEL);
    res.setHeader('X-RugShield-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=600`,
    );

    res.status(200).json(result.data ?? { success: false, data: null });
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