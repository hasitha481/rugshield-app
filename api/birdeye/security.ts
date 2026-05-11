// api/birdeye/security.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv, EnvValidationError } from '../_lib/env.js';
import { handlePreflight } from '../_lib/cors.js';

const BIRDEYE_BASE = 'https://public-api.birdeye.so';
const BIRDEYE_PATH = '/defi/token_security';

const CACHE_TTL_SECONDS = 60;

/**
 * Loose Solana base58 address sanity check.
 * Real validation lives in the frontend via @solana/web3.js PublicKey;
 * this is just to reject obvious garbage before paying for an upstream call.
 */
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
    res.status(400).json({
      error: 'Missing required query parameter: address',
    });
    return;
  }

  if (!SOLANA_ADDRESS_REGEX.test(address)) {
    res.status(400).json({
      error: 'Invalid Solana address format',
    });
    return;
  }

  let env;
  try {
    env = getEnv();
  } catch (err) {
    const message =
      err instanceof EnvValidationError
        ? err.message
        : 'Server misconfigured';
    res.status(500).json({ error: message });
    return;
  }

  const upstreamUrl = `${BIRDEYE_BASE}${BIRDEYE_PATH}?address=${encodeURIComponent(address)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': env.BIRDEYE_API_KEY,
      },
    });

    // Birdeye returns 404 for tokens it has no security record for.
    // Surface this as a structured `null` payload so the frontend can
    // decide how to render (typically: "INSUFFICIENT DATA" badge).
    if (upstream.status === 404) {
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
      );
      res.setHeader('X-RugShield-Source', 'birdeye/security');
      res.status(200).json({ success: false, data: null });
      return;
    }

    if (upstream.status === 429) {
      res.setHeader('Retry-After', '5');
      res.status(429).json({
        error: 'Birdeye rate limit hit',
        retryAfterSeconds: 5,
      });
      return;
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      res.status(upstream.status >= 500 ? 502 : upstream.status).json({
        error: `Birdeye upstream error (${upstream.status})`,
        detail: detail.slice(0, 500),
      });
      return;
    }

    const body = (await upstream.json()) as unknown;

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
    );
    res.setHeader('X-RugShield-Source', 'birdeye/security');
    res.status(200).json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({
      error: 'Failed to reach Birdeye',
      detail: message,
    });
  }
}