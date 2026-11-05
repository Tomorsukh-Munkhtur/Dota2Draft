// Патчийн тэмдэглэл, баатрын skill-ийн текстийг Google Translate-ийн үнэгүй (албан бус) хаягаар монгол руу
// орчуулж { англи: монгол } хэлбэрээр хадгална. Баатар, чадвар, item-ийн нэрийг ⟦n⟧ орлуулагчаар хамгаалж,
// орчуулсны дараа буцааж тавина.
//
// Хоёр төрлийн файл:
//   data/*-mn.json         — сайтад харагддаг (анх бөөнөөр нь орчуулж зөвшөөрсөн) машин орчуулга.
//   data/*-mn-suggest.json — түүнээс хойш шинээр гарсан мөрийн машин орчуулга: зөвхөн админд санал болгоно,
//                            админ батлах хүртэл сайтад англиар харагдана.
// Админы засвар/батламж Supabase-ийн patch_translations-д хадгалагдаж, хоёуланаас нь давуу эрхтэй.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mn&dt=t&q=";
const MAX_LINES = 40;
const MAX_CHARS = 3500;

const KEEP = [
  // Нэр, газар.
  "Aghanim's Scepter",
  "Aghanim's Shard",
  "Roshan",
  "Tormentor",
  "Madstone",
  "Talent",
  "Facet",
  "Innate",
  "Twin Gates",
  "Twin Gate",
  "Lotus Pool",
  "Wisdom Rune",
  "Bounty Rune",
  "Power Rune",
  "Outpost",
  "Watcher",
  "Observer Ward",
  "Sentry Ward",
  "Courier",
  "Glyph",
  "Strength",
  "Agility",
  "Intelligence",
  "Universal",
  // Монгол тоглогчид англиар нь хэрэглэдэг механикууд.
  "Cooldown",
  "cooldown",
  "cooldowns",
  "Stun",
  "stun",
  "stuns",
  "stunned",
  "Silence",
  "silence",
  "silences",
  "silenced",
  "Root",
  "root",
  "roots",
  "rooted",
  "Hex",
  "hex",
  "hexed",
  "Break",
  "Dispel",
  "dispel",
  "dispels",
  "dispelled",
  "Basic Dispel",
  "Strong Dispel",
  "Lifesteal",
  "lifesteal",
  "Spell Lifesteal",
  "spell lifesteal",
  "Evasion",
  "evasion",
  "Bash",
  "bash",
  "bashes",
  "Debuff",
  "debuff",
  "debuffs",
  "Buff",
  "buff",
  "buffs",
  "Creep",
  "creep",
  "creeps",
  "Creeps",
];

// Тогтсон нэр томьёо: null бол англиар нь үлдээнэ ("Intelligence"-ийг "тагнуул", "Health"-ийг "эрүүл мэнд"
// гэж орчуулахаас сэргийлнэ), эс бөгөөс заасан үгээр солино.
const GLOSSARY = {
  ...Object.fromEntries(KEEP.map((t) => [t, null])),
  Health: "HP",
  health: "HP",
  "Max Health": "Max HP",
  "max health": "max HP",
};
/** Энэ үгсийг агуулсан мөрийг GLOSSARY өөрчлөгдсөний дараа дахин орчуулахад ашиглана. */
export const GLOSSARY_TERMS = Object.keys(GLOSSARY);

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function protector(terms, replace = {}) {
  const list = [...new Set(terms.filter((t) => t && t.length > 2))].sort((a, b) => b.length - a.length);
  const body = `(?<![A-Za-z])(${list.map(escape).join("|")})(?![A-Za-z])`;
  const re = new RegExp(body, "g");
  const reCi = new RegExp(body, "gi");
  // Том үсгээр бичигдсэн үзүүлэлтийн нэрд ("MANA VOID DAMAGE") жинхэнэ бичлэгийг нь сэргээх.
  const canonical = new Map(list.map((t) => [t.toLowerCase(), t]));
  return {
    protect(text, { label = false } = {}) {
      const saved = [];
      if (!label) return { out: text.replace(re, (m) => `⟦${saved.push(replace[m] ?? m) - 1}⟧`), saved };
      const out = text
        .replace(reCi, (m) => {
          const t = canonical.get(m.toLowerCase()) ?? m;
          return `⟦${saved.push(replace[t] ?? t) - 1}⟧`;
        })
        .toLowerCase()
        .replace(/^[a-z]/, (c) => c.toUpperCase());
      return { out, saved };
    },
    restore(text, saved) {
      return text.replace(/⟦\s*(\d+)\s*⟧/g, (m, i) => saved[+i] ?? m);
    },
  };
}

async function googleTranslate(text, attempt = 1) {
  try {
    const res = await fetch(ENDPOINT + encodeURIComponent(text), { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json[0].map((s) => s[0]).join("");
  } catch (e) {
    if (attempt >= 3) throw e;
    await new Promise((r) => setTimeout(r, 3000 * attempt));
    return googleTranslate(text, attempt + 1);
  }
}

/** Олон мөртэй текстийг мөр мөрөөр нь (хоосон мөргүй) задлана — сайт ч мөр мөрөөр нь орчуулна. */
export const splitLines = (text) =>
  (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const writeSorted = (file, obj) =>
  writeFile(file, JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))), null, 1));

/** Одоогийн өгөгдөлд байхгүй болсон (хуучин патчийн) мөрүүдийг хасна. Хассан тоог буцаана. */
function prune(dict, strings) {
  let n = 0;
  for (const key of Object.keys(dict))
    if (!strings.has(key)) {
      delete dict[key];
      n++;
    }
  return n;
}

/**
 * `strings` (текст → { label }) дотроос зөвшөөрсөн (`approvedFile`) болон санал (`suggestFile`) файлд аль алинд нь
 * байхгүйг орчуулж санал файлд хадгална. Алдаа гарвал үлдсэнийг дараагийн удаад үлдээнэ.
 */
async function translateInto(dataDir, approvedFile, suggestFile, strings, title) {
  const approvedPath = path.join(dataDir, approvedFile);
  const cacheFile = path.join(dataDir, suggestFile);
  const approved = await readJson(approvedPath, {});
  const cache = await readJson(cacheFile, {});
  if (prune(approved, strings)) await writeSorted(approvedPath, approved);
  const pruned = prune(cache, strings);
  const missing = [...strings.keys()].filter((s) => s && !(s in approved) && !(s in cache));
  const save = () => writeSorted(cacheFile, cache);
  if (!missing.length) {
    await save(); // файл байхгүй бол үүсгэнэ, хассан мөр байвал хадгална
    return console.log(`${title}: шинэ мөр алга${pruned ? ` (${pruned} хуучин санал хасав)` : ""}.`);
  }

  const heroes = await readJson(path.join(dataDir, "heroes.json"), []);
  const kits = await readJson(path.join(dataDir, "hero-abilities.json"), {});
  const items = await readJson(path.join(dataDir, "items.json"), {});
  const { protect, restore } = protector(
    [
      ...GLOSSARY_TERMS,
      ...heroes.map((h) => h.name),
      ...Object.values(kits).flatMap((k) => k.abilities.map((a) => a.name)),
      // Item-ийн чадварын нэрс ("Restore" гэх мэт) энгийн үг байдаг тул зөвхөн item-ийн нэрийг хамгаална.
      ...Object.values(items).map((i) => i.name),
    ],
    Object.fromEntries(Object.entries(GLOSSARY).filter(([, v]) => v)),
  );

  console.log(`${title}: ${missing.length} шинэ мөр…`);
  let done = 0;
  try {
    for (let i = 0; i < missing.length; ) {
      // Мөрүүдийг "\n"-ээр нийлүүлж нэг хүсэлтээр орчуулна.
      const batch = [];
      let chars = 0;
      while (i < missing.length && batch.length < MAX_LINES && chars + missing[i].length < MAX_CHARS) {
        chars += missing[i].length + 1;
        batch.push(missing[i++]);
      }
      if (!batch.length) batch.push(missing[i++]); // нэг мөр хэт урт бол дангаар нь
      const prepared = batch.map((s) => protect(s.replace(/\s*\n\s*/g, " "), strings.get(s)));
      const translated = (await googleTranslate(prepared.map((p) => p.out).join("\n"))).split("\n");
      if (translated.length === batch.length) {
        batch.forEach((s, k) => (cache[s] = restore(translated[k].trim(), prepared[k].saved)));
      } else {
        // Мөрийн тоо зөрвөл нэг нэгээр нь.
        for (let k = 0; k < batch.length; k++)
          cache[batch[k]] = restore((await googleTranslate(prepared[k].out)).trim(), prepared[k].saved);
      }
      done += batch.length;
      if (done % 400 < batch.length) await save(); // урт ажиллагааны дунд хадгална
      await new Promise((r) => setTimeout(r, 700));
    }
  } catch (e) {
    console.warn(`  орчуулга тасарлаа (${done}/${missing.length}): ${e.message} — үлдсэнийг дараа орчуулна.`);
  }
  await save();
  console.log(`${title}: ${done} шинэ мөрийг орчуулж админд санал болгов (батлах хүртэл сайтад англиар).`);
}

const TEXT = {};
const LABEL = { label: true };

/** data/patches.json-ийн шинэ мөрүүдийг орчуулна → data/patch-notes-mn-suggest.json. */
export async function translatePatchNotes(dataDir) {
  const patches = await readJson(path.join(dataDir, "patches.json"), null);
  if (!patches) return;
  const strings = new Map();
  for (const p of patches.patches) {
    // Ерөнхий хэсгийн гарчиг ("Twin Gates", "Tormentor") нь газрын нэр тул англиар нь үлдээнэ.
    for (const g of p.general) g.lines.forEach((l) => strings.set(l.t, TEXT));
    for (const h of p.heroes) h.lines.forEach((l) => strings.set(l.t, TEXT));
    for (const it of [...p.items, ...p.neutralItems]) it.lines.forEach((l) => strings.set(l.t, TEXT));
    for (const c of p.neutralCreeps) c.lines.forEach((l) => strings.set(l.t, TEXT));
    // Item-гүй ерөнхий хэсгийн гарчиг ("Shop Reshuffle" гэх мэт).
    for (const it of [...p.items, ...p.neutralItems]) if (!it.key && it.title) strings.set(it.title, TEXT);
  }
  await translateInto(dataDir, "patch-notes-mn.json", "patch-notes-mn-suggest.json", strings, "Патчийн орчуулга");
}

/** data/hero-abilities.json-ийн skill тайлбар, тэмдэглэл, Scepter/Shard, үзүүлэлт, талантын шинэ мөрийг орчуулна → data/abilities-mn-suggest.json. */
export async function translateHeroAbilities(dataDir) {
  const kits = await readJson(path.join(dataDir, "hero-abilities.json"), null);
  if (!kits) return;
  const strings = new Map();
  for (const kit of Object.values(kits)) {
    for (const a of kit.abilities) {
      for (const text of [a.desc, a.scepter, a.shard, ...(a.notes ?? [])])
        splitLines(text).forEach((l) => strings.set(l, TEXT));
      for (const v of a.values ?? []) if (v.label) strings.set(v.label, LABEL);
    }
    for (const t of kit.talents) t.options.forEach((o) => o && strings.set(o, TEXT));
  }
  await translateInto(dataDir, "abilities-mn.json", "abilities-mn-suggest.json", strings, "Skill-ийн орчуулга");
}
