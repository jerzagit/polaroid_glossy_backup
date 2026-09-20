import { NextRequest } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  return proxyOrFallback(`orders/my${search}`, { request, timeoutMs: 30000 });
}
