import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

export async function POST(request: NextRequest) {
  return proxyOrFallback('auth/google', { request, method: 'POST', body: await jsonBody(request) });
}
