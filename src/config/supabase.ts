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

/**
 * Automatically retries Supabase database operations if transient clock skew causes "JWT issued at future".
 */
export async function withClockSkewRetry<T>(operation: () => Promise<T>, maxRetries = 2, delayMs = 600): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const result: any = await operation();
      if (
        result &&
        result.error &&
        typeof result.error.message === 'string' &&
        result.error.message.toLowerCase().includes('jwt issued at future')
      ) {
        if (attempt < maxRetries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }
      return result;
    } catch (err: any) {
      if (
        attempt < maxRetries &&
        typeof err?.message === 'string' &&
        err.message.toLowerCase().includes('jwt issued at future')
      ) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}
