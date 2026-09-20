import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';
import { requireAdmin } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  return proxyOrFallback(`admin/products/${id}`, {
    request,
    method: 'PUT',
    body: await jsonBody(request),
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  return proxyOrFallback(`admin/products/${id}`, { request, method: 'PATCH' });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  return proxyOrFallback(`admin/products/${id}`, { request, method: 'DELETE' });
}
