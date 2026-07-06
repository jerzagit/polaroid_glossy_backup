import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;
    const cookie = request.headers.get('cookie');
    if (cookie) headers['cookie'] = cookie;

    const res = await fetch(`${API_BASE}/admin/orders`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Fallback: return empty orders when backend is unavailable
    return NextResponse.json({
      success: true,
      orders: [],
      message: 'Backend unavailable - showing empty list',
    });
  }
}
