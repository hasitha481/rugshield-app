// src/lib/score/scanCache.ts
import type { ScoreBucket } from '@/lib/score/types';

const PREFIX = 'rugshield:scan-cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedScore {
  address: string;
  score: number;
  bucket: ScoreBucket;
  computedAt: number;
}

/**
 * Returns a cached score for this address if it was computed within
 * the TTL window. Cache is sessionStorage-scoped — survives navigation,
 * dies when the tab closes. Conservative TTL keeps demos honest while
 * sparing Birdeye for repeated checks of the same token.
 */
export function getCachedScore(
  address: string,
  ttlMs = DEFAULT_TTL_MS,
): CachedScore | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + address);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedScore;
    if (Date.now() - entry.computedAt > ttlMs) {
      sessionStorage.removeItem(PREFIX + address);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function setCachedScore(
  address: string,
  score: number,
  bucket: ScoreBucket,
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const entry: CachedScore = {
      address,
      score,
      bucket,
      computedAt: Date.now(),
    };
    sessionStorage.setItem(PREFIX + address, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — fail open
  }
}

export function clearScanCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}