import { NextRequest, NextResponse } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';
import { requireSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

  if (email.toLowerCase() !== session!.user!.email!.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return proxyOrFallback(`user/profile?email=${encodeURIComponent(email)}`, { request });
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email : null;

  if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

  if (email.toLowerCase() !== session!.user!.email!.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return proxyOrFallback('user/profile', {
    request,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
