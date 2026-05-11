// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// In dev, run `vercel dev` to serve /api routes alongside this frontend.
// Running `vite` alone will NOT serve /api/* — proxy calls will 404.
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Solana wallet adapters reference `global` which doesn't exist in browsers.
    // Mapping it to `globalThis` is the standard Vite + Solana fix.
    // We also explicitly pass the API keys to the environment to fix Vercel 500 errors.
    define: {
      global: 'globalThis',
      'process.env.BIRDEYE_API_KEY': JSON.stringify(env.BIRDEYE_API_KEY),
      'process.env.DFLOW_API_KEY': JSON.stringify(env.DFLOW_API_KEY),
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
  };
});