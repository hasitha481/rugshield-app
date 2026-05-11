// src/components/history/HistoryEmpty.tsx
import { Clock, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';

export function HistoryEmpty() {
  const navigate = useNavigate();
  return (
    <Card padding="lg" className="text-center">
      <div className="flex flex-col items-center gap-5 py-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
          <Clock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            No activity yet
          </h3>
          <p className="mx-auto max-w-sm text-sm text-text-secondary">
            Your scans and swaps will appear here as you use RugShield. The most
            recent 100 events are kept locally — nothing is sent off-device.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          leftIcon={<ScanLine className="h-4 w-4" />}
        >
          Run your first scan
        </Button>
      </div>
    </Card>
  );
}