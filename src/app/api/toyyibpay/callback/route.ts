import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  const rawBody = await request.arrayBuffer();

  try {
    const res = await backendFetch('webhooks/toyyibpay', {
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
