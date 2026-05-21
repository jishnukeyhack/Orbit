/*
 * SUPABASE SETUP CHECKLIST (do this in your Supabase dashboard):
 * 1. Authentication > Providers > Email — enable "Confirm email"
 * 2. Authentication > Providers > Google — enable, add OAuth credentials
 * 3. Authentication > URL Configuration:
 *    Site URL: http://localhost:3000 (dev) / your production URL
 *    Redirect URLs: http://localhost:3000/api/auth/callback
 * 4. Copy Project URL and anon key into .env.local
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
