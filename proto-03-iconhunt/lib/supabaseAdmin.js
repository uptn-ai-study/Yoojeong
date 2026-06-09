import { createClient } from '@supabase/supabase-js';

let adminClient = null;

export function hasSupabaseConfig() {
  return Boolean(
    normalizeSupabaseUrl(process.env.SUPABASE_URL) &&
    normalizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function normalizeSupabaseUrl(raw) {
  if (!raw) return '';
  let url = raw.trim().replace(/^['"]|['"]$/g, '');
  url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  return url;
}

function normalizeSupabaseKey(raw) {
  return raw?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = normalizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;

  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}
