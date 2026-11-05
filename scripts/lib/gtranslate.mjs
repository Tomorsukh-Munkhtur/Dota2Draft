// Патчийн тэмдэглэлийг Google Translate-ийн үнэгүй (албан бус) хаягаар монгол руу орчуулж
// data/patch-notes-mn.json-д { англи: монгол } хэлбэрээр хадгална. Нэг удаа орчуулсныг дахин орчуулахгүй.
// Баатар, чадвар, item-ийн нэрийг ⟦n⟧ орлуулагчаар хамгаалж, орчуулсны дараа буцааж тавина.
// Админ засварласан орчуулга Supabase-д хадгалагдаж, энэ машин орчуулгаас давуу эрхтэй.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mn&dt=t&q=";
const MAX_LINES = 40;
const MAX_CHARS = 3500;
// Тогтсон нэр томьёо: null бол англиар нь үлдээнэ (Монгол тоглогчид ингэж хэрэглэдэг),
// эс бөгөөс сайтын бусад хэсэгтэй ижил монгол үгээр солино ("Intelligence"-ийг "тагнуул" гэж орчуулахаас сэргийлнэ).
const GLOSSARY = {
  "Aghanim's Scepter": null,
  "Aghanim's Shard": null,
  Roshan: null,
  Tormentor: null,
  Madstone: null,
  Cooldown: null,
  cooldown: null,
  Talent: null,
  Facet: null,
  Innate: null,
  "Twin Gates": null,
  "Twin Gate": null,
  "Lotus Pool": null,
  "Wisdom Rune": null,
  "Bounty Rune": null,
  "Power Rune": null,
  Outpost: null,
  Watcher: null,
  "Observer Ward": null,
  "Sentry Ward": null,
  Courier: null,
  Glyph: null,
  Strength: "Хүч",
  Agility: "Авхаалж",
  Intelligence: "Ухаан",
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
  const re = new RegExp(`(?<![A-Za-z])(${list.map(escape).join("|")})(?![A-Za-z])`, "g");
  return {
    protect(text) {
      const saved = [];
      const out = text.replace(re, (m) => `⟦${saved.push(replace[m] ?? m) - 1}⟧`);
      return { out, saved };
    },
    restore(text, saved) {
      return text.replace(/⟦\s*(\d+)\s*⟧/g, (m, i) => saved[+i] ?? m);
    },
  };
}

async function googleTranslate(text, attempt = 1) {
  try {
    const res = await fetch(ENDPOINT + encodeURIComponent(text), {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json[0].map((s) => s[0]).join("");
  } catch (e) {
    if (attempt >= 3) throw e;
    await new Promise((r) => setTimeout(r, 3000 * attempt));
    return googleTranslate(text, attempt + 1);
  }
}

/** data/patches.json-ийн орчуулаагүй мөрүүдийг орчуулна. Алдаа гарвал үлдсэнийг дараагийн удаад үлдээнэ. */
export async function translatePatchNotes(dataDir) {
  const patches = await readJson(path.join(dataDir, "patches.json"), null);
  if (!patches) return;
  const cacheFile = path.join(dataDir, "patch-notes-mn.json");
  const cache = await readJson(cacheFile, {});

  const strings = new Set();
  for (const p of patches.patches) {
    // Ерөнхий хэсгийн гарчиг ("Twin Gates", "Tormentor") нь газрын нэр тул англиар нь үлдээнэ.
    for (const g of p.general) g.lines.forEach((l) => strings.add(l.t));
    for (const h of p.heroes) h.lines.forEach((l) => strings.add(l.t));
    for (const it of [...p.items, ...p.neutralItems]) it.lines.forEach((l) => strings.add(l.t));
    for (const c of p.neutralCreeps) c.lines.forEach((l) => strings.add(l.t));
    // Item-гүй ерөнхий хэсгийн гарчиг ("Shop Reshuffle" гэх мэт).
    for (const it of [...p.items, ...p.neutralItems]) if (!it.key && it.title) strings.add(it.title);
  }
  // Одоогийн патчуудад байхгүй болсон (хуучин том патчийн) мөрүүдийг хасна.
  let pruned = 0;
  for (const key of Object.keys(cache))
    if (!strings.has(key)) {
      delete cache[key];
      pruned++;
    }
  const missing = [...strings].filter((s) => s && !(s in cache));
  const save = () =>
    writeFile(
      cacheFile,
      JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b))), null, 1),
    );
  if (!missing.length) {
    if (pruned) await save();
    return console.log("Патчийн орчуулга: шинэ мөр алга.");
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

  console.log(`Патчийн орчуулга: ${missing.length} шинэ мөр…`);
  let done = 0;
  try {
    for (let i = 0; i < missing.length;) {
      // Мөрүүдийг "\n"-ээр нийлүүлж нэг хүсэлтээр орчуулна.
      const batch = [];
      let chars = 0;
      while (i < missing.length && batch.length < MAX_LINES && chars + missing[i].length < MAX_CHARS) {
        chars += missing[i].length + 1;
        batch.push(missing[i++]);
      }
      if (!batch.length) batch.push(missing[i++]); // нэг мөр хэт урт бол дангаар нь
      const prepared = batch.map((s) => protect(s.replace(/\s*\n\s*/g, " ")));
      const translated = (await googleTranslate(prepared.map((p) => p.out).join("\n"))).split("\n");
      if (translated.length === batch.length) {
        batch.forEach((s, k) => (cache[s] = restore(translated[k].trim(), prepared[k].saved)));
      } else {
        // Мөрийн тоо зөрвөл нэг нэгээр нь.
        for (let k = 0; k < batch.length; k++)
          cache[batch[k]] = restore((await googleTranslate(prepared[k].out)).trim(), prepared[k].saved);
      }
      done += batch.length;
      await new Promise((r) => setTimeout(r, 700));
    }
  } catch (e) {
    console.warn(`  орчуулга тасарлаа (${done}/${missing.length}): ${e.message} — үлдсэнийг дараа орчуулна.`);
  }
  await save();
  console.log(`Патчийн орчуулга: ${done} мөр орчууллаа.`);
}
