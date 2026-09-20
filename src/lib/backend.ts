import { NextResponse } from 'next/server';

const DEFAULT_TIMEOUT_MS = 15000;

export class BackendUnavailableError extends Error {
  constructor() {
    super('Backend unavailable');
    this.name = 'BackendUnavailableError';
  }
}

export function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
  return `${base.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
}

export function backendUrl(path: string): string {
  return `${apiBase()}/${path.replace(/^\/+/, '')}`;
}

export type BackendFetchOptions = {
  request?: Request;
  method?: string;
  body?: BodyInit | null;
  json?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

/**
 * Calls the Spring Boot backend and returns its raw Response.
 *
 * Throws BackendUnavailableError only when the backend cannot be reached
 * (network failure or timeout). A non-2xx response is still returned so
 * callers can forward the backend's own status code and error body.
 */
export async function backendFetch(path: string, options: BackendFetchOptions = {}): Promise<Response> {
  const { request, method = 'GET', body, json = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers: extraHeaders } = options;

  const headers = new Headers();
  if (json) headers.set('content-type', 'application/json');
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value);
  }
  if (request) {
    const authorization = request.headers.get('authorization');
    if (authorization) headers.set('authorization', authorization);
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
  }

  try {
    return await fetch(backendUrl(path), {
      method,
      headers,
      body: body ?? undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new BackendUnavailableError();
  }
}

/** Serialises a request body for forwarding, tolerating an absent/invalid body. */
export async function jsonBody(request: Request): Promise<string | undefined> {
  const body = await request.json().catch(() => undefined);
  return body ? JSON.stringify(body) : undefined;
}

export type BackendResult = {
  status: number;
  ok: boolean;
  data: unknown;
};

export type ProxyOrFallbackOptions = BackendFetchOptions & {
  fallback?: unknown;
  fallbackWhen?: (result: BackendResult) => boolean;
  unavailableStatus?: number;
};

/**
 * Proxies a backend response through untouched, or serves `fallback` when the
 * backend is unreachable (or when `fallbackWhen` accepts the response).
 *
 * With no `fallback`, an unreachable backend yields
 * `{ success: false, error: 'Backend unavailable' }` — never fabricated data.
 */
export async function proxyOrFallback(path: string, options: ProxyOrFallbackOptions = {}): Promise<NextResponse> {
  const { fallback, fallbackWhen, unavailableStatus = 503, ...fetchOptions } = options;

  try {
    const response = await backendFetch(path, fetchOptions);
    const data: unknown = await response.json();

    if (fallback !== undefined && fallbackWhen?.({ status: response.status, ok: response.ok, data })) {
      return NextResponse.json(fallback);
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    if (fallback !== undefined) {
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { success: false, error: 'Backend unavailable' },
      { status: unavailableStatus }
    );
  }
}
