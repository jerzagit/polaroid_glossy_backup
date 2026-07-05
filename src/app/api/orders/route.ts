import { NextRequest, NextResponse } from 'next/server';
import { createFallbackOrder, getFallbackOrder } from '@/lib/orderFallback';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
const ALLOW_LOCAL_FALLBACK = process.env.NODE_ENV !== 'production';

async function proxyToBackend(request: NextRequest, method: string, extraPath = ''): Promise<NextResponse> {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('orderNumber');
  // Convert ?orderNumber=xxx to path param for Spring Boot
  if (orderNumber) {
    url.searchParams.delete('orderNumber');
  }
  const path = orderNumber ? `/${orderNumber}` : extraPath;
  const query = url.search;
  const backendUrl = `${API_BASE}/orders${path}${query}`;

  const body = method === 'GET' || method === 'DELETE' ? undefined : await request.json().catch(() => undefined);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;
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
    if (ALLOW_LOCAL_FALLBACK && method === 'GET' && orderNumber) {
      const order = getFallbackOrder(orderNumber);
      if (order) {
        return NextResponse.json({ success: true, order });
      }
    }

    if (ALLOW_LOCAL_FALLBACK && method === 'POST' && body && typeof body === 'object') {
      const order = createFallbackOrder(body);
      return NextResponse.json({
        success: true,
        order,
        warning: 'Backend unavailable; returned local development fallback order.',
      });
    }

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
