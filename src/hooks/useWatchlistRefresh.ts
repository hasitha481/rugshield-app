// src/hooks/useWatchlistRefresh.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BirdeyeNoDataError,
  BirdeyeRateLimitError,
  BirdeyeUpstreamError,
  fetchScoreForToken,
} from '@/lib/score/fetchScore';
import { setCachedScore } from '@/lib/score/scanCache';
import { useWatchStore } from '@/stores/watchStore';

/* ---------------------------------------------------------------------------
 * Tuning constants — all chosen for Birdeye's free tier rate budget.
 * Free tier ≈ 60 requests/min. With 3 requests per token, that's
 * 20 tokens/min absolute max. We pace much more conservatively.
 * ------------------------------------------------------------------------- */

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;     // 5 min between cycles
const DELAY_BETWEEN_TOKENS_MS = 2_000;          // 2s between tokens
const PER_TOKEN_MIN_AGE_MS = 4 * 60 * 1000;     // skip if updated <4min ago
const RATE_LIMIT_COOLDOWN_MS = 3 * 60 * 1000;   // 3min freeze after 429

export interface UseWatchlistRefreshReturn {
  refreshNow: () => void;
  isRefreshing: boolean;
  lastRefreshAt: number | null;
  rateLimitedUntil: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

export function useWatchlistRefresh(): UseWatchlistRefreshReturn {
  const hasEntries = useWatchStore((s) => s.entries.length > 0);
  const updateScore = useWatchStore((s) => s.updateScore);

  const isRefreshingRef = useRef(false);
  const rateLimitedUntilRef = useRef<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    // Honor the cooldown window from any earlier 429.
    if (Date.now() < rateLimitedUntilRef.current) return;

    const snapshot = useWatchStore.getState().entries;
    if (snapshot.length === 0) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setLastRefreshAt(Date.now());

    try {
      for (const entry of snapshot) {
        // Skip if user removed mid-cycle.
        if (!useWatchStore.getState().has(entry.address)) continue;

        // Per-token throttle — don't re-fetch tokens we just updated.
        // This is the single biggest rate-limit-saver: a 50-token watchlist
        // where 40 were recently updated only fetches 10 tokens per cycle.
        if (Date.now() - entry.lastUpdatedAt < PER_TOKEN_MIN_AGE_MS) {
          continue;
        }

        try {
          const result = await fetchScoreForToken(entry.address);
          // Re-check existence — user may have removed during the fetch.
          if (useWatchStore.getState().has(entry.address)) {
            updateScore(entry.address, result.score);
            setCachedScore(entry.address, result.score, result.bucket);
          }
        } catch (err) {
          // **The critical fix for Bug 1: never let a failed fetch
          // silently downgrade the score. Each branch retains the old.**

          if (err instanceof BirdeyeRateLimitError) {
            // Stop the entire cycle and enter cooldown.
            const cooldownUntil = Math.max(
              Date.now() + RATE_LIMIT_COOLDOWN_MS,
              Date.now() + err.retryAfterSeconds * 1000,
            );
            rateLimitedUntilRef.current = cooldownUntil;
            setRateLimitedUntil(cooldownUntil);
            // eslint-disable-next-line no-console
            console.warn(
              `[RugShield] Birdeye rate limit hit. Cooling down until`,
              new Date(cooldownUntil).toISOString(),
            );
            break;
          }

          if (err instanceof BirdeyeNoDataError) {
            // Token genuinely has no data — log but retain old score.
            // (Future: surface a "delisted" badge on the row.)
            // eslint-disable-next-line no-console
            console.warn(`[RugShield] No Birdeye data for ${entry.address}`);
            // continue to next token
          } else if (err instanceof BirdeyeUpstreamError) {
            // Network/5xx — retain old score, retry next cycle.
            // eslint-disable-next-line no-console
            console.warn(
              `[RugShield] Birdeye upstream error (${err.status}) for ${entry.address}`,
            );
            // continue to next token
          }
          // Unknown error: also retain.
        }

        await sleep(DELAY_BETWEEN_TOKENS_MS);
      }

      // Clear cooldown indicator if we finished without hitting one.
      if (rateLimitedUntilRef.current <= Date.now()) {
        rateLimitedUntilRef.current = 0;
        setRateLimitedUntil(null);
      }
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [updateScore]);

  useEffect(() => {
    if (!hasEntries) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasEntries, refresh]);

  return {
    refreshNow: () => void refresh(),
    isRefreshing,
    lastRefreshAt,
    rateLimitedUntil,
  };
}