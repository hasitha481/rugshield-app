// src/stores/settingsStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DEFAULT_SWAP_THRESHOLD = 60;
export const DEFAULT_SLIPPAGE_BPS = 50;
export const MIN_THRESHOLD = 0;
export const MAX_THRESHOLD = 100;

const STORAGE_KEY = 'rugshield:settings';
const STORAGE_VERSION = 1;

interface SettingsState {
  /** Score below which a swap requires explicit override. */
  swapThreshold: number;
  /** Default slippage tolerance applied when a swap session starts. */
  defaultSlippageBps: number;

  setSwapThreshold: (threshold: number) => void;
  setDefaultSlippageBps: (bps: number) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      swapThreshold: DEFAULT_SWAP_THRESHOLD,
      defaultSlippageBps: DEFAULT_SLIPPAGE_BPS,

      setSwapThreshold: (threshold) => {
        const clamped = Math.max(
          MIN_THRESHOLD,
          Math.min(MAX_THRESHOLD, Math.round(threshold)),
        );
        set({ swapThreshold: clamped });
      },

      setDefaultSlippageBps: (bps) => {
        const clamped = Math.max(1, Math.min(5000, Math.round(bps)));
        set({ defaultSlippageBps: clamped });
      },

      resetToDefaults: () =>
        set({
          swapThreshold: DEFAULT_SWAP_THRESHOLD,
          defaultSlippageBps: DEFAULT_SLIPPAGE_BPS,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);