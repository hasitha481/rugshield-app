// api/_lib/birdeyeClient.ts
import { getEnv } from './env.js';
import { sharedCache } from './cache.js';

const BIRDEYE_BASE = 'https://public-api.birdeye.so';

export class BirdeyeUpstreamError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`Birdeye upstream error (${status})`);
    this.name = 'BirdeyeUpstreamError';
  }
}

export class BirdeyeRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super('Birdeye rate limit hit');
    this.name = 'BirdeyeRateLimitError';
  }
}

export interface BirdeyeFetchOptions {
  /** If set > 0, response is cached in the shared LRU under this TTL. */
  cacheTtlSeconds?: number;
  signal?: AbortSignal;
}

export interface BirdeyeFetchResult<T = unknown> {
  status: number;
  /** Null when upstream returned 404 (token not in Birdeye database). */
  data: T | null;
  fromCache: boolean;
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(
  path: string,
  query: Record<string, QueryValue>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return `${BIRDEYE_BASE}${path}${qs ? `?${qs}` : ''}`;
}

/**
 * GET helper for Birdeye REST endpoints.
 * - Injects X-API-KEY from env.
 * - Coerces 404 into a structured null payload (don't surface as error).
 * - Surfaces 429 as BirdeyeRateLimitError (route can map to HTTP 429).
 * - Throws BirdeyeUpstreamError for all other non-2xx.
 * - Optional in-memory caching keyed on the full URL.
 */
export async function birdeyeGet<T = unknown>(
  path: string,
  query: Record<string, QueryValue> = {},
  options: BirdeyeFetchOptions = {},
): Promise<BirdeyeFetchResult<T>> {
  const env = getEnv();
  const url = buildUrl(path, query);
  const ttl = options.cacheTtlSeconds ?? 0;
  const cacheKey = `birdeye:${url}`;

  if (ttl > 0) {
    const hit = sharedCache.get(cacheKey) as
      | BirdeyeFetchResult<T>
      | undefined;
    if (hit) return { ...hit, fromCache: true };
  }

  const upstream = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-chain': 'solana',
      'X-API-KEY': env.BIRDEYE_API_KEY,
    },
    signal: options.signal,
  });

  if (upstream.status === 404) {
    const result: BirdeyeFetchResult<T> = {
      status: 404,
      data: null,
      fromCache: false,
    };
    if (ttl > 0) sharedCache.set(cacheKey, result, ttl);
    return result;
  }

  if (upstream.status === 429) {
    const retryAfter = Number(upstream.headers.get('retry-after')) || 5;
    throw new BirdeyeRateLimitError(retryAfter);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    throw new BirdeyeUpstreamError(upstream.status, detail.slice(0, 500));
  }

  const data = (await upstream.json()) as T;
  const result: BirdeyeFetchResult<T> = {
    status: 200,
    data,
    fromCache: false,
  };
  if (ttl > 0) sharedCache.set(cacheKey, result, ttl);
  return result;
}