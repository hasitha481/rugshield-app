// src/hooks/useTokenScan.ts
import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useScanStore } from '@/stores/scanStore';
import {
  computeScore,
  type BirdeyeSecurity,
  type BirdeyeOverview,
  type BirdeyeTradeData,
} from '@/lib/score';

/* ---------------------------------------------------------------------------
 * Address validation
 *
 * Belt-and-suspenders: a fast regex check for base58 + length, then the full
 * @solana/web3.js PublicKey constructor for cryptographic validity. We skip
 * the network round-trip entirely on invalid input.
 * ------------------------------------------------------------------------- */

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isValidSolanaAddress(address: string): boolean {
  if (!SOLANA_ADDRESS_REGEX.test(address)) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------------------
 * Birdeye proxy fetcher
 *
 * Our /api/birdeye/* proxy passes through Birdeye's standard envelope:
 *   { success: boolean, data: T | null }
 * For 404s (token not indexed) the proxy returns:
 *   200 { success: false, data: null }
 * so callers always get a structured response. Errors only throw on real
 * failures (network, 5xx, 429).
 * ------------------------------------------------------------------------- */

interface BirdeyeEnvelope<T> {
  success?: boolean;
  data?: T | null;
}

class BirdeyeFetchError extends Error {
  constructor(
    public readonly route: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BirdeyeFetchError';
  }
}

async function fetchBirdeye<T>(
  route: string,
  address: string,
  signal?: AbortSignal,
): Promise<T | null> {
  const url = `/api/birdeye/${route}?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (res.status === 429) {
    const detail = (await res.json().catch(() => ({}))) as {
      retryAfterSeconds?: number;
    };
    const retry = detail.retryAfterSeconds ?? 5;
    throw new BirdeyeFetchError(
      route,
      429,
      `Birdeye rate limit hit — try again in ${retry}s`,
    );
  }

  if (!res.ok) {
    throw new BirdeyeFetchError(
      route,
      res.status,
      `Birdeye ${route} request failed (${res.status})`,
    );
  }

  const body = (await res.json()) as BirdeyeEnvelope<T>;
  return body?.data ?? null;
}

/* ---------------------------------------------------------------------------
 * Hook
 * ------------------------------------------------------------------------- */

interface UseTokenScanReturn {
  /** Trigger a scan for the given mint address. Idempotent and race-safe. */
  scan: (rawAddress: string) => Promise<void>;
  /** Reset to empty state and invalidate any in-flight request. */
  clear: () => void;
  /** The most recent successfully computed score, or null. */
  currentScan: ReturnType<typeof useScanStore.getState>['currentScan'];
  /** True between scan invocation and result/error commit. */
  isLoading: boolean;
  /** Last error message, or null. */
  error: string | null;
}

export function useTokenScan(): UseTokenScanReturn {
  // Action selectors are stable references — safe to depend on in useCallback.
  const startScan = useScanStore((s) => s.startScan);
  const setScanResult = useScanStore((s) => s.setScanResult);
  const setScanError = useScanStore((s) => s.setScanError);
  const clear = useScanStore((s) => s.clear);

  // State selectors — re-render the consumer on change.
  const currentScan = useScanStore((s) => s.currentScan);
  const isLoading = useScanStore((s) => s.isLoading);
  const error = useScanStore((s) => s.error);

  const scan = useCallback(
    async (rawAddress: string): Promise<void> => {
      const address = rawAddress.trim();

      if (!isValidSolanaAddress(address)) {
        const requestId = startScan();
        setScanError(requestId, 'Invalid Solana address');
        return;
      }

      const requestId = startScan();

      try {
        // Fire all four endpoints in parallel.
        // Price is fetched eagerly to warm the cache for V2 UI surfaces; its
        // result is intentionally unused in scoring. We catch its errors
        // separately so a price-only failure doesn't fail the whole scan.
        const [security, overview, tradeData] = await Promise.all([
          fetchBirdeye<BirdeyeSecurity>('security', address),
          fetchBirdeye<BirdeyeOverview>('overview', address),
          fetchBirdeye<BirdeyeTradeData>('trade-data', address),
          fetchBirdeye<unknown>('price', address).catch(() => null),
        ]);

        const result = computeScore({
          address,
          security,
          overview,
          tradeData,
        });

        setScanResult(requestId, result);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Scan failed — please try again';
        setScanError(requestId, message);
      }
    },
    [startScan, setScanResult, setScanError],
  );

  return {
    scan,
    clear,
    currentScan,
    isLoading,
    error,
  };
}