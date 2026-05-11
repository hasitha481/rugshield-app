// src/components/scanner/TokenInput.tsx
import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { useTokenScan } from '@/hooks/useTokenScan';
import { useScanStore } from '@/stores/scanStore';
import { scoreToBucket } from '@/lib/score/buckets';
import type { ScoreResult } from '@/lib/score/types';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

interface AllowlistEntry {
  name: string;
  symbol: string;
  score: number;
  flag: string;
}

const ALLOWLIST: ReadonlyMap<string, AllowlistEntry> = new Map([
  [SOL_MINT, { name: 'Solana', symbol: 'SOL', score: 100, flag: 'Native SOL — verified by RugShield' }],
  [USDC_MINT, { name: 'USD Coin', symbol: 'USDC', score: 95, flag: 'Verified stablecoin (USDC)' }],
  [USDT_MINT, { name: 'Tether USD', symbol: 'USDT', score: 95, flag: 'Verified stablecoin (USDT)' }],
]);

const ADDRESS_LIKE_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Build a synthetic full-points ScoreResult for allowlisted tokens. */
function buildAllowlistResult(
  address: string,
  entry: AllowlistEntry,
): ScoreResult {
  const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000;
  const fullPillar = (max: number, flags: string[] = []) => ({
    points: max,
    max,
    flags,
  });

  return {
    address,
    score: entry.score,
    bucket: scoreToBucket(entry.score),
    pillars: {
      authority: fullPillar(20),
      concentration: fullPillar(20),
      liquidity: fullPillar(20),
      deployer: fullPillar(15),
      marketHealth: fullPillar(15),
      authenticity: fullPillar(10, [entry.flag]),
    },
    meta: {
      tokenName: entry.name,
      symbol: entry.symbol,
      age: FOUR_YEARS_MS,
      liquidity: 0,
      holder: 0,
      computedAt: Date.now(),
    },
    dataQuality: 'COMPLETE',
  };
}

export function TokenInput() {
  const [value, setValue] = useState('');
  const { scan, isLoading, error } = useTokenScan();

  const triggerScan = useCallback(
    async (raw: string) => {
      const address = raw.trim();
      if (!address) return;

      // Allowlist short-circuit — no Birdeye round-trip.
      const allowlisted = ALLOWLIST.get(address);
      if (allowlisted) {
        const id = useScanStore.getState().startScan();
        useScanStore.getState().setScanResult(
          id,
          buildAllowlistResult(address, allowlisted),
        );
        return;
      }

      await scan(address);
    },
    [scan],
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    // Auto-trigger when the input looks like a complete Solana address.
    // Avoids firing on partial keystrokes; users with a partial address
    // can still hit Enter via the form submit.
    if (ADDRESS_LIKE_REGEX.test(next.trim())) {
      void triggerScan(next);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void triggerScan(value);
  };

  const onClear = () => {
    setValue('');
    useScanStore.getState().clear();
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <Input
        value={value}
        onChange={onChange}
        placeholder="Paste a Solana token address — e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        leftIcon={
          isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-accent-violet" />
          ) : (
            <Search className="h-4 w-4" />
          )
        }
        rightSlot={
          value ? (
            <button
              type="button"
              onClick={onClear}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
        error={error ?? undefined}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        disabled={isLoading}
        aria-label="Solana token address"
      />
    </form>
  );
}