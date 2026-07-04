import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const orderId = formData.get('orderId');
    const customerEmail = formData.get('customerEmail');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }
    if (!customerEmail || typeof customerEmail !== 'string') {
      return NextResponse.json({ success: false, error: 'customerEmail is required' }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append('file', file);

    const params = new URLSearchParams({ orderId, customerEmail });
    const res = await fetch(`${API_BASE}/files/upload?${params}`, {
      method: 'POST',
      body: backendForm,
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
