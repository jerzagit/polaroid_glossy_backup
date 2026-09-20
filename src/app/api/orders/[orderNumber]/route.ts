import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { getFallbackOrder } from '@/lib/orderFallback';

const ALLOW_LOCAL_FALLBACK = process.env.NODE_ENV !== 'production';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const email = new URL(request.url).searchParams.get('email');
  const query = email ? `?email=${encodeURIComponent(email)}` : '';

  try {
    const res = await backendFetch(`orders/${orderNumber}${query}`, { request });
    const data = await res.json();

    // Backend returns raw order object or error; wrap for frontend consistency
    return NextResponse.json(
      res.ok && data?.success && data?.order ? data : (res.ok ? { success: true, order: data } : data),
      { status: res.status }
    );
  } catch {
    const order = ALLOW_LOCAL_FALLBACK ? getFallbackOrder(orderNumber) : null;
    if (order) {
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json(
      { success: false, error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
