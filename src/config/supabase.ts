import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Public/Anon Supabase Client.
 * Subject to Row Level Security (RLS) policies for anonymous/public users.
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Admin / Service Role Supabase Client.
 * Bypasses RLS policies.
 * ⚠️ NEVER expose this key or client to frontend applications!
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Creates a scoped Supabase client with the user's JWT attached to all requests.
 * Executes queries under that specific user's permissions and RLS rules.
 */
export function createUserClient(jwtToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  });
}
