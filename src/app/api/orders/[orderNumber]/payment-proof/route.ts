import { NextRequest, NextResponse } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const body = await request.json().catch(() => null) as { paymentProofUrl?: unknown } | null;

  if (!body?.paymentProofUrl) {
    return NextResponse.json(
      { success: false, error: 'paymentProofUrl is required' },
      { status: 400 }
    );
  }

  return proxyOrFallback(`orders/${orderNumber}/payment-proof`, {
    request,
    method: 'POST',
    body: JSON.stringify(body),
  });
}
