import { NextRequest, NextResponse } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';
import { requireSession } from '@/lib/auth';

async function requireOwnProfile(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return { error };

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return { error: NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 }) };
  }

  if (email.toLowerCase() !== session!.user!.email!.toLowerCase()) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { error: null };
}

export async function GET(request: NextRequest) {
  const { error } = await requireOwnProfile(request);
  if (error) return error;

  return proxyOrFallback('auth/profile', { request });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireOwnProfile(request);
  if (error) return error;

  const body = await request.json().catch(() => null);

  return proxyOrFallback('auth/profile', {
    request,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
