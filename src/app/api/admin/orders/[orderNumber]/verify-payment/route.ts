import { NextRequest } from 'next/server';
import { jsonBody, proxyOrFallback } from '@/lib/backend';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { orderNumber } = await params;
  return proxyOrFallback(`admin/orders/${orderNumber}/verify-payment`, {
    request,
    method: 'POST',
    body: await jsonBody(request),
  });
}
