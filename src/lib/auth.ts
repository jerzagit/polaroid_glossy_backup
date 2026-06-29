import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { session: null, error: NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  if (!adminEmails.includes(session!.user!.email!.toLowerCase())) {
    return { session: null, error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}
