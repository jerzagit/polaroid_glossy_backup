import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  return proxyOrFallback('admin/products', { request });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  return proxyOrFallback('admin/products', {
    request,
    method: 'POST',
    body: await jsonBody(request),
  });
}
