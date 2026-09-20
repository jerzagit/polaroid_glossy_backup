import { NextRequest } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  return proxyOrFallback('admin/users', { request });
}
