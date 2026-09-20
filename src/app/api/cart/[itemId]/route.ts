import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  return proxyOrFallback(`cart/items/${itemId}`, {
    request,
    method: 'PUT',
    body: await jsonBody(request),
    timeoutMs: 10000,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  return proxyOrFallback(`cart/items/${itemId}`, { request, method: 'DELETE', timeoutMs: 10000 });
}
