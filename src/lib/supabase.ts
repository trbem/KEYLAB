import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function isPublicKey(key: string): boolean {
  if (key.startsWith('sb_publishable_')) return true;
  try {
    const payload = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).role === 'anon';
  } catch {
    return false;
  }
}

/** One shared browser client for the catalog and existing cloud features. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isPublicKey(key)) return null;
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:'))) return null;
    client = createClient(url, key);
    return client;
  } catch {
    return null;
  }
}
