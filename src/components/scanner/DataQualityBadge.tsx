// src/components/scanner/DataQualityBadge.tsx
import { CheckCircle2, AlertTriangle, AlertOctagon, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { DataQuality } from '@/lib/score/types';

interface Props {
  dataQuality: DataQuality;
}

interface BadgeConfig {
  icon: LucideIcon;
  label: string;
  toneClass: string;
}

const CONFIG: Record<DataQuality, BadgeConfig> = {
  COMPLETE: {
    icon: CheckCircle2,
    label: 'Complete data',
    toneClass: 'text-accent-green border-accent-green/30 bg-accent-green/10',
  },
  PARTIAL: {
    icon: AlertTriangle,
    label: 'Partial data — score capped at 60',
    toneClass: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10',
  },
  INSUFFICIENT: {
    icon: AlertOctagon,
    label: 'Insufficient data — token unverified',
    toneClass: 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
  },
};

export function DataQualityBadge({ dataQuality }: Props) {
  const { icon: Icon, label, toneClass } = CONFIG[dataQuality];
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium',
        toneClass,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}