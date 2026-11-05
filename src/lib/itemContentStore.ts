// Item-ийн контентын админ засвар: Supabase-ийн `item_content` хүснэгт. data/item-content-ийн дээр давхарлана.
import { cacheLife, cacheTag } from "next/cache";
import { check, getSupabase, logSupabaseReadError } from "./supabase.ts";

export const ITEM_CONTENT_TAG = "item-content";

export type ItemAbilityText = { title: string; description: string };

export type ItemContentOverride = {
  summary?: string;
  usage?: string;
  abilities?: ItemAbilityText[];
  tips?: string[];
  goodFor?: string[];
};

type Row = {
  key: string;
  summary: string | null;
  usage: string | null;
  abilities: ItemAbilityText[] | null;
  tips: string[] | null;
  good_for: string[] | null;
};

const FIELDS = {
  summary: "summary",
  usage: "usage",
  abilities: "abilities",
  tips: "tips",
  goodFor: "good_for",
} as const;

function fromRow(r: Row): ItemContentOverride {
  const o: ItemContentOverride = {};
  if (r.summary != null) o.summary = r.summary;
  if (r.usage != null) o.usage = r.usage;
  if (r.abilities != null) o.abilities = r.abilities;
  if (r.tips != null) o.tips = r.tips;
  if (r.good_for != null) o.goodFor = r.good_for;
  return o;
}

/** Бүх item-ийн засвар (key → засагдсан талбарууд). Хүснэгт байхгүй/алдаатай бол хоосон. */
export async function getItemContentOverrides(): Promise<Record<string, ItemContentOverride>> {
  "use cache";
  cacheTag(ITEM_CONTENT_TAG);
  const db = getSupabase();
  if (!db) {
    cacheLife("hours");
    return {};
  }
  try {
    const rows = check(await db.from("item_content").select("*")) as Row[];
    cacheLife("hours");
    return Object.fromEntries(rows.map((r) => [r.key, fromRow(r)]));
  } catch (e) {
    logSupabaseReadError("item-content", e, "supabase/migrations/0003_content_overrides.sql");
    cacheLife("minutes");
    return {};
  }
}

/** Өгсөн талбаруудыг хадгална. Утга нь null бол тэр талбарын засварыг арилгаж анхных руу буцаана. */
export async function saveItemContentOverride(
  key: string,
  fields: { [K in keyof ItemContentOverride]?: ItemContentOverride[K] | null },
) {
  const db = getSupabase();
  if (!db) throw new Error("Supabase тохируулаагүй байна.");
  const row: Record<string, unknown> = { key, updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(fields)) row[FIELDS[k as keyof typeof FIELDS]] = v ?? null;
  check(await db.from("item_content").upsert(row));
}
