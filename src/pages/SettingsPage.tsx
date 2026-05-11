// src/pages/SettingsPage.tsx
import { Settings } from 'lucide-react';
import { ThresholdSlider } from '@/components/settings/ThresholdSlider';
import { ApiStatusPanel } from '@/components/settings/ApiStatusPanel';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-violet/10 text-accent-violet">
          <Settings className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary">Settings</h1>
          <div className="text-xs text-text-secondary">
            Preferences are stored locally in your browser.
          </div>
        </div>
      </div>

      <ThresholdSlider />
      <ApiStatusPanel />
    </div>
  );
}