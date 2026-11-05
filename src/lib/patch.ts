import { cacheLife, cacheTag } from "next/cache";
import { readData } from "./data";
import { check, getSupabase, logSupabaseReadError } from "./supabase.ts";

export const PATCH_TR_TAG = "patch-translations";

export type PatchLine = { t: string; i: number; a?: string | null };
export type PatchEntry = { key: string | null; title: string | null; lines: PatchLine[] };
export type Patch = {
  patch: string;
  date: string;
  general: { title: string; lines: PatchLine[] }[];
  heroes: { slug: string; lines: PatchLine[] }[];
  items: PatchEntry[];
  neutralItems: PatchEntry[];
  neutralCreeps: { name: string; lines: PatchLine[] }[];
};
type PatchesFile = { major: string; latest: string; patches: Patch[] };

/** Одоогийн том патчийн бүх дэд патч, шинэ нь эхэндээ. */
export function getPatches(): PatchesFile {
  return readData<PatchesFile>("patches.json", { major: "", latest: "", patches: [] });
}

export function getPatch(version: string): Patch | null {
  return getPatches().patches.find((p) => p.patch === version) ?? null;
}

/** Админ засварласан орчуулгууд (Supabase). Хүснэгт байхгүй/алдаатай бол хоосон. */
export async function getPatchTranslationOverrides(): Promise<Record<string, string>> {
  "use cache";
  cacheTag(PATCH_TR_TAG);
  const db = getSupabase();
  if (!db) {
    cacheLife("hours");
    return {};
  }
  try {
    const rows = check(await db.from("patch_translations").select("en, mn")) as { en: string; mn: string }[];
    cacheLife("hours");
    return Object.fromEntries(rows.map((r) => [r.en, r.mn]));
  } catch (e) {
    logSupabaseReadError("patch-translations", e, "supabase/migrations/0002_banners_patch_translations.sql");
    cacheLife("minutes");
    return {};
  }
}

/**
 * Англи текст → монгол: мөр бүрийг админы засвар, эс бөгөөс машин орчуулга (`file`), эс бөгөөс англиар нь.
 * Олон мөртэй текстийг (skill-ийн тайлбар) мөр мөрөөр нь орчуулна — scripts/lib/gtranslate.mjs-тэй ижил.
 */
async function makeTranslator(file: string) {
  const overrides = await getPatchTranslationOverrides();
  const machine = readData<Record<string, string>>(file, {});
  return (en: string) =>
    en
      .split("\n")
      .map((line) => {
        const t = line.trim();
        return t ? (overrides[t] ?? machine[t] ?? line) : line;
      })
      .join("\n");
}

/** Патчийн тэмдэглэлийн орчуулагч. */
export function getPatchTranslator() {
  return makeTranslator("patch-notes-mn.json");
}

/** Баатрын skill, талантын орчуулагч. */
export function getAbilityTranslator() {
  return makeTranslator("abilities-mn.json");
}

export type GameMeta = {
  patch?: string;
  patchDate?: string;
  gameDataUpdatedAt?: string;
  matchupsUpdatedAt?: string;
  source?: string;
};

export type PatchNoteEntry = { patch: string; lines: { ability: string | null; text: string }[] };

type PatchNotesFile = {
  major: string;
  patches: string[];
  heroes: Record<string, PatchNoteEntry[]>;
  items: Record<string, { patch: string; lines: string[] }[]>;
};

/** Сайтын өгөгдөл аль патчийнх болох, хэзээ шинэчлэгдсэн. */
export function getGameMeta(): GameMeta {
  return readData<GameMeta>("meta.json", {});
}

const EMPTY: PatchNotesFile = { major: "", patches: [], heroes: {}, items: {} };

export function getHeroPatchNotes(slug: string) {
  const notes = readData<PatchNotesFile>("patch-notes.json", EMPTY);
  return { major: notes.major, entries: notes.heroes[slug] ?? [] };
}

export function getItemPatchNotes(key: string) {
  const notes = readData<PatchNotesFile>("patch-notes.json", EMPTY);
  return { major: notes.major, entries: notes.items[key] ?? [] };
}

/** ISO огноог "2026.09.15" хэлбэрээр. */
export function shortDate(iso?: string) {
  return iso ? iso.slice(0, 10).replace(/-/g, ".") : "—";
}
