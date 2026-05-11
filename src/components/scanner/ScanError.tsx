// src/components/scanner/ScanError.tsx
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface Props {
  message: string;
  onRetry?: () => void;
}

interface ErrorCategory {
  title: string;
  hint: string;
  retryable: boolean;
}

function categorize(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes('invalid solana address')) {
    return {
      title: 'Invalid address',
      hint: "That doesn't look like a valid Solana token mint. Double-check and try again.",
      retryable: false,
    };
  }
  if (lower.includes('rate limit')) {
    return {
      title: 'Rate limit hit',
      hint: 'Birdeye is throttling our requests. Give it a few seconds and retry.',
      retryable: true,
    };
  }
  if (lower.includes('failed') || lower.includes('network')) {
    return {
      title: 'Network error',
      hint: "We couldn't reach Birdeye. Check your connection and try again.",
      retryable: true,
    };
  }
  return {
    title: 'Scan failed',
    hint: 'Something went wrong while scanning this token.',
    retryable: true,
  };
}

export function ScanError({ message, onRetry }: Props) {
  const { title, hint, retryable } = categorize(message);

  return (
    <Card padding="lg" className="animate-fade-in-up border-accent-red/30 bg-accent-red/5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-red/15 text-accent-red">
          <AlertOctagon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{hint}</p>
          <p className="mt-2 break-words font-mono text-xs text-text-secondary">{message}</p>
          {retryable && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="mt-3"
            >
              Retry scan
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}