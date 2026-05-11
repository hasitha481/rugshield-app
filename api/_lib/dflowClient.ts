// api/_lib/dflowClient.ts
import { getEnv } from './env.js';

/**
 * DFlow API base URL.
 * Defaults to https://api.dflow.net but is overridable via env so it can be
 * pointed at sandbox / regional hosts without code changes.
 */
const DFLOW_BASE = (process.env.DFLOW_API_BASE?.trim() || 'https://api.dflow.net').replace(/\/+$/, '');

export class DFlowUpstreamError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`DFlow upstream error (${status})`);
    this.name = 'DFlowUpstreamError';
  }
}

export class DFlowRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super('DFlow rate limit hit');
    this.name = 'DFlowRateLimitError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
}

type QueryValue = string | number | boolean | undefined | null;

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const env = getEnv();
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...extra,
  };
  // DFlow's dev REST endpoints work without a key (rate-limited).
  // Production keys come from pond.dflow.net/build/api-key.
  if (env.DFLOW_API_KEY) {
    headers.Authorization = `Bearer ${env.DFLOW_API_KEY}`;
  }
  return headers;
}

function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return `${DFLOW_BASE}${path}${qs ? `?${qs}` : ''}`;
}

async function handleResponse<T>(upstream: Response): Promise<T> {
  if (upstream.status === 429) {
    const retryAfter = Number(upstream.headers.get('retry-after')) || 5;
    throw new DFlowRateLimitError(retryAfter);
  }
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    throw new DFlowUpstreamError(upstream.status, detail.slice(0, 500));
  }
  return (await upstream.json()) as T;
}

export async function dflowGet<T = unknown>(
  path: string,
  query: Record<string, QueryValue> = {},
  options: RequestOptions = {},
): Promise<T> {
  const upstream = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: authHeaders(),
    signal: options.signal,
  });
  return handleResponse<T>(upstream);
}

export async function dflowPost<T = unknown>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const upstream = await fetch(buildUrl(path), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body ?? {}),
    signal: options.signal,
  });
  return handleResponse<T>(upstream);
}