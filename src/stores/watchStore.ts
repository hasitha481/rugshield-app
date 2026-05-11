// src/stores/watchStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Hard cap on watched tokens. Matches the master plan spec. */
export const WATCHLIST_MAX = 50;

const STORAGE_KEY = 'rugshield:watchlist';
const STORAGE_VERSION = 1;

export interface WatchlistEntry {
  address: string;
  symbol: string;
  name: string;
  /** Score at the moment the user added the token — frozen for delta calc. */
  initialScore: number;
  /** Most recently observed score, updated by useWatchlistRefresh. */
  lastScore: number;
  addedAt: number;
  lastUpdatedAt: number;
}

export interface AddInput {
  address: string;
  symbol: string;
  name: string;
  /** Becomes both initialScore and lastScore. */
  score: number;
}

interface WatchState {
  entries: WatchlistEntry[];

  // --- Actions ---
  add: (input: AddInput) => boolean;
  remove: (address: string) => void;
  updateScore: (address: string, score: number) => void;
  clear: () => void;

  // --- Selectors (imperative) ---
  has: (address: string) => boolean;
  getEntry: (address: string) => WatchlistEntry | undefined;
}

export const useWatchStore = create<WatchState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: ({ address, symbol, name, score }) => {
        const state = get();
        // Reject duplicates
        if (state.entries.some((e) => e.address === address)) return false;
        // Reject at capacity
        if (state.entries.length >= WATCHLIST_MAX) return false;

        const now = Date.now();
        const entry: WatchlistEntry = {
          address,
          symbol,
          name,
          initialScore: score,
          lastScore: score,
          addedAt: now,
          lastUpdatedAt: now,
        };
        // New entries land at the top.
        set({ entries: [entry, ...state.entries] });
        return true;
      },

      remove: (address) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.address !== address),
        })),

      updateScore: (address, score) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.address === address
              ? { ...e, lastScore: score, lastUpdatedAt: Date.now() }
              : e,
          ),
        })),

      clear: () => set({ entries: [] }),

      has: (address) => get().entries.some((e) => e.address === address),
      getEntry: (address) => get().entries.find((e) => e.address === address),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only entries are durable — actions are re-bound on rehydrate.
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

/**
 * Reactive convenience selector: true when the given address is currently
 * in the watchlist. Pass null/undefined to safely return false.
 */
export function useIsWatched(address: string | null | undefined): boolean {
  return useWatchStore((s) =>
    address ? s.entries.some((e) => e.address === address) : false,
  );
}