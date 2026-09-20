import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

export async function GET(request: NextRequest) {
  return proxyOrFallback('addresses', { request });
}

export async function POST(request: NextRequest) {
  return proxyOrFallback('addresses', { request, method: 'POST', body: await jsonBody(request) });
}
