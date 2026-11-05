import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { getHeroContent } from "./content";
import { GAME_DATA_TAG } from "./data";
import { HERO_CONTENT_TAG } from "./heroContentStore";
import { getHeroes, getItems, type Item, type ItemKind } from "./heroes";
import { ITEM_CONTENT_TAG, getItemContentOverrides } from "./itemContentStore";

export type ItemContent = {
  key: string;
  category: string;
  summary: string;
  abilities: { title: string; description: string }[];
  usage: string;
  goodFor: string[];
  tips: string[];
};

const CONTENT_DIR = path.join(process.cwd(), "data", "item-content");

/** data/item-content/<key>.json — анхны монгол танилцуулга, заавар (админы засваргүй). Байхгүй бол null. */
export async function readItemContentFile(key: string): Promise<ItemContent | null> {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG);
  try {
    return JSON.parse(await readFile(path.join(CONTENT_DIR, `${key}.json`), "utf8")) as ItemContent;
  } catch {
    return null;
  }
}

/** Сайтад харагдах контент: файл дахь текст + админы засвар (Supabase). Аль аль нь байхгүй бол null. */
export async function getItemContent(key: string): Promise<ItemContent | null> {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG, ITEM_CONTENT_TAG);
  const [base, overrides] = await Promise.all([readItemContentFile(key), getItemContentOverrides()]);
  const o = overrides[key];
  if (!o) return base;
  const empty: ItemContent = {
    key,
    category: getItems()[key]?.category ?? "",
    summary: "",
    abilities: [],
    usage: "",
    goodFor: [],
    tips: [],
  };
  return { ...(base ?? empty), ...o };
}

/** Жагсаалтын хуудсанд хэрэгтэй ангилал ба товч тайлбар. */
export async function getItemSummaries(kind: ItemKind) {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG, ITEM_CONTENT_TAG);
  const list = itemsOfKind(kind);
  const contents = await Promise.all(list.map((it) => getItemContent(it.key)));
  return list.map((it, i) => ({
    key: it.key,
    name: it.name,
    cost: it.cost,
    tier: it.tier,
    img: it.img,
    basic: !it.components,
    category: it.category,
    summary: contents[i]?.summary ?? "",
  }));
}

export function itemsOfKind(kind: ItemKind): Item[] {
  return Object.values(getItems())
    .filter((it) => it.kind === kind)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
}

/** Энэ item-ийг бүрэлдэхүүн болгон ашигладаг item-ууд. */
export function buildsInto(key: string): Item[] {
  return Object.values(getItems()).filter((it) => it.kind === "shop" && it.components?.includes(key));
}

/** Баатрын контентод энэ item-ийг counter болгон санал болгосон баатрууд. */
export async function heroesCounteredBy(key: string) {
  "use cache";
  cacheLife("days");
  cacheTag(GAME_DATA_TAG, HERO_CONTENT_TAG);
  const all = await Promise.all(getHeroes().map((h) => getHeroContent(h.slug)));
  return all.flatMap((c) => {
    const hit = c.counterItems.find((x) => x.item === key);
    return hit ? [{ slug: c.slug, reason: hit.reason }] : [];
  });
}
