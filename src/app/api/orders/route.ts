import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

async function proxyToBackend(request: NextRequest, method: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const path = url.search;
  const backendUrl = `${API_BASE}/orders${path}`;

  try {
    const body = method === 'GET' || method === 'DELETE' ? undefined : await request.json().catch(() => undefined);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const cookie = request.headers.get('cookie');
    if (cookie) headers['cookie'] = cookie;

    const res = await fetch(backendUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, 'DELETE');
}
