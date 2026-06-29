import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

  // Users can only fetch their own profile
  if (email.toLowerCase() !== session!.user!.email!.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const user = await db.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, profile: user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const { email, name, phone } = body;

    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    // Users can only update their own profile
    if (email.toLowerCase() !== session!.user!.email!.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const user = await db.user.update({
      where: { email },
      data: { name: name || undefined, phone: phone || undefined }
    });

    return NextResponse.json({ success: true, profile: user });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
