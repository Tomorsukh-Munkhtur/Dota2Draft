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

const warned = new Set<string>();

/**
 * Supabase-ээс унших үеийн алдааг лог руу бичнэ. Хүснэгт үүсээгүй (migration ажиллуулаагүй) бол хүсэлт бүрт
 * давтахгүй, нэг л удаа юу хийхийг зааж анхааруулна — сайт тэр хооронд анхдагч утгаар хэвийн ажиллана.
 */
export function logSupabaseReadError(scope: string, e: unknown, migration: string) {
  const message = e instanceof Error ? e.message : String(e);
  const missingTable = /could not find the table|does not exist|PGRST205|42P01/i.test(message);
  const key = `${scope}:${missingTable ? "missing" : message}`;
  if (warned.has(key)) return;
  warned.add(key);
  if (missingTable)
    console.warn(
      `[${scope}] Supabase-д хүснэгт хараахан алга. Supabase → SQL Editor дээр ${migration}-ийг нэг удаа ажиллуулна уу. Түүнээс өмнө сайт анхдагч утгаар ажиллана.`,
    );
  else console.error(`[${scope}] уншиж чадсангүй: ${message}`);
}
