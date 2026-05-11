// src/stores/scanStore.ts
import { create } from 'zustand';
import type { ScoreResult } from '@/lib/score/types';

interface ScanState {
  /** The most recent successfully computed score, or null. */
  currentScan: ScoreResult | null;
  /** True between startScan() and the matching setScanResult/setScanError. */
  isLoading: boolean;
  /** Last error message; cleared when a new scan starts or completes. */
  error: string | null;
  /**
   * Internal monotonic counter used to discard stale requests. Each
   * startScan() increments it; result/error setters check the ID before
   * committing, so out-of-order responses can never overwrite a newer scan.
   */
  scanRequestId: number;

  /**
   * Begin a new scan. Returns the ID the caller must pass to
   * setScanResult / setScanError when their async work completes.
   */
  startScan: () => number;

  /** Commit a successful scan result if `requestId` is still current. */
  setScanResult: (requestId: number, result: ScoreResult) => void;

  /** Commit an error if `requestId` is still current. */
  setScanError: (requestId: number, message: string) => void;

  /** Reset to empty state. Bumps the request ID so any in-flight scan is discarded. */
  clear: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  currentScan: null,
  isLoading: false,
  error: null,
  scanRequestId: 0,

  startScan: () => {
    const nextId = get().scanRequestId + 1;
    set({
      scanRequestId: nextId,
      isLoading: true,
      error: null,
    });
    return nextId;
  },

  setScanResult: (requestId, result) => {
    if (requestId !== get().scanRequestId) return; // stale — discard
    set({
      currentScan: result,
      isLoading: false,
      error: null,
    });
  },

  setScanError: (requestId, message) => {
    if (requestId !== get().scanRequestId) return; // stale — discard
    set({
      error: message,
      isLoading: false,
    });
  },

  clear: () =>
    set({
      currentScan: null,
      isLoading: false,
      error: null,
      scanRequestId: get().scanRequestId + 1, // invalidate in-flight
    }),
}));