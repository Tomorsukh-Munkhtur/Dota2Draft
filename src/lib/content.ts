import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { GAME_DATA_TAG, readData } from "./data";
import { HERO_CONTENT_TAG, getHeroContentOverrides } from "./heroContentStore";
import { getHeroes, type HeroContent } from "./heroes";

const CONTENT_DIR = path.join(process.cwd(), "data", "hero-content");

type Content = HeroContent & { translated: boolean };

/** data/hero-content/<slug>.json — анхны монгол текст (админы засваргүй). Байхгүй бол англи түүхээр нөхнө. */
export async function readHeroContentFile(slug: string): Promise<Content> {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG);
  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${slug}.json`), "utf8");
    return { ...(JSON.parse(raw) as HeroContent), translated: true };
  } catch {
    return {
      slug,
      lore: readData<Record<string, string>>("lore_en.json", {})[slug] ?? "",
      summary: "",
      similar: [],
      counterItems: [],
      counterTips: [],
      translated: false,
    };
  }
}

/** Сайтад харагдах контент: файл дахь текст + админы засвар (Supabase). */
export async function getHeroContent(slug: string): Promise<Content> {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG, HERO_CONTENT_TAG);
  const [base, overrides] = await Promise.all([readHeroContentFile(slug), getHeroContentOverrides()]);
  const o = overrides[slug];
  if (!o) return base;
  return { ...base, ...o, translated: base.translated || o.lore !== undefined };
}

/** Драфтын туслахад хэрэгтэй хэсэг (түүхгүйгээр) бүх баатарт. */
export async function getDraftContent() {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG, HERO_CONTENT_TAG);
  const all = await Promise.all(getHeroes().map((h) => getHeroContent(h.slug)));
  return Object.fromEntries(
    all.map((c) => [c.slug, { summary: c.summary, similar: c.similar, counterItems: c.counterItems }]),
  );
}
