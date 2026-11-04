import { memo, readData } from "./data";
import type { Attr } from "./labels";

export * from "./labels";

export type Hero = {
  id: number;
  slug: string;
  name: string;
  attr: Attr;
  attackType: string;
  roles: string[];
  /** 1–3: тоглоход хялбар / дунд / хэцүү. */
  complexity?: number;
  img: string;
  icon: string;
  cmEnabled: boolean;
  stats: {
    str: number;
    agi: number;
    int: number;
    strGain: number;
    agiGain: number;
    intGain: number;
    health: number;
    mana: number;
    armor: number;
    attackMin: number;
    attackMax: number;
    attackRange: number;
    moveSpeed: number;
    attackRate: number;
  };
};

export type ItemKind = "shop" | "neutral" | "enchantment" | "legacy";

export type Item = {
  id: number;
  key: string;
  name: string;
  kind: ItemKind;
  cost: number;
  tier: number | null;
  /** Дэлгүүрийн таб (shops.txt-ийн хэсэг), зөвхөн дэлгүүрийн item-д. */
  category: string | null;
  img: string;
  components: string[] | null;
  abilities: { type: string; title: string; description: string }[];
  attrib: { key: string; display: string; value: string }[];
  cooldown: number | null;
  manaCost: number | null;
  lore: string;
  notes: string;
};

/** Клиент рүү дамжуулахад хангалттай хэсэг. */
export type ItemBrief = Pick<Item, "id" | "key" | "name" | "cost" | "img">;

export type CounterItem = { item: string; reason: string };

export type HeroContent = {
  slug: string;
  lore: string;
  summary: string;
  similar: string[];
  counterItems: CounterItem[];
  counterTips: string[];
};

export type HeroAbility = {
  id: number;
  key: string;
  name: string;
  img: string;
  desc: string;
  notes: string[];
  lore: string;
  scepter: string;
  shard: string;
  ultimate: boolean;
  innate: boolean;
  fromScepter: boolean;
  fromShard: boolean;
  passive: boolean;
  damageType: "physical" | "magical" | "pure" | null;
  piercesImmunity: boolean | null;
  dispellable: "strong" | "yes" | "no" | null;
  cooldown: string | null;
  manaCost: string | null;
  values: { label: string; value: string }[];
};

export type HeroKit = { abilities: HeroAbility[]; talents: { level: number; options: string[] }[] };

export function getHeroes(): Hero[] {
  return readData<Hero[]>("heroes.json");
}

export function getItems(): Record<string, Item> {
  return readData<Record<string, Item>>("items.json");
}

const slugMaps = new WeakMap<Hero[], Map<string, Hero>>();

export function getHero(slug: string): Hero | undefined {
  const list = getHeroes();
  return memo(slugMaps, list, () => new Map(list.map((h) => [h.slug, h]))).get(slug);
}

/** Баатрын skill, talent (Valve-ийн одоогийн текст, англи). */
export function getHeroKit(slug: string): HeroKit | null {
  return readData<Record<string, HeroKit>>("hero-abilities.json", {})[slug] ?? null;
}
