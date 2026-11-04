import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { GAME_DATA_TAG, readData } from "./data";
import { getHeroes, type HeroContent } from "./heroes";

const CONTENT_DIR = path.join(process.cwd(), "data", "hero-content");

/** data/hero-content/<slug>.json — монгол түүх, ойролцоо баатар, counter item. Байхгүй бол англи түүхээр нөхнө. */
export async function getHeroContent(slug: string): Promise<HeroContent & { translated: boolean }> {
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

/** Драфтын туслахад хэрэгтэй хэсэг (түүхгүйгээр) бүх баатарт. */
export async function getDraftContent() {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG);
  const all = await Promise.all(getHeroes().map((h) => getHeroContent(h.slug)));
  return Object.fromEntries(
    all.map((c) => [c.slug, { summary: c.summary, similar: c.similar, counterItems: c.counterItems }]),
  );
}
