import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url') {
    console.warn('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url');
}
