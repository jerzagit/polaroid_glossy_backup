import { createBrowserClient } from '@supabase/ssr';

const BUCKET_NAME = 'order-photos';

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

/**
 * Upload a file to Supabase Storage under orders/{orderNumber}/{filename}.
 * Returns the public URL on success, null on failure.
 */
export async function uploadOrderPhoto(
  file: File,
  orderNumber: string,
  filename: string,
): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;

  const path = `orders/${orderNumber}/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('Supabase upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
