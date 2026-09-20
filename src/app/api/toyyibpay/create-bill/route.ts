import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

export async function POST(request: NextRequest) {
  return proxyOrFallback('toyyibpay/create-bill', {
    request,
    method: 'POST',
    body: await jsonBody(request),
    timeoutMs: 45000,
  });
}
