import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';

async function proxyToBackend(request: NextRequest, method: string) {
  const isRead = method === 'GET';
  return proxyOrFallback('cart', {
    request,
    method,
    body: isRead ? undefined : await jsonBody(request),
    timeoutMs: 10000,
    fallback: isRead ? { success: true, cart: null } : undefined,
  });
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, 'DELETE');
}
