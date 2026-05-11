// src/hooks/useHistoryRecorder.ts
import { useEffect } from 'react';
import { useScanStore } from '@/stores/scanStore';
import { useSwapStore } from '@/stores/swapStore';
import { useHistoryStore } from '@/stores/historyStore';

/**
 * Subscribes globally to scanStore and swapStore and appends successful
 * scans and confirmed swaps to the history log.
 *
 * Mount EXACTLY ONCE at the App level — duplicate mounts would record
 * duplicates because each instance maintains its own dedup cursor.
 */
export function useHistoryRecorder() {
  useEffect(() => {
    // Reference-based dedup for scans: Zustand creates a new currentScan
    // object on every successful scan, so reference equality cleanly
    // separates "same scan rendered again" from "fresh scan of same token".
    let lastScanRef: unknown = null;
    let lastSwapSig: string | null = null;

    const unsubScan = useScanStore.subscribe((state) => {
      const scan = state.currentScan;
      if (!scan) return;
      if (scan === lastScanRef) return;
      lastScanRef = scan;

      useHistoryStore.getState().recordScan({
        address: scan.address,
        symbol: scan.meta.symbol,
        name: scan.meta.tokenName,
        score: scan.score,
        bucket: scan.bucket,
      });
    });

    const unsubSwap = useSwapStore.subscribe((state) => {
      if (state.status !== 'SUCCESS') return;
      if (!state.txSignature || !state.quote) return;
      if (state.txSignature === lastSwapSig) return;
      lastSwapSig = state.txSignature;

      const swap = useSwapStore.getState();
      const scan = useScanStore.getState().currentScan;
      const matchesInput = scan && scan.address === swap.inputMint;

      useHistoryStore.getState().recordSwap({
        inputMint: swap.inputMint ?? '',
        inputSymbol: swap.inputSymbol,
        inputAmount: formatRawAmount(state.quote.inAmount, swap.inputDecimals),
        outputMint: swap.outputMint,
        outputSymbol: swap.outputSymbol,
        outputAmount: formatRawAmount(state.quote.outAmount, swap.outputDecimals),
        txSignature: state.txSignature,
        inputScore: matchesInput ? scan.score : undefined,
        inputBucket: matchesInput ? scan.bucket : undefined,
      });
    });

    return () => {
      unsubScan();
      unsubSwap();
    };
  }, []);
}

function formatRawAmount(raw: string, decimals: number): string {
  try {
    const big = BigInt(raw);
    if (big === 0n) return '0';
    const padded = big.toString().padStart(decimals + 1, '0');
    const wholeIdx = padded.length - decimals;
    const whole = padded.slice(0, wholeIdx) || '0';
    const frac = padded.slice(wholeIdx).replace(/0+$/, '');
    return frac ? `${whole}.${frac.slice(0, 6)}` : whole;
  } catch {
    return '—';
  }
}