// Драфтын дүрэм ба зөвлөмжийн тооцоо. Клиент талд ажиллана.
import type { Attr, CounterItem, ItemBrief } from "./heroes";

export type Side = "radiant" | "dire";
export type Order = "first" | "second";
export type Action = "pick" | "ban";

export type CmStep = { order: Order; action: Action; phase: number; seconds: number };

const step = (order: Order, action: Action, phase: number, seconds: number): CmStep => ({
  order,
  action,
  phase,
  seconds,
});

/** Captain's Mode — 7.40 патчаас хойшх дараалал (Liquipedia). */
export const CM_STEPS: CmStep[] = [
  // 1-р бан үе (15 сек)
  step("first", "ban", 1, 15),
  step("first", "ban", 1, 15),
  step("second", "ban", 1, 15),
  step("second", "ban", 1, 15),
  step("first", "ban", 1, 15),
  step("second", "ban", 1, 15),
  step("second", "ban", 1, 15),
  // 1-р пик үе
  step("first", "pick", 1, 30),
  step("second", "pick", 1, 30),
  // 2-р бан үе
  step("first", "ban", 2, 30),
  step("first", "ban", 2, 30),
  step("second", "ban", 2, 30),
  // 2-р пик үе
  step("second", "pick", 2, 30),
  step("first", "pick", 2, 30),
  step("first", "pick", 2, 30),
  step("second", "pick", 2, 30),
  step("second", "pick", 2, 30),
  step("first", "pick", 2, 30),
  // 3-р бан үе
  step("first", "ban", 3, 30),
  step("second", "ban", 3, 30),
  step("first", "ban", 3, 30),
  step("second", "ban", 3, 30),
  // 3-р пик үе
  step("first", "pick", 3, 30),
  step("second", "pick", 3, 30),
];

export const CM_RESERVE_SECONDS = 130;

export type DraftHero = {
  slug: string;
  name: string;
  attr: Attr;
  roles: string[];
  img: string;
  icon: string;
  cmEnabled: boolean;
};

export type DraftContent = Record<string, { summary: string; similar: string[]; counterItems: CounterItem[] }>;

export type DraftData = {
  heroes: DraftHero[];
  /** vs[i][j]: i нь j-ийн эсрэг хэдэн %-ийн давуу талтай. */
  vs: number[][];
  /** with[i][j]: i ба j нэг багт байхад хэдэн %-ийн нэмэгдэлтэй. */
  with: number[][];
  winrate: number[];
  content: DraftContent;
  items: Record<string, ItemBrief>;
  meta: { matchCount: number; to: string; patch: string | null };
};

export type Contribution = { hero: number; value: number; kind: "vs" | "with" };

export type Suggestion = { hero: number; score: number; parts: Contribution[] };

/**
 * `allies` багт нэмэхэд хамгийн тохиромжтой баатрууд.
 * Оноо = эсрэг баатруудын эсрэг давуу тал + холбоотнуудтай хамтын нэмэгдэл + ерөнхий ялалтын хувийн бага жин.
 */
export function suggest(data: DraftData, allies: number[], enemies: number[], taken: Set<number>, limit = 12) {
  const out: Suggestion[] = [];
  for (let h = 0; h < data.heroes.length; h++) {
    if (taken.has(h)) continue;
    const parts: Contribution[] = [
      ...enemies.map((e) => ({ hero: e, value: data.vs[h][e], kind: "vs" as const })),
      ...allies.map((a) => ({ hero: a, value: data.with[h][a], kind: "with" as const })),
    ];
    const score = parts.reduce((s, p) => s + p.value, 0) + (data.winrate[h] - 50) * 0.5;
    out.push({ hero: h, score, parts });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Сонгогдоогүй баатруудаас `target`-ийн эсрэг хамгийн сайн (эсвэл муу) тоглодог нь. */
export function bestAgainst(data: DraftData, target: number, taken: Set<number>, limit = 5) {
  return data.heroes
    .map((_, h) => ({ hero: h, value: data.vs[h][target] }))
    .filter((r) => r.hero !== target && !taken.has(r.hero))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function formatPct(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}
