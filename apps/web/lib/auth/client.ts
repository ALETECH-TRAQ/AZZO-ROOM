import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }));
}
export async function authHeaders() {
  const c = getSupabase();
  const s = c ? await c.auth.getSession() : null;
  return s?.data.session
    ? { Authorization: `Bearer ${s.data.session.access_token}` }
    : { Authorization: "" };
}
