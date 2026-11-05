// Админы нүүрний "Анхаарах зүйлс": шинэ патчаар өөрчлөгдсөн, монгол контентгүй, батлагдаагүй орчуулгатай зүйлс.
import { readHeroContentFile } from "./content";
import { readData } from "./data";
import { getHeroContentOverrides } from "./heroContentStore";
import { getHeroKit, getHeroes, getItems, getHero } from "./heroes";
import { getItemContentOverrides } from "./itemContentStore";
import { readItemContentFile } from "./items";
import { getPatches, getPatchTranslationOverrides, type Patch } from "./patch";
import { getReviewedKeys } from "./reviews";

export type AttentionRow = { key: string; label: string; href: string; img?: string; note?: string };
export type AttentionGroup = {
  id: string;
  title: string;
  hint: string;
  rows: AttentionRow[];
  /** Мөрийг "Шалгасан" гэж тэмдэглэж болох эсэх (эс бөгөөс зассаны дараа өөрөө алга болно). */
  reviewable: boolean;
};

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Баатрын skill, талантын орчуулах мөрүүд (scripts/lib/gtranslate.mjs-тэй ижил). */
function heroLines(slug: string): string[] {
  const kit = getHeroKit(slug);
  if (!kit) return [];
  return [
    ...kit.abilities.flatMap((a) => [
      ...lines(a.desc),
      ...a.values.map((v) => v.label),
      ...lines(a.scepter),
      ...lines(a.shard),
      ...a.notes.flatMap(lines),
    ]),
    ...kit.talents.flatMap((t) => t.options),
  ].filter(Boolean);
}

/** Патчийн тэмдэглэлийн орчуулах мөрүүд (scripts/lib/gtranslate.mjs-тэй ижил). */
function patchLines(p: Patch): string[] {
  return [
    ...p.general.flatMap((g) => g.lines.map((l) => l.t)),
    ...p.heroes.flatMap((h) => h.lines.map((l) => l.t)),
    ...[...p.items, ...p.neutralItems].flatMap((it) => [...it.lines.map((l) => l.t), ...(!it.key && it.title ? [it.title] : [])]),
    ...p.neutralCreeps.flatMap((c) => c.lines.map((l) => l.t)),
  ].filter(Boolean);
}

const safe = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(0, 80);

export async function getAttention() {
  const [trOverrides, heroOverrides, itemOverrides, reviewedList] = await Promise.all([
    getPatchTranslationOverrides(),
    getHeroContentOverrides(),
    getItemContentOverrides(),
    getReviewedKeys(),
  ]);
  const reviewed = new Set(reviewedList);
  const items = getItems();
  const heroes = getHeroes();
  const { patches } = getPatches();
  const latest = patches[0];
  const groups: AttentionGroup[] = [];

  // 1. Сүүлийн патчаар өөрчлөгдсөн баатар, item.
  if (latest) {
    const v = latest.patch;
    const rows: AttentionRow[] = [
      { key: `patch:${v}:notes`, label: `Патч ${v}-ийн тэмдэглэл`, href: `/admin/patch?v=${v}`, note: "орчуулга" },
      ...latest.heroes.flatMap((h) => {
        const hero = getHero(h.slug);
        return hero
          ? [{ key: `patch:${v}:hero:${h.slug}`, label: hero.name, href: `/admin/heroes/${h.slug}#skills`, img: hero.img, note: `${h.lines.length} өөрчлөлт` }]
          : [];
      }),
      ...[...latest.items, ...latest.neutralItems].flatMap((e) => {
        const it = e.key ? items[e.key] : undefined;
        return it
          ? [{ key: `patch:${v}:item:${it.key}`, label: it.name, href: `/admin/items/${it.key}`, img: it.img, note: `${e.lines.length} өөрчлөлт` }]
          : [];
      }),
    ];
    groups.push({
      id: "patch",
      title: `Патч ${v}-ийн өөрчлөлт`,
      hint: "Valve-ийн тэмдэглэлд орсон баатар, item. Тайлбар, орчуулгаа шалгаад \"Шалгасан\" дарна уу.",
      rows,
      reviewable: true,
    });
  }

  // 2. Батлагдаагүй skill орчуулга (шинээр гарсан мөр — сайтад англиар харагдаж байгаа).
  const baselineSkills = readData<Record<string, string>>("abilities-mn.json", {});
  const pendingHeroes: AttentionRow[] = [];
  for (const h of heroes) {
    const n = new Set(heroLines(h.slug).filter((en) => !(en in trOverrides) && !(en in baselineSkills))).size;
    if (n) pendingHeroes.push({ key: `pending:hero:${h.slug}`, label: h.name, href: `/admin/heroes/${h.slug}#skills`, img: h.img, note: `${n} мөр` });
  }
  groups.push({
    id: "pending-skills",
    title: "Батлагдаагүй skill-ийн орчуулга",
    hint: "Шинэ/өөрчлөгдсөн мөрүүд админ батлах хүртэл сайтад англиар харагдана. Засварлах хуудсанд \"Батлах\" дарна уу.",
    rows: pendingHeroes,
    reviewable: false,
  });

  // 3. Батлагдаагүй патчийн мөр.
  const baselinePatch = readData<Record<string, string>>("patch-notes-mn.json", {});
  const pendingPatches: AttentionRow[] = [];
  for (const p of patches) {
    const n = new Set(patchLines(p).filter((en) => !(en in trOverrides) && !(en in baselinePatch))).size;
    if (n) pendingPatches.push({ key: `pending:patch:${p.patch}`, label: `Патч ${p.patch}`, href: `/admin/patch?v=${p.patch}`, note: `${n} мөр` });
  }
  groups.push({
    id: "pending-patch",
    title: "Батлагдаагүй патчийн тэмдэглэл",
    hint: "Шинэ мөрүүд админ батлах хүртэл /patch хуудсанд англиар харагдана.",
    rows: pendingPatches,
    reviewable: false,
  });

  // 4. Монгол контентгүй item, баатар.
  const missing: AttentionRow[] = [];
  const itemFiles = new Map<string, Awaited<ReturnType<typeof readItemContentFile>>>();
  for (const it of Object.values(items)) {
    if (it.kind === "legacy") continue;
    const file = await readItemContentFile(it.key);
    itemFiles.set(it.key, file);
    if (!file && !itemOverrides[it.key])
      missing.push({ key: `missing:item:${it.key}`, label: it.name, href: `/admin/items/${it.key}`, img: it.img, note: "item" });
  }
  for (const h of heroes) {
    const file = await readHeroContentFile(h.slug);
    if (!file.translated && !heroOverrides[h.slug])
      missing.push({ key: `missing:hero:${h.slug}`, label: h.name, href: `/admin/heroes/${h.slug}`, img: h.img, note: "баатар" });
  }
  groups.push({
    id: "missing",
    title: "Монгол контентгүй",
    hint: "Шинэ item, баатрын тойм, заавар, түүх бичигдээгүй (сайтад англиар/хоосон).",
    rows: missing,
    reviewable: true,
  });

  // 5. Монгол тайлбаргүй item-ийн чадвар (контенттой item-д л — контентгүй нь дээрх жагсаалтад бий).
  const abilityRows: AttentionRow[] = [];
  for (const it of Object.values(items)) {
    if (it.kind === "legacy" || !it.abilities.length) continue;
    const file = itemFiles.get(it.key);
    const o = itemOverrides[it.key];
    if (!file && !o) continue;
    const texts = o?.abilities ?? file?.abilities ?? [];
    for (const a of it.abilities)
      if (!texts.some((x) => x.title === a.title && x.description.trim()))
        abilityRows.push({ key: `ability:${it.key}:${safe(a.title)}`, label: `${it.name} — ${a.title}`, href: `/admin/items/${it.key}`, img: it.img });
  }
  groups.push({
    id: "abilities",
    title: "Монгол тайлбаргүй item-ийн чадвар",
    hint: "Valve шинэ чадвар нэмсэн эсвэл нэрийг нь сольсон тул монгол тайлбаргүй болсон.",
    rows: abilityRows,
    reviewable: true,
  });

  // Шалгасан мөрүүдийг тусад нь.
  const reviewedRows: AttentionRow[] = [];
  for (const g of groups) {
    if (!g.reviewable) continue;
    reviewedRows.push(...g.rows.filter((r) => reviewed.has(r.key)));
    g.rows = g.rows.filter((r) => !reviewed.has(r.key));
  }
  return { groups: groups.filter((g) => g.rows.length), reviewed: reviewedRows };
}
