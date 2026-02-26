import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/user/profile - Get user profile by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { email }
    });

    if (!user) {
      // Create user if doesn't exist
      const newUser = await db.user.create({
        data: {
          supabaseId: `google-${Date.now()}`,
          email,
          name: null,
          avatar: null
        }
      });
      return NextResponse.json({ 
        success: true, 
        profile: newUser 
      });
    }

    return NextResponse.json({ 
      success: true, 
      profile: user 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { email },
      data: {
        name: name || undefined,
        phone: phone || undefined
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: user 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
