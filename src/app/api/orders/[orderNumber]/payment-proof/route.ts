import { NextRequest, NextResponse } from 'next/server';
import { getFallbackOrder, updateFallbackOrderPaymentProof } from '@/lib/orderFallback';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  try {
    const body = await request.json();
    const { paymentProofUrl, paymentReference } = body;

    if (!paymentProofUrl) {
      return NextResponse.json(
        { success: false, error: 'paymentProofUrl is required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;
    const cookie = request.headers.get('cookie');
    if (cookie) headers['cookie'] = cookie;

    const res = await fetch(`${API_BASE}/orders/${orderNumber}/payment-proof`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Fallback to local storage when backend is unavailable
    const body = await request.json().catch(() => null);
    if (!body?.paymentProofUrl) {
      return NextResponse.json(
        { success: false, error: 'Backend unavailable' },
        { status: 503 }
      );
    }

    const order = updateFallbackOrderPaymentProof(
      orderNumber,
      body.paymentProofUrl,
      body.paymentReference
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted (local fallback)',
      order: {
        orderNumber: order.orderNumber,
        paymentProofUrl: order.paymentProofUrl,
        paymentReference: order.paymentReference,
        status: order.status,
      },
    });
  }
}
