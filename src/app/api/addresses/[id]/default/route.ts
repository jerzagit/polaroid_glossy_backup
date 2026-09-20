import { NextRequest } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyOrFallback(`addresses/${id}/default`, { request, method: 'PATCH' });
}
