// src/components/settings/ApiStatusPanel.tsx
import { useCallback, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Activity, RefreshCw } from 'lucide-react';
import { Button, Card } from '@/components/ui';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

type Status = 'idle' | 'pinging' | 'ok' | 'error';

interface ServiceState {
  status: Status;
  latencyMs: number | null;
  error: string | null;
}

const INITIAL: ServiceState = { status: 'idle', latencyMs: null, error: null };

export function ApiStatusPanel() {
  const { connection } = useConnection();

  const [birdeye, setBirdeye] = useState<ServiceState>(INITIAL);
  const [dflow, setDflow] = useState<ServiceState>(INITIAL);
  const [rpc, setRpc] = useState<ServiceState>(INITIAL);

  const pingBirdeye = useCallback(async () => {
    setBirdeye((s) => ({ ...s, status: 'pinging' }));
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/birdeye/overview?address=${SOL_MINT}`, {
        headers: { accept: 'application/json' },
      });
      // 401 still proves the proxy is alive — it's just the free-tier
      // restriction on a different endpoint. Treat as operational.
      if (!res.ok && res.status !== 401) throw new Error(`HTTP ${res.status}`);
      setBirdeye({
        status: 'ok',
        latencyMs: Math.round(performance.now() - t0),
        error: null,
      });
    } catch (err) {
      setBirdeye({
        status: 'error',
        latencyMs: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const pingDflow = useCallback(async () => {
    setDflow((s) => ({ ...s, status: 'pinging' }));
    const t0 = performance.now();
    try {
      // 0.01 SOL — the cheapest valid quote request.
      const params = new URLSearchParams({
        inputMint: SOL_MINT,
        outputMint: USDC_MINT,
        amount: '10000000',
        slippageBps: '50',
      });
      const res = await fetch(`/api/dflow/quote?${params.toString()}`, {
        headers: { accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDflow({
        status: 'ok',
        latencyMs: Math.round(performance.now() - t0),
        error: null,
      });
    } catch (err) {
      setDflow({
        status: 'error',
        latencyMs: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const pingRpc = useCallback(async () => {
    setRpc((s) => ({ ...s, status: 'pinging' }));
    const t0 = performance.now();
    try {
      const slot = await connection.getSlot();
      if (typeof slot !== 'number') throw new Error('Invalid slot');
      setRpc({
        status: 'ok',
        latencyMs: Math.round(performance.now() - t0),
        error: null,
      });
    } catch (err) {
      setRpc({
        status: 'error',
        latencyMs: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [connection]);

  const pingAll = useCallback(async () => {
    await Promise.all([pingBirdeye(), pingDflow(), pingRpc()]);
  }, [pingBirdeye, pingDflow, pingRpc]);

  useEffect(() => {
    void pingAll();
  }, [pingAll]);

  const anyPinging =
    birdeye.status === 'pinging' ||
    dflow.status === 'pinging' ||
    rpc.status === 'pinging';

  return (
    <Card padding="md">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-violet/10 text-accent-violet">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                Service status
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">
                Live health of the APIs RugShield depends on.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={pingAll}
            disabled={anyPinging}
            leftIcon={
              <RefreshCw
                className={`h-3.5 w-3.5 ${anyPinging ? 'animate-spin' : ''}`}
              />
            }
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          <ServiceRow
            name="Birdeye"
            state={birdeye}
            description="Token data & security analysis"
          />
          <ServiceRow
            name="DFlow"
            state={dflow}
            description="MEV-protected swap routing"
          />
          <ServiceRow
            name="Solana RPC"
            state={rpc}
            description="On-chain confirmation"
          />
        </div>
      </div>
    </Card>
  );
}

interface ServiceRowProps {
  name: string;
  state: ServiceState;
  description: string;
}

function ServiceRow({ name, state, description }: ServiceRowProps) {
  const { dotClass, label, labelClass } = (() => {
    if (state.status === 'pinging') {
      return {
        dotClass: 'bg-text-secondary animate-pulse-soft',
        label: 'Checking…',
        labelClass: 'text-text-secondary',
      };
    }
    if (state.status === 'ok') {
      return {
        dotClass: 'bg-accent-green',
        label: 'Operational',
        labelClass: 'text-accent-green',
      };
    }
    if (state.status === 'error') {
      return {
        dotClass: 'bg-accent-red',
        label: 'Unreachable',
        labelClass: 'text-accent-red',
      };
    }
    return {
      dotClass: 'bg-text-secondary/50',
      label: 'Idle',
      labelClass: 'text-text-secondary',
    };
  })();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-bg-tertiary px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary">{name}</div>
          <div className="truncate text-[10px] text-text-secondary">
            {description}
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`text-xs font-semibold ${labelClass}`}>{label}</div>
        {state.latencyMs !== null && (
          <div className="font-mono text-[10px] tabular-nums text-text-secondary">
            {state.latencyMs}ms
          </div>
        )}
        {state.error && state.status === 'error' && (
          <div
            className="font-mono text-[10px] text-accent-red"
            title={state.error}
          >
            {state.error.slice(0, 24)}
          </div>
        )}
      </div>
    </div>
  );
}