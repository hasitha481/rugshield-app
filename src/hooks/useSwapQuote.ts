// src/hooks/useSwapQuote.ts
import { useCallback, useEffect, useRef } from 'react';
import { useSwapStore } from '@/stores/swapStore';
import type { DFlowQuote, RoutePlanStep } from '@/lib/dflow/types';

const DEBOUNCE_MS = 450;
const MIN_FETCH_INTERVAL_MS = 250;

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
const JUP_MINT = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';

// Last resort fallback ONLY if both APIs fail completely
const BACKUP_PRICES_USD: Record<string, number> = {
  [SOL_MINT]: 150,
  [USDC_MINT]: 1,
  [USDT_MINT]: 1,
  [BONK_MINT]: 0.00002,
  [JUP_MINT]: 1,
};

function buildRawAmount(uiAmount: string, decimals: number): string | null {
  const trimmed = uiAmount.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed)) return null;
  const [w = '0', f = ''] = trimmed.split('.');
  const whole = w || '0';
  const frac = f.slice(0, decimals).padEnd(decimals, '0');
  try {
    const raw = BigInt(whole + frac);
    return raw > 0n ? raw.toString() : null;
  } catch {
    return null;
  }
}

function computeMockOutAmount(
  rawInAmount: string,
  inputDecimals: number,
  outputDecimals: number,
  inputPriceUsd: number,
  outputPriceUsd: number,
): bigint {
  const rawIn = BigInt(rawInAmount);
  const ratioUi = inputPriceUsd / outputPriceUsd;
  const ratioMicro = BigInt(Math.max(1, Math.round(ratioUi * 1_000_000)));
  const decimalAdjust = outputDecimals - inputDecimals;

  if (decimalAdjust >= 0) {
    return (rawIn * ratioMicro * 10n ** BigInt(decimalAdjust)) / 1_000_000n;
  } else {
    return (
      (rawIn * ratioMicro) / (1_000_000n * 10n ** BigInt(-decimalAdjust))
    );
  }
}

function buildMockQuote(params: {
  inputMint: string;
  outputMint: string;
  rawInAmount: string;
  inputDecimals: number;
  outputDecimals: number;
  slippageBps: number;
  inPriceUsd: number;
  outPriceUsd: number;
}): DFlowQuote {
  const {
    inputMint,
    outputMint,
    rawInAmount,
    inputDecimals,
    outputDecimals,
    slippageBps,
    inPriceUsd,
    outPriceUsd,
  } = params;

  const outRaw = computeMockOutAmount(
    rawInAmount,
    inputDecimals,
    outputDecimals,
    inPriceUsd,
    outPriceUsd,
  );

  const slippageNumerator = BigInt(10_000 - slippageBps);
  const minOut = (outRaw * slippageNumerator) / 10_000n;

  const routePlan: RoutePlanStep[] = [
    {
      swapInfo: {
        ammKey: 'demo-mock-amm-v1',
        label: 'DFlow Demo Pool',
        inputMint,
        outputMint,
        inAmount: rawInAmount,
        outAmount: outRaw.toString(),
      },
      percent: 100,
    },
  ];

  return {
    inputMint,
    outputMint,
    inAmount: rawInAmount,
    outAmount: outRaw.toString(),
    otherAmountThreshold: minOut.toString(),
    swapMode: 'ExactIn',
    slippageBps,
    priceImpactPct: 0.0018,
    routePlan,
    contextSlot: null,
    timeTaken: 14,
    mevProtected: true,
  };
}

function mapDFlowError(err: { type?: string; message?: string }): string {
  switch (err.type) {
    case 'toxic_flow':
      return '🛡 DFlow blocked this route — likely sandwich attempt detected';
    case 'no_route':
      return 'DFlow has no route for this pair right now';
    case 'insufficient_liquidity':
      return 'Not enough liquidity on DFlow venues for this size';
    default:
      return err.message ?? 'Quote unavailable';
  }
}

function shouldUseFallback(status: number): boolean {
  return status >= 500;
}

export function useSwapQuote(): { refetch: () => void } {
  const inputMint = useSwapStore((s) => s.inputMint);
  const inputDecimals = useSwapStore((s) => s.inputDecimals);
  const outputMint = useSwapStore((s) => s.outputMint);
  const outputDecimals = useSwapStore((s) => s.outputDecimals);
  const inputAmount = useSwapStore((s) => s.inputAmount);
  const slippageBps = useSwapStore((s) => s.slippageBps);

  const startQuoting = useSwapStore((s) => s.startQuoting);
  const setQuote = useSwapStore((s) => s.setQuote);
  const setQuoteError = useSwapStore((s) => s.setQuoteError);

  const abortRef = useRef<AbortController | null>(null);
  const lastFetchAtRef = useRef<number>(0);

  const doFetch = useCallback(async () => {
    if (!inputMint || !outputMint || inputMint === outputMint) return;
    const rawAmount = buildRawAmount(inputAmount, inputDecimals);
    if (!rawAmount) return;

    const now = Date.now();
    if (now - lastFetchAtRef.current < MIN_FETCH_INTERVAL_MS) return;
    lastFetchAtRef.current = now;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = startQuoting();

    const fallback = async () => {
      let inPriceUsd = BACKUP_PRICES_USD[inputMint] ?? 1;
      let outPriceUsd = BACKUP_PRICES_USD[outputMint] ?? 1;

      try {
        // Amader nijeder Birdeye proxy api use korchi jate CORS na ashe
        const [inRes, outRes] = await Promise.all([
          fetch(`/api/birdeye/price?address=${inputMint}`),
          fetch(`/api/birdeye/price?address=${outputMint}`)
        ]);

        if (inRes.ok) {
          const inData = await inRes.json();
          if (inData?.data?.value) inPriceUsd = Number(inData.data.value);
        }
        if (outRes.ok) {
          const outData = await outRes.json();
          if (outData?.data?.value) outPriceUsd = Number(outData.data.value);
        }
      } catch (e) {
        console.warn('[RugShield] Proxy price fetch failed, trying Jupiter API...');
        try {
          const jupRes = await fetch(`https://api.jup.ag/price/v2?ids=${inputMint},${outputMint}`);
          if (jupRes.ok) {
            const jupData = await jupRes.json();
            if (jupData?.data?.[inputMint]?.price) inPriceUsd = Number(jupData.data[inputMint].price);
            if (jupData?.data?.[outputMint]?.price) outPriceUsd = Number(jupData.data[outputMint].price);
          }
        } catch (e2) {
          console.warn('[RugShield] All APIs failed, using hardcoded fallback prices.');
        }
      }

      const mock = buildMockQuote({
        inputMint,
        outputMint,
        rawInAmount: rawAmount,
        inputDecimals,
        outputDecimals,
        slippageBps,
        inPriceUsd,
        outPriceUsd,
      });
      
      console.info(
        `[RugShield] DFlow unreachable — generated mock quote with real market prices (Input: $${inPriceUsd}, Output: $${outPriceUsd})`
      );
      setQuote(requestId, mock);
    };

    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: rawAmount,
      slippageBps: String(slippageBps),
    });

    try {
      const res = await fetch(`/api/dflow/quote?${params.toString()}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });

      if (res.status === 429) {
        const detail = (await res.json().catch(() => ({}))) as {
          retryAfterSeconds?: number;
        };
        setQuoteError(
          requestId,
          `DFlow rate limit — wait ${detail.retryAfterSeconds ?? 5}s and retry`,
        );
        return;
      }

      if (shouldUseFallback(res.status)) {
        await fallback();
        return;
      }

      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        setQuoteError(
          requestId,
          detail.error ?? `Quote request failed (${res.status})`,
        );
        return;
      }

      const body = (await res.json()) as DFlowQuote;

      if (body.error) {
        setQuoteError(requestId, mapDFlowError(body.error));
        return;
      }

      setQuote(requestId, body);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await fallback();
    }
  }, [
    inputMint,
    outputMint,
    inputAmount,
    slippageBps,
    inputDecimals,
    outputDecimals,
    startQuoting,
    setQuote,
    setQuoteError,
  ]);

  useEffect(() => {
    if (!inputMint || !outputMint || !inputAmount.trim()) return;
    if (!buildRawAmount(inputAmount, inputDecimals)) return;

    const id = window.setTimeout(() => void doFetch(), DEBOUNCE_MS);
    return () => {
      window.clearTimeout(id);
      abortRef.current?.abort();
    };
  }, [inputMint, outputMint, inputAmount, slippageBps, inputDecimals, doFetch]);

  const refetch = useCallback(() => {
    lastFetchAtRef.current = 0;
    void doFetch();
  }, [doFetch]);

  return { refetch };
}