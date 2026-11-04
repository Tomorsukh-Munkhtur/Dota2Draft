import { memo, readData } from "./data";
import { getHeroes, type Hero } from "./heroes";

type MatchupFile = {
  generatedAt: string;
  matchCount: number;
  from: string;
  to: string;
  heroIds: number[];
  winrate: number[];
  pickRate: number[];
  vs: number[][];
  vsGames: number[][];
  with: number[][];
  withGames: number[][];
};

export type MatchupRow = { slug: string; value: number; games: number };

const load = () => readData<MatchupFile>("matchups.json");

// matchups.json ба heroes.json-ийг тусад нь шинэчилж болох тул баатрын индексийг ID-аар тулгана.
const indexCache = new WeakMap<MatchupFile, WeakMap<Hero[], number[]>>();
function heroIndex(data: MatchupFile, heroes: Hero[]) {
  const perData = memo(indexCache, data, () => new WeakMap<Hero[], number[]>());
  return memo(perData, heroes, () => {
    const byId = new Map(data.heroIds.map((id, i) => [id, i]));
    return heroes.map((h) => byId.get(h.id) ?? -1);
  });
}

export function getMatchupMeta() {
  const { matchCount, from, to, generatedAt } = load();
  return { matchCount, from, to, generatedAt };
}

/** getHeroes() массив дахь индексээр → ялалтын хувь. */
export function heroWinrate(i: number) {
  const data = load();
  const k = heroIndex(data, getHeroes())[i];
  return k === undefined || k < 0 ? 50 : data.winrate[k];
}

export function heroPickRate(i: number) {
  const data = load();
  const k = heroIndex(data, getHeroes())[i];
  return k === undefined || k < 0 ? 0 : data.pickRate[k];
}

function row(i: number, matrix: "vs" | "with", minGames: number): MatchupRow[] {
  const data = load();
  const heroes = getHeroes();
  const idx = heroIndex(data, heroes);
  const a = idx[i];
  if (a === undefined || a < 0) return [];
  const values = data[matrix];
  const games = matrix === "vs" ? data.vsGames : data.withGames;
  return heroes
    .map((h, j) => ({ slug: h.slug, value: values[a][idx[j]] ?? 0, games: games[a][idx[j]] ?? 0, j }))
    .filter((r) => r.j !== i && idx[r.j] >= 0 && r.games >= minGames)
    .map(({ slug, value, games: g }) => ({ slug, value, games: g }));
}

/** i баатрын бусад баатрын эсрэг давуу тал (%-ийн оноо). Эерэг = i ялдаг. */
export function vsRow(i: number, minGames = 100) {
  return row(i, "vs", minGames);
}

/** i баатрын бусад баатартай хамт тоглох үеийн нэмэгдэл (%-ийн оноо). */
export function withRow(i: number, minGames = 50) {
  return row(i, "with", minGames);
}

/** Драфтын туслахад өгөх, getHeroes()-ийн дарааллаар эрэмбэлсэн матрицууд. */
export function draftMatrices() {
  const data = load();
  const heroes = getHeroes();
  const idx = heroIndex(data, heroes);
  const pick = (m: number[][]) =>
    idx.map((a) => idx.map((b) => (a < 0 || b < 0 ? 0 : Math.round(m[a][b] * 10) / 10)));
  return {
    vs: pick(data.vs),
    with: pick(data.with),
    winrate: heroes.map((_, i) => heroWinrate(i)),
  };
}
