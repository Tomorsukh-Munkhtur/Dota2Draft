// Тоглоомын өгөгдлийн автомат шинэчлэлт (GitHub Actions ба локал сервер хоёулаа үүнийг ажиллуулна):
//   1. dota2.com-оос шинэ патч гарсан бол баатар, skill, item, патчийн тэмдэглэлийг татна;
//   2. ялах/ялагдах статистик 24 цагаас хуучирсан бол OpenDota-гаас шинэчилнэ.
// Ажиллуулах: npm run data:update   (--force: бүгдийг одоо шинэчилнэ)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const MATCHUPS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const force = process.argv.includes("--force");

function run(script, args = []) {
  execFileSync(process.execPath, [path.join("scripts", script), ...args], { stdio: "inherit" });
}

function matchupsAge() {
  try {
    const { generatedAt } = JSON.parse(readFileSync("data/matchups.json", "utf8"));
    return Date.now() - Date.parse(generatedAt);
  } catch {
    return Infinity;
  }
}

run("update-game-data.mjs", force ? [] : ["--if-new-patch"]);
if (force || matchupsAge() > MATCHUPS_MAX_AGE_MS) run("fetch-matchups.mjs");
else console.log("Статистик 24 цагаас шинэ — алгаслаа.");
