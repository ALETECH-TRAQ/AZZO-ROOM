import { createClient } from "@supabase/supabase-js";
export async function authorize(token: unknown, workspace: unknown) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_ANON_KEY;
  if (
    !url ||
    !key ||
    typeof token !== "string" ||
    typeof workspace !== "string" ||
    token.length > 8192
  )
    return null;
  const db = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const member = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace)
    .eq("user_id", data.user.id)
    .maybeSingle();
  return member.data ? data.user : null;
}
