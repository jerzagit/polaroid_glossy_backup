import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { createFallbackOrder, getFallbackOrder } from '@/lib/orderFallback';

const ALLOW_LOCAL_FALLBACK = process.env.NODE_ENV !== 'production';

// Order creation (POST/PUT) can involve a slow cold-started backend (email
// notifications, upload flows). Reads are fast, so use a shorter timeout.
const TIMEOUT_MS = { POST: 45000, PUT: 45000, DELETE: 45000, GET: 20000 } as const;

async function proxyToBackend(request: NextRequest, method: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('orderNumber');
  // Convert ?orderNumber=xxx to path param for Spring Boot
  if (orderNumber) {
    url.searchParams.delete('orderNumber');
  }
  const path = orderNumber ? `/${orderNumber}` : '';
  const query = url.search;

  const body = method === 'GET' || method === 'DELETE' ? undefined : await request.json().catch(() => undefined);

  try {
    const res = await backendFetch(`orders${path}${query}`, {
      request,
      method,
      body: body ? JSON.stringify(body) : undefined,
      timeoutMs: TIMEOUT_MS[method as keyof typeof TIMEOUT_MS] ?? 20000,
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
