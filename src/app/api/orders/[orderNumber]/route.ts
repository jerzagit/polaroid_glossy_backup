import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const backendUrl = `${API_BASE}/orders/${orderNumber}`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = _request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;
    const cookie = _request.headers.get('cookie');
    if (cookie) headers['cookie'] = cookie;

    const url = new URL(_request.url);
    const email = url.searchParams.get('email');
    const query = email ? `?email=${encodeURIComponent(email)}` : '';

    const res = await fetch(`${backendUrl}${query}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();

    // Backend returns raw order object or error; wrap for frontend consistency
    return NextResponse.json(
      res.ok ? { success: true, order: data } : data,
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
