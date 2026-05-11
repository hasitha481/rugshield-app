// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// In dev, run `vercel dev` to serve /api routes alongside this frontend.
// Running `vite` alone will NOT serve /api/* — proxy calls will 404.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Solana wallet adapters reference `global` which doesn't exist in browsers.
  // Mapping it to `globalThis` is the standard Vite + Solana fix.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          solana: ['@solana/web3.js'],
          wallet: [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
          ],
        },
      },
    },
  },
});