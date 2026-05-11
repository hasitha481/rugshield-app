// src/providers/WalletProvider.tsx
import { useMemo, type ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app in Solana connection + wallet adapter context.
 *
 * Notes:
 * - Mainnet only. RugShield requires real on-chain data.
 * - Backpack, Glow, and other wallet-standard wallets are auto-discovered;
 *   we only need to register Phantom + Solflare explicitly because not all
 *   versions register via the wallet standard.
 * - VITE_RPC_URL overrides the default public mainnet RPC. The public RPC
 *   is heavily rate-limited; production should use a paid provider.
 */
export function WalletProvider({ children }: Props) {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    const custom = import.meta.env.VITE_RPC_URL?.trim();
    return custom && custom.length > 0 ? custom : clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter({ network }),
      new PhantomWalletAdapter(),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}