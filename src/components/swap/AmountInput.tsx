// src/components/swap/AmountInput.tsx
import { useCallback, type ChangeEvent } from 'react';
import { useSwapStore } from '@/stores/swapStore';

/** Accept digits and at most one decimal point. */
const NUMERIC_REGEX = /^\d*\.?\d*$/;

export function AmountInput() {
  const inputAmount = useSwapStore((s) => s.inputAmount);
  const inputSymbol = useSwapStore((s) => s.inputSymbol);
  const status = useSwapStore((s) => s.status);
  const setInputAmount = useSwapStore((s) => s.setInputAmount);

  const locked = status === 'SIGNING' || status === 'CONFIRMING';

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (next === '' || NUMERIC_REGEX.test(next)) {
        setInputAmount(next);
      }
    },
    [setInputAmount],
  );

  return (
    <div
      className={
        'rounded-xl border bg-bg-tertiary p-4 transition-colors ' +
        'focus-within:border-accent-violet/50'
      }
    >
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
        <span>You pay</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={inputAmount}
          onChange={onChange}
          placeholder="0.00"
          disabled={locked}
          spellCheck={false}
          autoComplete="off"
          className={
            'min-w-0 flex-1 bg-transparent font-mono text-3xl font-semibold ' +
            'tabular-nums text-text-primary placeholder:text-text-secondary/40 ' +
            'focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
          }
          aria-label="Amount to swap"
        />
        <div className="flex shrink-0 items-center gap-2 rounded-md border bg-bg-secondary px-2.5 py-1.5 font-mono text-xs font-semibold text-text-primary">
          {inputSymbol || '—'}
        </div>
      </div>
    </div>
  );
}