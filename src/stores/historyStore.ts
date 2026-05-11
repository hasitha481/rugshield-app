// src/stores/historyStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ScoreBucket } from '@/lib/score/types';

export const HISTORY_MAX = 100;
const STORAGE_KEY = 'rugshield:history';
const STORAGE_VERSION = 1;

interface BaseEvent {
  id: string;
  timestamp: number;
}

export interface ScanEvent extends BaseEvent {
  type: 'SCAN';
  address: string;
  symbol: string;
  name: string;
  score: number;
  bucket: ScoreBucket;
}

export interface SwapEvent extends BaseEvent {
  type: 'SWAP';
  inputMint: string;
  inputSymbol: string;
  /** Human UI string (e.g. "1.5"), not raw smallest units. */
  inputAmount: string;
  outputMint: string;
  outputSymbol: string;
  outputAmount: string;
  txSignature: string;
  /** Safety score of the input token at swap time, if known. */
  inputScore?: number;
  inputBucket?: ScoreBucket;
}

export type HistoryEvent = ScanEvent | SwapEvent;

interface HistoryState {
  events: HistoryEvent[];
  recordScan: (data: Omit<ScanEvent, 'id' | 'timestamp' | 'type'>) => void;
  recordSwap: (data: Omit<SwapEvent, 'id' | 'timestamp' | 'type'>) => void;
  clear: () => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      events: [],

      recordScan: (data) =>
        set((s) => {
          const event: ScanEvent = {
            ...data,
            type: 'SCAN',
            id: generateId(),
            timestamp: Date.now(),
          };
          return { events: [event, ...s.events].slice(0, HISTORY_MAX) };
        }),

      recordSwap: (data) =>
        set((s) => {
          // Dedup by txSignature — same tx can't be recorded twice.
          if (
            s.events.some(
              (e) => e.type === 'SWAP' && e.txSignature === data.txSignature,
            )
          ) {
            return s;
          }
          const event: SwapEvent = {
            ...data,
            type: 'SWAP',
            id: generateId(),
            timestamp: Date.now(),
          };
          return { events: [event, ...s.events].slice(0, HISTORY_MAX) };
        }),

      clear: () => set({ events: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ events: state.events }),
    },
  ),
);