// src/components/swap/TxStatusBanner.tsx
import { type ReactNode } from 'react';
import { Loader2, CheckCircle2, AlertOctagon, ExternalLink } from 'lucide-react';
import { useSwapStore } from '@/stores/swapStore';

type Tone = 'info' | 'success' | 'error';

const TONE_BG: Record<Tone, string> = {
  info: 'border-accent-violet/30 bg-accent-violet/5',
  success: 'border-accent-green/30 bg-accent-green/5',
  error: 'border-accent-red/30 bg-accent-red/5',
};

const ICON_BG: Record<Tone, string> = {
  info: 'bg-accent-violet/15 text-accent-violet',
  success: 'bg-accent-green/15 text-accent-green',
  error: 'bg-accent-red/15 text-accent-red',
};

export function TxStatusBanner() {
  const status = useSwapStore((s) => s.status);
  const error = useSwapStore((s) => s.error);
  const txSignature = useSwapStore((s) => s.txSignature);

  if (status === 'IDLE' || status === 'QUOTING' || status === 'READY') {
    return null;
  }

  if (status === 'SIGNING') {
    return (
      <Banner tone="info" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
        <div className="font-medium text-text-primary">Approve in your wallet</div>
        <div className="text-xs text-text-secondary">
          Sign the DFlow swap to broadcast to Solana mainnet.
        </div>
      </Banner>
    );
  }

  if (status === 'CONFIRMING') {
    return (
      <Banner tone="info" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
        <div className="font-medium text-text-primary">Confirming on Solana…</div>
        <div className="text-xs text-text-secondary">
          Waiting for cluster confirmation. This usually takes a few seconds.
        </div>
        {txSignature && <SolscanLink sig={txSignature} prefix="View pending tx" />}
      </Banner>
    );
  }

  if (status === 'SUCCESS') {
    return (
      <Banner tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
        <div className="font-medium text-text-primary">Swap confirmed ✓</div>
        <div className="text-xs text-text-secondary">
          Routed through DFlow with MEV protection.
        </div>
        {txSignature && <SolscanLink sig={txSignature} prefix="View on Solscan" />}
      </Banner>
    );
  }

  // status === 'ERROR'
  return (
    <Banner tone="error" icon={<AlertOctagon className="h-4 w-4" />}>
      <div className="font-medium text-text-primary">Swap failed</div>
      {error && (
        <div className="mt-0.5 break-words font-mono text-xs text-text-secondary">
          {error}
        </div>
      )}
      {txSignature && <SolscanLink sig={txSignature} prefix="Check status on Solscan" />}
    </Banner>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 animate-fade-in ${TONE_BG[tone]}`}
      role="status"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ICON_BG[tone]}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </div>
  );
}

function SolscanLink({ sig, prefix }: { sig: string; prefix: string }) {
  return (
    <a
      href={`https://solscan.io/tx/${sig}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-accent-violet underline-offset-2 hover:underline"
    >
      {prefix}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}