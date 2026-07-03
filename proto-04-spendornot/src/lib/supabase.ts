import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project')) return false;
  if (supabaseAnonKey === 'your-anon-key') return false;
  return true;
}

let cachedClient: SupabaseClient | null = null;
let cachedUserKey: string | null = null;

export function getSupabaseClient(tossUserKey: string): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  if (cachedClient && cachedUserKey === tossUserKey) {
    return cachedClient;
  }

  cachedUserKey = tossUserKey;
  cachedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        'x-toss-user-key': tossUserKey,
      },
    },
  });

  return cachedClient;
}

export function resetSupabaseClient(): void {
  cachedClient = null;
  cachedUserKey = null;
}
