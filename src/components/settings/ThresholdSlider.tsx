// src/components/settings/ThresholdSlider.tsx
import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import { bucketToColor, bucketToLabel, scoreToBucket } from '@/lib/score/buckets';
import {
  DEFAULT_SWAP_THRESHOLD,
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  useSettingsStore,
} from '@/stores/settingsStore';

export function ThresholdSlider() {
  const threshold = useSettingsStore((s) => s.swapThreshold);
  const setThreshold = useSettingsStore((s) => s.setSwapThreshold);

  const bucket = scoreToBucket(threshold);
  const bucketColor = bucketToColor(bucket);
  const bucketLabel = bucketToLabel(bucket);

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-violet/10 text-accent-violet">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">
              Swap safety threshold
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">
              Tokens scoring below this value require an explicit override before
              RugShield will route the swap through DFlow.
            </p>
          </div>
        </div>

        {/* Current value card */}
        <div
          className="flex items-center justify-between rounded-lg border p-3"
          style={{
            borderColor: `${bucketColor}40`,
            backgroundColor: `${bucketColor}08`,
          }}
        >
          <div className="text-xs text-text-secondary">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Current threshold
            </div>
            <div className="mt-0.5 text-text-primary">
              Block swaps below this score
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-mono text-3xl font-bold leading-none tabular-nums"
              style={{ color: bucketColor }}
            >
              {threshold}
            </div>
            <div
              className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ color: bucketColor }}
            >
              {bucketLabel}
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={MIN_THRESHOLD}
            max={MAX_THRESHOLD}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-accent-violet"
            aria-label="Safety threshold"
            aria-valuemin={MIN_THRESHOLD}
            aria-valuemax={MAX_THRESHOLD}
            aria-valuenow={threshold}
          />

          {/* Bucket scale */}
          <div
            aria-hidden
            className="relative h-2 overflow-hidden rounded-full border"
          >
            <div className="absolute inset-0 grid grid-cols-[40%_20%_20%_20%]">
              <div style={{ backgroundColor: '#EF4444' }} />
              <div style={{ backgroundColor: '#F97316' }} />
              <div style={{ backgroundColor: '#F59E0B' }} />
              <div style={{ backgroundColor: '#10B981' }} />
            </div>
          </div>

          <div className="grid grid-cols-[40%_20%_20%_20%] text-center font-mono text-[9px] uppercase tracking-[0.12em] text-text-secondary">
            <div>
              0–39
              <br />
              Danger
            </div>
            <div>
              40–59
              <br />
              High Risk
            </div>
            <div>
              60–79
              <br />
              Caution
            </div>
            <div>
              80–100
              <br />
              Safe
            </div>
          </div>
        </div>

        {threshold !== DEFAULT_SWAP_THRESHOLD && (
          <button
            type="button"
            onClick={() => setThreshold(DEFAULT_SWAP_THRESHOLD)}
            className="text-xs text-accent-violet hover:underline"
          >
            Reset to default ({DEFAULT_SWAP_THRESHOLD})
          </button>
        )}
      </div>
    </Card>
  );
}