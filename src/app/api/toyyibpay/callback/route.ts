import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { backendFetch } from '@/lib/backend';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  const rawBody = await request.clone().arrayBuffer();
  const formData = await request.formData();

  const refno = formData.get('refno') as string | null;
  const status = formData.get('status') as string | null;
  const reason = formData.get('reason') as string | null;
  const billcode = formData.get('billcode') as string | null;
  const order_id = formData.get('order_id') as string | null;
  const amount = formData.get('amount') as string | null;
  const transaction_time = formData.get('transaction_time') as string | null;
  const receivedHash = formData.get('hash') as string | null;

  console.log('ToyyibPay callback received:', {
    refno,
    status,
    reason,
    billcode,
    order_id,
    amount,
    transaction_time,
  });

  const VALID_STATUSES = ['1', '2', '3'];
  if (!order_id || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const expectedHash = crypto
    .createHash('md5')
    .update(secretKey + status + order_id + refno + 'ok')
    .digest('hex');

  if (!receivedHash || receivedHash !== expectedHash) {
    console.error('Hash validation failed');
    return NextResponse.json(
      { success: false, error: 'Invalid hash' },
      { status: 400 }
    );
  }

  try {
    const res = await backendFetch('toyyibpay/callback', {
      method: 'POST',
      body: rawBody,
      json: false,
      timeoutMs: 30000,
      headers: contentType ? { 'content-type': contentType } : undefined,
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { success: res.ok }, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
