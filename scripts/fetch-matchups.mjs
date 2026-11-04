// OpenDota-гийн pub (ranked) тоглолтуудаас баатар хоорондын ялалт/хамтын статистикийг тооцоолно.
// Ажиллуулах: npm run data:matchups   (MATCHES=400000 гэж тоог өөрчилж болно)
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const EXPLORER = "https://api.opendota.com/api/explorer";
const TARGET = Number(process.env.MATCHES ?? 400_000);
const PAGE = 20_000;
// Цөөн тоглолттой хосын үр дүнг 0 руу татах жин (Bayesian shrinkage).
const PRIOR = 60;

const heroes = JSON.parse(await readFile(path.resolve("data/heroes.json"), "utf8"));
const ids = heroes.map((h) => h.id);
const indexOf = new Map(ids.map((id, i) => [id, i]));
const n = ids.length;

async function query(sql, attempt = 1) {
  const url = `${EXPLORER}?sql=${encodeURIComponent(sql)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.err) {
    if (attempt < 4) {
      console.warn(`  дахин оролдож байна (${attempt}): ${body.err ?? res.status}`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      return query(sql, attempt + 1);
    }
    throw new Error(`explorer: ${body.err ?? res.status}`);
  }
  return body.rows;
}

const games = new Float64Array(n);
const wins = new Float64Array(n);
const vsGames = new Float64Array(n * n);
const vsWins = new Float64Array(n * n); // i нь j-ийн эсрэг ялсан
const withGames = new Float64Array(n * n);
const withWins = new Float64Array(n * n);

let [{ max: cursor }] = await query("SELECT max(match_id) FROM public_matches");
cursor = Number(cursor) + 1;
let total = 0;
let minTime = Infinity;
let maxTime = 0;

while (total < TARGET) {
  const rows = await query(
    `SELECT match_id, start_time, radiant_win, radiant_team, dire_team FROM public_matches
     WHERE match_id < ${cursor} AND lobby_type = 7 AND game_mode = 22
     ORDER BY match_id DESC LIMIT ${PAGE}`,
  );
  if (!rows.length) break;
  for (const m of rows) {
    const rad = (m.radiant_team ?? []).map((id) => indexOf.get(id));
    const dire = (m.dire_team ?? []).map((id) => indexOf.get(id));
    if (rad.length !== 5 || dire.length !== 5 || rad.includes(undefined) || dire.includes(undefined)) continue;
    total++;
    minTime = Math.min(minTime, m.start_time);
    maxTime = Math.max(maxTime, m.start_time);
    const teams = [
      [rad, m.radiant_win],
      [dire, !m.radiant_win],
    ];
    for (const [team, won] of teams) {
      const enemy = team === rad ? dire : rad;
      for (const a of team) {
        games[a]++;
        if (won) wins[a]++;
        for (const b of enemy) {
          vsGames[a * n + b]++;
          if (won) vsWins[a * n + b]++;
        }
        for (const b of team) {
          if (a === b) continue;
          withGames[a * n + b]++;
          if (won) withWins[a * n + b]++;
        }
      }
    }
  }
  cursor = Number(rows[rows.length - 1].match_id);
  console.log(`  ${total} тоглолт (${new Date(minTime * 1000).toISOString().slice(0, 10)} хүртэл)`);
  await new Promise((r) => setTimeout(r, 1500));
}

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const wr = Array.from(games, (g, i) => (g ? wins[i] / g : 0.5));

// Давуу тал: бодит ялалтын хувь − хоёр баатрын ерөнхий хүч чадлаас хүлээгдэх хувь.
const vs = [];
const vsN = [];
const withSyn = [];
const withN = [];
for (let a = 0; a < n; a++) {
  const vsRow = [], vsNRow = [], wRow = [], wNRow = [];
  for (let b = 0; b < n; b++) {
    const k = a * n + b;
    const expVs = wr[a] - wr[b] + 0.5;
    const sVs = (vsWins[k] + PRIOR * expVs) / (vsGames[k] + PRIOR);
    vsRow.push(a === b ? 0 : round((sVs - expVs) * 100));
    vsNRow.push(vsGames[k]);
    const expW = wr[a] + wr[b] - 0.5;
    const sW = (withWins[k] + PRIOR * expW) / (withGames[k] + PRIOR);
    wRow.push(a === b ? 0 : round((sW - expW) * 100));
    wNRow.push(withGames[k]);
  }
  vs.push(vsRow);
  vsN.push(vsNRow);
  withSyn.push(wRow);
  withN.push(wNRow);
}

const out = {
  generatedAt: new Date().toISOString(),
  source: "OpenDota public_matches (ranked all pick)",
  matchCount: total,
  from: new Date(minTime * 1000).toISOString(),
  to: new Date(maxTime * 1000).toISOString(),
  heroIds: ids,
  winrate: wr.map((x) => round(x * 100)),
  pickRate: Array.from(games, (g) => round((g / total) * 100)),
  vs,
  vsGames: vsN,
  with: withSyn,
  withGames: withN,
};
await writeFile(path.resolve("data/matchups.json"), JSON.stringify(out));
console.log(`Хадгаллаа: ${total} тоглолт → data/matchups.json`);
