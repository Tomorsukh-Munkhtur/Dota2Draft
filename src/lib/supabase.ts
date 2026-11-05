// Сервер талын Supabase клиент (secret/service_role түлхүүр — клиент рүү хэзээ ч гаргахгүй).
// SUPABASE_URL ба SUPABASE_SERVICE_ROLE_KEY тохируулаагүй бол null.
// scripts/ дотроос node-оор шууд импортлогддог тул энд "@/..." alias хэрэглэхгүй.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }
  return client;
}

export function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data;
}
