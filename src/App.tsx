// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@/providers/WalletProvider';
import { Layout } from '@/components/layout/Layout';

// Pages
import { ScannerPage } from '@/pages/ScannerPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';

// Globals
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { useHistoryRecorder } from '@/hooks/useHistoryRecorder';

export function App() {
  // Global history recorder hook - auto saves scans & swaps
  useHistoryRecorder();

  return (
    <WalletProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Fallback route */}
          <Route path="*" element={<ScannerPage />} />
        </Route>
      </Routes>

      {/* Global overlay — appears once per browser on first visit */}
      <WelcomeModal />
    </WalletProvider>
  );
}

export default App;