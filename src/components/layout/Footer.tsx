// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t px-4 py-4 md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-text-secondary md:flex-row">
        <div>
          Built with{' '}
          <a
            href="https://dflow.net"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text-primary underline-offset-2 hover:text-accent-violet hover:underline"
          >
            DFlow
          </a>
          {' · '}
          <a
            href="https://birdeye.so"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text-primary underline-offset-2 hover:text-accent-violet hover:underline"
          >
            Birdeye
          </a>
          {' · on '}
          <a
            href="https://eitherway.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text-primary underline-offset-2 hover:text-accent-violet hover:underline"
          >
            Eitherway
          </a>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em]">
          v0.1 · Solana Mainnet
        </div>
      </div>
    </footer>
  );
}