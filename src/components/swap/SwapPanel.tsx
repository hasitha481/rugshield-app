// src/components/swap/SwapPanel.tsx
import { useEffect, useState, type CSSProperties } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ArrowUpDown, Zap } from 'lucide-react';
import { Card } from '@/components/ui';
import { useScanStore } from '@/stores/scanStore';
import { useSwapStore } from '@/stores/swapStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSwapQuote } from '@/hooks/useSwapQuote';
import { AmountInput } from './AmountInput';
import { QuotePreview } from './QuotePreview';
import { SwapButton } from './SwapButton';
import { TxStatusBanner } from './TxStatusBanner';
import { OverrideModal } from './OverrideModal';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const VIOLET = '#8B5CF6';
const GREEN = '#10B981';

const KNOWN_DECIMALS: ReadonlyMap<string, number> = new Map([
  [SOL_MINT, 9],
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6],
  ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 6],
  ['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 5],
  ['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', 6],
]);

export function SwapPanel() {
  const currentScan = useScanStore((s) => s.currentScan);
  const { connection } = useConnection();

  const setInputToken = useSwapStore((s) => s.setInputToken);
  const flipTokens = useSwapStore((s) => s.flipTokens);
  const inputMint = useSwapStore((s) => s.inputMint);
  const inputSymbol = useSwapStore((s) => s.inputSymbol);
  const outputSymbol = useSwapStore((s) => s.outputSymbol);
  const status = useSwapStore((s) => s.status);
  const reset = useSwapStore((s) => s.reset);

  const swapThreshold = useSettingsStore((s) => s.swapThreshold);
  const [overrideOpen, setOverrideOpen] = useState(false);

  useSwapQuote();

  // 100% BULLETPROOF SYNC: Sync input token on new scans and FORCE Output to SOL
  useEffect(() => {
    if (!currentScan) return;
    
    const mint = currentScan.address;
    const liveStore = useSwapStore.getState();

    if (liveStore.status === 'SIGNING' || liveStore.status === 'CONFIRMING') return;

    // If the token is already in input or output, don't interrupt (preserves user flips)
    if (mint === liveStore.inputMint || mint === liveStore.outputMint) return;

    const symbol = currentScan.meta.symbol || '???';
    const known = KNOWN_DECIMALS.get(mint);
    
    const applyTokens = (decimals: number) => {
      const store = useSwapStore.getState();
      store.setInputToken(mint, symbol, decimals);
      
      // ALUTH FIX: Force the output to be SOL so we don't get stuck with random memecoins
      // Safely call setOutputToken if it exists in your store
      const setOutputToken = (store as any).setOutputToken;
      if (typeof setOutputToken === 'function') {
        setOutputToken(SOL_MINT, 'SOL', 9);
      } else {
        console.warn("[RugShield] setOutputToken function missing in swapStore.");
      }
    };

    if (known !== undefined) {
      applyTokens(known);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const info = await connection.getParsedAccountInfo(new PublicKey(mint));
        if (cancelled) return;
        const data = info.value?.data;
        let decimals = 6;
        if (data && typeof data === 'object' && 'parsed' in data) {
          const parsed = (data as { parsed?: { info?: { decimals?: number } } }).parsed;
          if (typeof parsed?.info?.decimals === 'number') {
            decimals = parsed.info.decimals;
          }
        }
        applyTokens(decimals);
      } catch {
        if (!cancelled) applyTokens(6);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentScan, connection, setInputToken]); 

  // Auto-reset after a successful swap
  useEffect(() => {
    if (status !== 'SUCCESS') return;
    const id = window.setTimeout(() => reset(), 5000);
    return () => window.clearTimeout(id);
  }, [status, reset]);

  if (!currentScan) return null;

  const isBlocked = currentScan.score < swapThreshold;
  const glowColor = status === 'SUCCESS' ? GREEN : VIOLET;
  const glowIntensity = status === 'SUCCESS' ? 0.9 : status === 'CONFIRMING' ? 0.65 : 0.5;

  const cardStyle: CSSProperties = {
    borderColor: `${glowColor}40`,
    boxShadow: `
      0 32px 80px -24px ${glowColor}33,
      0 0 0 1px ${glowColor}22 inset,
      0 0 ${40 + glowIntensity * 40}px -20px ${glowColor}88
    `,
    transition: 'box-shadow 600ms ease, border-color 600ms ease',
  };

  return (
    <div className="relative animate-rise-in" style={{ animationDelay: '120ms' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-3xl blur-2xl animate-glow-pulse"
        style={{
          background: `radial-gradient(70% 50% at 50% 0%, ${glowColor}40, transparent 70%)`,
          transition: 'background 600ms ease',
        }}
      />

      <Card padding="none" className="relative overflow-hidden" style={cardStyle as CSSProperties}>
        <div
          className="relative flex items-center justify-between border-b px-5 py-3 md:px-6"
          style={{
            background: `linear-gradient(90deg, ${glowColor}10 0%, transparent 60%)`,
            transition: 'background 600ms ease',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div
                aria-hidden
                className="absolute inset-0 rounded-md animate-spin-slow"
                style={{
                  background: `conic-gradient(from 0deg, ${glowColor}, transparent 30%, ${glowColor} 70%, transparent)`,
                  padding: '1px',
                  WebkitMask:
                    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <div
                className="relative flex h-7 w-7 items-center justify-center rounded-md"
                style={{
                  backgroundColor: `${glowColor}22`,
                  color: glowColor,
                  transition: 'background-color 600ms ease, color 600ms ease',
                }}
              >
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-text-primary">
                Swap{' '}
                <span className="font-mono">{inputSymbol || '...'}</span>
                {' → '}
                <span className="font-mono">{outputSymbol}</span>
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500"
                style={{ color: status === 'SUCCESS' ? GREEN : 'inherit' }}
              >
                {status === 'SUCCESS'
                  ? 'Confirmed via DFlow'
                  : 'Powered by DFlow JIT routing'}
              </div>
            </div>
          </div>
        </div>

        <div className="relative space-y-3 p-5 md:p-6">
          <TxStatusBanner />

          <div className={status === 'SUCCESS' ? 'animate-success-burst' : ''}>
            <AmountInput />
          </div>

          <div className="absolute top-[82px] inset-x-0 flex items-center justify-center pointer-events-none z-10">
            <button
              type="button"
              onClick={flipTokens}
              disabled={status === 'SIGNING' || status === 'CONFIRMING'}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-secondary text-text-secondary shadow-sm transition-all hover:border-accent-violet/50 hover:text-accent-violet disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Flip tokens"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          <QuotePreview />

          <SwapButton
            isBlocked={isBlocked}
            onRequireOverride={() => setOverrideOpen(true)}
          />
        </div>
      </Card>

      <OverrideModal open={overrideOpen} onClose={() => setOverrideOpen(false)} />
    </div>
  );
}