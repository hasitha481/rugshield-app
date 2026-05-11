// src/components/swap/SwapButton.tsx
import { useMemo, type ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ShieldAlert, Check, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSwapStore } from '@/stores/swapStore';
import { useSwapExecution } from '@/hooks/useSwapExecution';

interface Props {
  /** True when the scanned token's score is below the swap threshold. */
  isBlocked: boolean;
  /** Called when the user clicks a blocked button — should open OverrideModal. */
  onRequireOverride: () => void;
}

type ActionKind =
  | 'connect'
  | 'enter'
  | 'quoting'
  | 'blocked'
  | 'ready'
  | 'signing'
  | 'confirming'
  | 'success'
  | 'error';

interface ButtonConfig {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled: boolean;
  loading: boolean;
  icon: ReactNode | null;
  /** Optional className override — used to recolor the success state to green. */
  classOverride?: string;
}

const CONFIG: Record<ActionKind, ButtonConfig> = {
  connect: {
    label: 'Connect Wallet to Swap',
    variant: 'primary',
    disabled: false,
    loading: false,
    icon: <Wallet className="h-4 w-4" />,
  },
  enter: {
    label: 'Enter an amount',
    variant: 'secondary',
    disabled: true,
    loading: false,
    icon: null,
  },
  quoting: {
    label: 'Fetching DFlow quote…',
    variant: 'secondary',
    disabled: true,
    loading: true,
    icon: null,
  },
  blocked: {
    label: 'Override required to swap',
    variant: 'danger',
    disabled: false,
    loading: false,
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  ready: {
    label: 'Swap via DFlow',
    variant: 'primary',
    disabled: false,
    loading: false,
    icon: <Zap className="h-4 w-4" />,
  },
  signing: {
    label: 'Approve in your wallet…',
    variant: 'secondary',
    disabled: true,
    loading: true,
    icon: null,
  },
  confirming: {
    label: 'Confirming on Solana…',
    variant: 'secondary',
    disabled: true,
    loading: true,
    icon: null,
  },
  success: {
    label: 'Swap confirmed',
    variant: 'primary',
    disabled: true,
    loading: false,
    icon: <Check className="h-4 w-4" />,
    classOverride: '!bg-accent-green !text-white hover:!bg-accent-green',
  },
  error: {
    label: 'Retry swap',
    variant: 'primary',
    disabled: false,
    loading: false,
    icon: <RefreshCw className="h-4 w-4" />,
  },
};

export function SwapButton({ isBlocked, onRequireOverride }: Props) {
  const { connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const status = useSwapStore((s) => s.status);
  const inputAmount = useSwapStore((s) => s.inputAmount);
  const quote = useSwapStore((s) => s.quote);
  const override = useSwapStore((s) => s.override);

  const { executeSwap } = useSwapExecution();

  const action = useMemo<ActionKind>(() => {
    if (status === 'SIGNING') return 'signing';
    if (status === 'CONFIRMING') return 'confirming';
    if (status === 'SUCCESS') return 'success';
    if (status === 'ERROR') return 'error';

    if (!connected) return 'connect';
    if (!inputAmount.trim() || /^0+\.?0*$/.test(inputAmount.trim())) return 'enter';
    if (status === 'QUOTING' || !quote) return 'quoting';
    if (isBlocked && !override) return 'blocked';
    return 'ready';
  }, [connected, status, inputAmount, quote, isBlocked, override]);

  const config = CONFIG[action];

  const onClick = () => {
    switch (action) {
      case 'connect':
        setWalletModalVisible(true);
        return;
      case 'blocked':
        onRequireOverride();
        return;
      case 'ready':
      case 'error':
        void executeSwap();
        return;
      default:
        // disabled / loading states are no-ops
        return;
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={config.disabled}
      isLoading={config.loading}
      variant={config.variant}
      size="lg"
      fullWidth
      leftIcon={config.icon}
      className={config.classOverride}
    >
      {config.label}
    </Button>
  );
}