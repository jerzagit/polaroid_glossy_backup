import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyOrFallback(`addresses/${id}`, {
    request,
    method: 'PUT',
    body: await jsonBody(request),
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyOrFallback(`addresses/${id}`, { request, method: 'DELETE' });
}
