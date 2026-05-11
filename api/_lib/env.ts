// api/_lib/env.ts

/**
 * Server-side environment access for Vercel serverless functions.
 * Validates required keys lazily on first call and caches the result.
 * NEVER import this file from anywhere under /src — it would leak secrets
 * into the frontend bundle.
 */

interface ServerEnv {
  BIRDEYE_API_KEY: string;
  DFLOW_API_KEY: string | null;
  PUBLIC_URL: string | null;
  IS_PRODUCTION: boolean;
}

let cached: ServerEnv | null = null;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const birdeye = process.env.BIRDEYE_API_KEY?.trim();
  if (!birdeye) {
    throw new EnvValidationError(
      '[RugShield] Missing required env var: BIRDEYE_API_KEY. ' +
        'Set it in .env.local for local development or in the Vercel ' +
        'project dashboard for deployed environments.',
    );
  }

  const dflow = process.env.DFLOW_API_KEY?.trim();
  const publicUrl = process.env.PUBLIC_URL?.trim();

  cached = {
    BIRDEYE_API_KEY: birdeye,
    DFLOW_API_KEY: dflow && dflow.length > 0 ? dflow : null,
    PUBLIC_URL: publicUrl && publicUrl.length > 0 ? publicUrl : null,
    IS_PRODUCTION: process.env.VERCEL_ENV === 'production',
  };

  return cached;
}

/** Test-only helper. */
export function _resetEnvCache() {
  cached = null;
}