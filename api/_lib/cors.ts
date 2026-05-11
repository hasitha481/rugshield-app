// api/_lib/cors.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With';

/**
 * In production, restrict to PUBLIC_URL if set; otherwise wildcard.
 * In dev/preview, wildcard so localhost and Vercel preview URLs work.
 */
function resolveAllowedOrigin(): string {
  const isProd = process.env.VERCEL_ENV === 'production';
  if (isProd) {
    const allowed = process.env.PUBLIC_URL?.trim();
    return allowed && allowed.length > 0 ? allowed : '*';
  }
  return '*';
}

export function applyCors(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', resolveAllowedOrigin());
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

/**
 * Handles CORS preflight. Returns true if the request was a preflight
 * and has been responded to — caller should `return` immediately.
 */
export function handlePreflight(
  req: VercelRequest,
  res: VercelResponse,
): boolean {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}