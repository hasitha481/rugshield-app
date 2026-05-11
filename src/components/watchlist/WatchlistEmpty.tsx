// src/components/watchlist/WatchlistEmpty.tsx
import { Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';

export function WatchlistEmpty() {
  const navigate = useNavigate();

  return (
    <Card padding="lg" className="text-center">
      <div className="flex flex-col items-center gap-5 py-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
          <Eye className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            No tokens watched yet
          </h3>
          <p className="mx-auto max-w-sm text-sm text-text-secondary">
            Scan a token and bookmark it to monitor its safety score over time.
            RugShield polls Birdeye every 60 seconds and surfaces score drops
            instantly.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Open the Scanner
        </Button>
      </div>
    </Card>
  );
}