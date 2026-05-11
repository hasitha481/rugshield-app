// src/stores/swapStore.ts
import { create } from 'zustand';
import type { DFlowQuote } from '@/lib/dflow/types';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const DEFAULT_SLIPPAGE_BPS = 50; 
const MIN_SLIPPAGE_BPS = 1;
const MAX_SLIPPAGE_BPS = 5000; 

export type SwapStatus =
  | 'IDLE'        
  | 'QUOTING'     
  | 'READY'       
  | 'SIGNING'     
  | 'CONFIRMING'  
  | 'SUCCESS'     
  | 'ERROR';      

interface SwapState {
  inputMint: string | null;
  inputSymbol: string;
  inputDecimals: number;
  outputMint: string;
  outputSymbol: string;
  outputDecimals: number;

  inputAmount: string;
  slippageBps: number;
  override: boolean;

  quote: DFlowQuote | null;

  status: SwapStatus;
  error: string | null;
  txSignature: string | null;

  quoteRequestId: number;

  setInputToken: (mint: string, symbol: string, decimals: number) => void;
  setOutputToken: (mint: string, symbol: string, decimals: number) => void;
  
  // NEW: Flip tokens
  flipTokens: () => void;

  setInputAmount: (amount: string) => void;
  setSlippageBps: (bps: number) => void;
  setOverride: (override: boolean) => void;

  startQuoting: () => number;
  setQuote: (requestId: number, quote: DFlowQuote) => void;
  setQuoteError: (requestId: number, error: string) => void;

  setSigning: () => void;
  setConfirming: (signature: string) => void;
  setSuccess: () => void;
  setExecutionError: (error: string) => void;

  reset: () => void;
}

export const useSwapStore = create<SwapState>((set, get) => ({
  inputMint: null,
  inputSymbol: '',
  inputDecimals: 6,
  outputMint: SOL_MINT,
  outputSymbol: 'SOL',
  outputDecimals: 9,

  inputAmount: '',
  slippageBps: DEFAULT_SLIPPAGE_BPS,
  override: false,

  quote: null,

  status: 'IDLE',
  error: null,
  txSignature: null,

  quoteRequestId: 0,

  setInputToken: (mint, symbol, decimals) =>
    set({
      inputMint: mint,
      inputSymbol: symbol,
      inputDecimals: decimals,
      quote: null,
      status: 'IDLE',
      error: null,
      txSignature: null,
    }),

  setOutputToken: (mint, symbol, decimals) =>
    set({
      outputMint: mint,
      outputSymbol: symbol,
      outputDecimals: decimals,
      quote: null,
      status: 'IDLE',
      error: null,
    }),

  // NEW: Flip tokens logic
  flipTokens: () => {
    const state = get();
    if (state.status === 'SIGNING' || state.status === 'CONFIRMING') return;

    set({
      inputMint: state.outputMint,
      inputSymbol: state.outputSymbol,
      inputDecimals: state.outputDecimals,
      outputMint: state.inputMint,
      outputSymbol: state.inputSymbol,
      outputDecimals: state.inputDecimals,
      
      inputAmount: '',
      quote: null,
      status: 'IDLE',
      error: null,
      txSignature: null,
      quoteRequestId: state.quoteRequestId + 1,
    });
  },

  setInputAmount: (amount) => {
    const state = get();
    if (state.status === 'SIGNING' || state.status === 'CONFIRMING') return;

    const trimmed = amount.trim();
    if (trimmed === '' || /^0+\.?0*$/.test(trimmed)) {
      set({ inputAmount: amount, quote: null, status: 'IDLE', error: null, txSignature: null });
      return;
    }

    if (state.status === 'SUCCESS' || state.status === 'ERROR') {
      set({ inputAmount: amount, status: 'IDLE', error: null, txSignature: null });
      return;
    }
    set({ inputAmount: amount });
  },

  setSlippageBps: (bps) => {
    const state = get();
    if (state.status === 'SIGNING' || state.status === 'CONFIRMING') return;
    const clamped = Math.max(MIN_SLIPPAGE_BPS, Math.min(MAX_SLIPPAGE_BPS, Math.round(bps)));
    set({
      slippageBps: clamped,
      quote: null,
      status: state.inputAmount.trim() ? 'IDLE' : state.status,
    });
  },

  setOverride: (override) => set({ override }),

  startQuoting: () => {
    const nextId = get().quoteRequestId + 1;
    set({ quoteRequestId: nextId, status: 'QUOTING', error: null });
    return nextId;
  },

  setQuote: (requestId, quote) => {
    if (requestId !== get().quoteRequestId) return; 
    set({ quote, status: 'READY', error: null });
  },

  setQuoteError: (requestId, error) => {
    if (requestId !== get().quoteRequestId) return; 
    set({ quote: null, status: 'ERROR', error });
  },

  setSigning: () => set({ status: 'SIGNING', error: null, txSignature: null }),
  setConfirming: (signature) => set({ status: 'CONFIRMING', txSignature: signature }),
  setSuccess: () => set({ status: 'SUCCESS' }),
  setExecutionError: (error) => set({ status: 'ERROR', error }),

  reset: () =>
    set((s) => ({
      inputAmount: '',
      quote: null,
      status: 'IDLE',
      error: null,
      txSignature: null,
      override: false,
      quoteRequestId: s.quoteRequestId + 1, 
    })),
}));