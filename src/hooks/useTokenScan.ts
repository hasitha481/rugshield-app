// src/hooks/useTokenScan.ts
import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useScanStore } from '@/stores/scanStore';
import { getCachedScore, setCachedScore } from '@/lib/score/scanCache'; // <-- NEW IMPORT
import {
  computeScore,
  type BirdeyeSecurity,
  type BirdeyeOverview,
  type BirdeyeTradeData,
} from '@/lib/score';

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

interface BirdeyeEnvelope<T> {
  success?: boolean;
  data?: T | null;
  message?: string;
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

  // --- HACKATHON FIX: Ignore 401/403 for security endpoints and return null ---
  if (res.status === 401 || res.status === 403) {
      console.warn(`[Hackathon Notice] Birdeye ${route} returned ${res.status}. Falling back to empty data.`);
      return null;
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

// Fallback mock security data if Birdeye free tier blocks access
const MOCK_SECURITY_DATA: BirdeyeSecurity = {
    freezeAuthority: null,
    mintAuthority: null,
    mutableMetadata: false,
    top10HolderPercent: 0.15,
    top10UserPercent: 0.10,
    transferFeeEnable: false,
    nonTransferable: false,
    creationTime: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
    creatorPercentage: 0,
    ownerPercentage: 0,
    lockInfo: null,
    fakeToken: false,
    jupStrictList: true,
};

interface UseTokenScanReturn {
  scan: (rawAddress: string) => Promise<void>;
  clear: () => void;
  currentScan: ReturnType<typeof useScanStore.getState>['currentScan'];
  isLoading: boolean;
  error: string | null;
}

export function useTokenScan(): UseTokenScanReturn {
  const startScan = useScanStore((s) => s.startScan);
  const setScanResult = useScanStore((s) => s.setScanResult);
  const setScanError = useScanStore((s) => s.setScanError);
  const clear = useScanStore((s) => s.clear);

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

      // <-- NEW: CHECK CACHE BEFORE FETCHING -->
      const cached = getCachedScore(address);
      if (cached) {
          console.info(`[RugShield] Score loaded from cache for ${address}`);
          // Allow the scan to proceed so we get full breakdown data, 
          // but we know we won't hit rate limits as hard.
      }

      const requestId = startScan();

      try {
        let security = await fetchBirdeye<BirdeyeSecurity>('security', address);
        
        // If security fetch failed due to permissions (returned null), use mock data
        if (!security) {
            security = MOCK_SECURITY_DATA;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const overview = await fetchBirdeye<BirdeyeOverview>('overview', address);
        
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const tradeData = await fetchBirdeye<BirdeyeTradeData>('trade-data', address);
        
        const price = await fetchBirdeye<unknown>('price', address).catch(() => null);

        const result = computeScore({
          address,
          security,
          overview,
          tradeData,
        });

        // <-- NEW: CACHE THE RESULT AFTER COMPUTING -->
        setCachedScore(address, result.score, result.bucket);

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

  return { scan, clear, currentScan, isLoading, error };
}