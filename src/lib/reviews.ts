// Админы "Анхаарах зүйлс"-ээс "Шалгасан" гэж тэмдэглэсэн мөрүүд: Supabase-ийн `admin_reviews` хүснэгт.
import { cacheLife, cacheTag } from "next/cache";
import { check, getSupabase, logSupabaseReadError } from "./supabase.ts";

export const REVIEWS_TAG = "admin-reviews";

/** Шалгасан мөрүүдийн түлхүүрүүд. Хүснэгт байхгүй/алдаатай бол хоосон. */
export async function getReviewedKeys(): Promise<string[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  const db = getSupabase();
  if (!db) {
    cacheLife("hours");
    return [];
  }
  try {
    const rows = check(await db.from("admin_reviews").select("key")) as { key: string }[];
    cacheLife("hours");
    return rows.map((r) => r.key);
  } catch (e) {
    logSupabaseReadError("admin-reviews", e, "supabase/migrations/0003_content_overrides.sql");
    cacheLife("minutes");
    return [];
  }
}

export async function setReviewed(key: string, reviewed: boolean) {
  const db = getSupabase();
  if (!db) throw new Error("Supabase тохируулаагүй байна.");
  if (reviewed) check(await db.from("admin_reviews").upsert({ key, reviewed_at: new Date().toISOString() }));
  else check(await db.from("admin_reviews").delete().eq("key", key));
}
