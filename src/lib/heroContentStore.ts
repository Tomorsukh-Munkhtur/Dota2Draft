// Баатрын контентын админ засвар: Supabase-ийн `hero_content` хүснэгт. Файл дахь анхны текстийн дээр давхарлана.
import { cacheLife, cacheTag } from "next/cache";
import type { CounterItem, HeroContent } from "./heroes";
import { check, getSupabase, logSupabaseReadError } from "./supabase.ts";

export const HERO_CONTENT_TAG = "hero-content";

export type HeroContentOverride = Partial<Pick<HeroContent, "summary" | "lore" | "counterItems" | "counterTips" | "similar">>;

type Row = {
  slug: string;
  summary: string | null;
  lore: string | null;
  counter_items: CounterItem[] | null;
  counter_tips: string[] | null;
  similar: string[] | null;
};

const FIELDS = {
  summary: "summary",
  lore: "lore",
  counterItems: "counter_items",
  counterTips: "counter_tips",
  similar: "similar",
} as const;

function fromRow(r: Row): HeroContentOverride {
  const o: HeroContentOverride = {};
  if (r.summary != null) o.summary = r.summary;
  if (r.lore != null) o.lore = r.lore;
  if (r.counter_items != null) o.counterItems = r.counter_items;
  if (r.counter_tips != null) o.counterTips = r.counter_tips;
  if (r.similar != null) o.similar = r.similar;
  return o;
}

/** Бүх баатрын засвар (slug → засагдсан талбарууд). Хүснэгт байхгүй/алдаатай бол хоосон. */
export async function getHeroContentOverrides(): Promise<Record<string, HeroContentOverride>> {
  "use cache";
  cacheTag(HERO_CONTENT_TAG);
  const db = getSupabase();
  if (!db) {
    cacheLife("hours");
    return {};
  }
  try {
    const rows = check(await db.from("hero_content").select("*")) as Row[];
    cacheLife("hours");
    return Object.fromEntries(rows.map((r) => [r.slug, fromRow(r)]));
  } catch (e) {
    logSupabaseReadError("hero-content", e, "supabase/migrations/0003_content_overrides.sql");
    cacheLife("minutes");
    return {};
  }
}

/** Өгсөн талбаруудыг хадгална. Утга нь null бол тэр талбарын засварыг арилгаж анхных руу буцаана. */
export async function saveHeroContentOverride(
  slug: string,
  fields: { [K in keyof HeroContentOverride]?: HeroContentOverride[K] | null },
) {
  const db = getSupabase();
  if (!db) throw new Error("Supabase тохируулаагүй байна.");
  const row: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(fields)) row[FIELDS[k as keyof typeof FIELDS]] = v ?? null;
  check(await db.from("hero_content").upsert(row));
}
