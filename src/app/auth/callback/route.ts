import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user in our database
      try {
        await db.user.upsert({
          where: { supabaseId: data.user.id },
          update: {
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
            avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null
          },
          create: {
            supabaseId: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
            avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null
          }
        });
      } catch (dbError) {
        console.error('Error creating user in database:', dbError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
