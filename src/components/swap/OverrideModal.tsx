// src/components/swap/OverrideModal.tsx
import { useEffect, useState, type ChangeEvent } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useScanStore } from '@/stores/scanStore';
import { useSwapStore } from '@/stores/swapStore';
import { bucketToColor, bucketToLabel } from '@/lib/score/buckets';

const REQUIRED_PHRASE = 'I UNDERSTAND';
const MAX_VISIBLE_FLAGS = 5;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function OverrideModal({ open, onClose }: Props) {
  const currentScan = useScanStore((s) => s.currentScan);
  const setOverride = useSwapStore((s) => s.setOverride);
  const [phrase, setPhrase] = useState('');

  // Reset input when opening
  useEffect(() => {
    if (open) setPhrase('');
  }, [open]);

  // Escape closes the dialog
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !currentScan) return null;

  const canConfirm = phrase === REQUIRED_PHRASE;
  const bucketColor = bucketToColor(currentScan.bucket);
  const bucketLabel = bucketToLabel(currentScan.bucket);
  const allFlags = Object.values(currentScan.pillars).flatMap((p) => p.flags);

  const onConfirm = () => {
    if (!canConfirm) return;
    setOverride(true);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border bg-bg-secondary shadow-card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${bucketColor}20`,
                color: bucketColor,
              }}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="override-modal-title"
                className="text-base font-semibold text-text-primary"
              >
                Override safety gate
              </h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                You are about to swap a token RugShield flagged as{' '}
                <span className="font-semibold" style={{ color: bucketColor }}>
                  {bucketLabel}
                </span>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Score panel */}
        <div className="border-b p-5">
          <div
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
            style={{
              borderColor: `${bucketColor}40`,
              backgroundColor: `${bucketColor}08`,
            }}
          >
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                Safety score
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                {currentScan.meta.tokenName}
                <span className="ml-1.5 font-mono text-xs text-text-secondary">
                  ({currentScan.meta.symbol})
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-mono text-4xl font-bold leading-none tabular-nums"
                style={{ color: bucketColor }}
              >
                {currentScan.score}
              </div>
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: bucketColor }}
              >
                {bucketLabel}
              </div>
            </div>
          </div>

          {allFlags.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {allFlags.slice(0, MAX_VISIBLE_FLAGS).map((flag, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text-primary"
                >
                  <AlertTriangle
                    className="mt-0.5 h-3 w-3 shrink-0"
                    style={{ color: bucketColor }}
                    aria-hidden
                  />
                  <span className="leading-snug">{flag}</span>
                </li>
              ))}
              {allFlags.length > MAX_VISIBLE_FLAGS && (
                <li className="pl-5 text-xs italic text-text-secondary">
                  +{allFlags.length - MAX_VISIBLE_FLAGS} more red flag
                  {allFlags.length - MAX_VISIBLE_FLAGS === 1 ? '' : 's'}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Confirmation input */}
        <div className="p-5">
          <p className="mb-3 text-sm text-text-primary">
            To confirm you understand the risks, type{' '}
            <span className="rounded bg-accent-red/15 px-1.5 py-0.5 font-mono font-bold text-accent-red">
              {REQUIRED_PHRASE}
            </span>{' '}
            below.
          </p>
          <input
            type="text"
            value={phrase}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhrase(e.target.value)}
            placeholder={REQUIRED_PHRASE}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            className={
              'w-full rounded-lg border bg-bg-tertiary px-3 py-2.5 font-mono text-sm ' +
              'text-text-primary placeholder:text-text-secondary/40 ' +
              'focus:border-accent-red focus:outline-none focus:ring-1 focus:ring-accent-red'
            }
            autoFocus
          />
          {phrase.length > 0 && !canConfirm && (
            <p className="mt-2 text-xs text-text-secondary">
              Must match exactly (case-sensitive).
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t bg-bg-tertiary/30 p-4">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!canConfirm}
            fullWidth
          >
            Override and continue
          </Button>
        </div>
      </div>
    </div>
  );
}