// Тоглоомын өгөгдлийг Dota 2-ын албан ёсны datafeed (dota2.com)-ээс шинэчилнэ:
// патч, баатар (үзүүлэлт, skill, talent, түүх), одоогийн дэлгүүрийн/neutral item, enchantment, патчийн өөрчлөлтүүд.
// Ажиллуулах: npm run data:game   (--if-new-patch: патч өөрчлөгдөөгүй бол юу ч хийхгүй)
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { translateHeroAbilities, translatePatchNotes } from "./lib/gtranslate.mjs";
import { CDN, feed, fillTemplate, formatValues, htmlToText, pool } from "./lib/valve.mjs";

const DATA = path.resolve("data");
const EXPLORER = "https://api.opendota.com/api/explorer";
const SHOPS = "https://raw.githubusercontent.com/dotabuff/d2vpkr/master/dota/scripts/shops.txt";
const DAYS = Number(process.env.DAYS ?? 45);
const MIN_USES = 5;

const ATTR = ["str", "agi", "int", "all"];
// dota2.com-ийн role_levels-ийн дараалал.
const ROLES = ["Carry", "Support", "Nuker", "Disabler", "Jungler", "Durable", "Escape", "Pusher", "Initiator"];
const SHOP_SECTIONS = ["consumables", "attributes", "weapons_armor", "misc", "secretshop", "basics", "support", "defense", "weapons", "artifacts"];
const EXCLUDE = new Set(["ward_dispenser", "great_famango", "greater_famango", "dagon_2", "dagon_3", "dagon_4", "dagon_5", "divine_regalia_broken"]);

// Item-ийн үзүүлэлтийн "$str" гэх мэт тэмдэгтүүд → англи нэр (src/lib/itemStats.ts монгол руу хөрвүүлнэ).
const STAT_TOKENS = {
  str: "Strength", agi: "Agility", int: "Intelligence", all: "All Attributes",
  selected_attrib: "Selected Attribute", primary_attribute: "Primary Attribute",
  damage: "Damage", armor: "Armor", hp: "Health", health: "Health", mana: "Mana",
  hp_regen: "Health Regeneration", mana_regen: "Mana Regeneration", attack: "Attack Speed",
  move_speed: "Movement Speed", evasion: "Evasion", spell_resist: "Magic Resistance",
  lifesteal: "Lifesteal", spell_lifesteal: "Spell Lifesteal", spell_amp: "Spell Amplification",
  cast_range: "Cast Range", attack_range: "Attack Range (Ranged Only)", attack_range_melee: "Attack Range (Melee Only)",
  attack_range_all: "Attack Range (Melee & Ranged)", attack_pct: "Base Attack Speed Percentage", aoe_bonus: "Area of Effect",
  max_mana_percentage: "Max Mana", restoration_amp: "Health Restoration", slow_resistance: "Slow Resistance",
  cooldown_reduction: "Cooldown Reduction", status_resist: "Status Resistance", slow_resist: "Slow Resistance",
  mana_regen_amp: "Mana Regen Amplification", hp_regen_amp: "Health Restoration", heal_amp: "Health Restoration",
  projectile_speed: "Projectile Speed", vision_night: "Night Vision", night_vision: "Night Vision",
  base_attack_damage: "Base Attack Damage", max_mana: "Max Mana", max_hp_regen: "Max Health Regen",
  manacost_reduction: "Mana Cost/Mana Loss Reduction", aoe: "Area of Effect", debuff_amp: "Debuff Duration",
  knockback_resist: "Knockback Resistance", magic_damage: "Magic Attack Damage", incoming_damage: "Incoming Damage",
};
const unknownTokens = new Set();

/** Үзүүлэлтийг "+ {value}% Spell Amplification" хэлбэрт оруулна ("$spell_amp" ба "+Spell Amplification" аль аль нь). */
function statDisplay(heading, isPct) {
  const pct = isPct ? "%" : "";
  const token = heading.match(/^\s*([+-]?)\s*\$([a-z_]+)\s*$/i);
  if (token) {
    const label = STAT_TOKENS[token[2]];
    if (!label) unknownTokens.add(token[2]);
    return `${token[1] || "+"} {value}${pct} ${label ?? token[2].replace(/_/g, " ")}`;
  }
  const signed = heading.match(/^\s*([+-])\s*(.+?)\s*$/);
  if (signed) return `${signed[1]} {value}${pct} ${signed[2]}`;
  // "COOLDOWN:" гэх мэт тайлбар гарчиг.
  return `${heading.trim()} {value}${pct}`;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(DATA, file), "utf8"));
  } catch {
    return fallback;
  }
}
const write = (file, value, indent = 1) => writeFile(path.join(DATA, file), JSON.stringify(value, null, indent));

async function explorer(sql, attempt = 1) {
  const res = await fetch(`${EXPLORER}?sql=${encodeURIComponent(sql)}`, { signal: AbortSignal.timeout(200_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.err) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      return explorer(sql, attempt + 1);
    }
    throw new Error(`explorer: ${body.err ?? res.status}`);
  }
  return body.rows;
}

function parseShops(text) {
  const map = {};
  let section = null;
  for (const line of text.split(/\r?\n/)) {
    const header = line.match(/^\t"(\w+)"\s*$/);
    if (header) {
      section = SHOP_SECTIONS.includes(header[1]) ? header[1] : null;
      continue;
    }
    const item = line.match(/"item"\s+"item_(\w+)"/);
    if (item && section && !map[item[1]]) map[item[1]] = section;
  }
  return map;
}

// ---------------------------------------------------------------- патч
const { patches } = await feed("patchnoteslist");
const latest = patches.at(-1);
const meta = await readJson("meta.json", {});
if (process.argv.includes("--if-new-patch") && meta.patch === latest.patch_number) {
  // process.exit()-ийг fetch-ийн холболт нээлттэй үед дуудвал Windows дээр Node унадаг тул энгийнээр дуусгана.
  console.log(`Патч өөрчлөгдөөгүй (${latest.patch_number}) — шинэчлэх шаардлагагүй.`);
} else {
  await updateAll();
}
// Өмнө нь тасарсан ч гэсэн орчуулаагүй мөр үлдсэн бол орчуулна.
await translatePatchNotes(DATA);
await translateHeroAbilities(DATA);

async function updateAll() {
  console.log(`Одоогийн патч: ${latest.patch_number}`);

  // ---------------------------------------------------------------- баатрууд
  const heroList = (await feed("herolist")).result.data.heroes;
  const heroData = await pool(heroList, 6, async (h) => (await feed("herodata", { hero_id: h.id })).result.data.heroes[0]);

  const heroes = [];
  const heroAbilities = {};
  const loreEn = {};
  const abilityNames = new Map(); // ability id → нэр (патчийн тэмдэглэлд)

  function ability(a) {
    const specials = a.special_values ?? [];
    const pierce = { 3: true, 4: false, 5: false }[a.immunity] ?? null;
    // Scepter/Shard-ийн тайлбар өөрийн утгуудыг (values_scepter/values_shard) ашиглана.
    const variant = (field) => specials.map((s) => (s[field]?.length ? { ...s, values_float: s[field] } : s));
    return {
      id: a.id,
      key: a.name,
      name: a.name_loc,
      img: `${CDN}/apps/dota2/images/dota_react/abilities/${a.name}.png`,
      desc: htmlToText(fillTemplate(a.desc_loc, specials)),
      notes: (a.notes_loc ?? []).map((n) => htmlToText(fillTemplate(n, specials))).filter(Boolean),
      lore: htmlToText(a.lore_loc),
      scepter: htmlToText(fillTemplate(a.scepter_loc, variant("values_scepter"))),
      shard: htmlToText(fillTemplate(a.shard_loc, variant("values_shard"))),
      ultimate: a.type === 1,
      innate: Boolean(a.ability_is_innate),
      fromScepter: Boolean(a.ability_is_granted_by_scepter),
      fromShard: Boolean(a.ability_is_granted_by_shard),
      passive: (BigInt(a.behavior || 0) & 2n) === 2n,
      damageType: { 1: "physical", 2: "magical", 4: "pure" }[a.damage] ?? null,
      piercesImmunity: pierce,
      dispellable: { 1: "strong", 2: "yes", 3: "no" }[a.dispellable] ?? null,
      cooldown: a.cooldowns?.some((v) => v > 0) ? formatValues(a.cooldowns) : null,
      manaCost: a.mana_costs?.some((v) => v > 0) ? formatValues(a.mana_costs) : null,
      values: specials
        .filter((s) => s.heading_loc && s.values_float?.some((v) => v !== 0))
        .map((s) => ({
          label: s.heading_loc.replace(/:\s*$/, ""),
          value: formatValues(s.values_float) + (s.is_percentage ? "%" : ""),
        })),
    };
  }

  for (const h of heroData) {
    const slug = h.name.replace("npc_dota_hero_", "");
    heroes.push({
      id: h.id,
      slug,
      name: h.name_loc,
      attr: ATTR[h.primary_attr] ?? "all",
      attackType: h.attack_capability === 2 ? "Ranged" : "Melee",
      roles: ROLES.filter((_, i) => (h.role_levels?.[i] ?? 0) > 0),
      complexity: h.complexity,
      img: `${CDN}/apps/dota2/images/dota_react/heroes/${slug}.png`,
      icon: `${CDN}/apps/dota2/images/dota_react/heroes/icons/${slug}.png`,
      cmEnabled: true,
      stats: {
        str: h.str_base, agi: h.agi_base, int: h.int_base,
        strGain: Math.round(h.str_gain * 10) / 10, agiGain: Math.round(h.agi_gain * 10) / 10, intGain: Math.round(h.int_gain * 10) / 10,
        health: h.max_health, mana: h.max_mana, armor: Math.round(h.armor * 10) / 10,
        attackMin: h.damage_min, attackMax: h.damage_max, attackRange: h.attack_range,
        moveSpeed: h.movement_speed, attackRate: Math.round(h.attack_rate * 100) / 100,
      },
    });
    loreEn[slug] = htmlToText(h.bio_loc);
    const abilities = (h.abilities ?? []).map(ability);
    for (const a of abilities) abilityNames.set(a.id, a.name);
    // Талантын "{s:bonus_X}" утга нь skill-ийн X үзүүлэлтийн bonuses дотор тухайн талантын нэрээр хадгалагддаг.
    const talentText = (t) => {
      const bonuses = (h.abilities ?? []).flatMap((a) =>
        (a.special_values ?? []).flatMap((s) =>
          (s.bonuses ?? [])
            .filter((b) => b.name === t.name)
            .map((b) => ({ name: `bonus_${s.name}`, values_float: [Math.abs(b.value)] })),
        ),
      );
      return htmlToText(fillTemplate(t.name_loc, [...(t.special_values ?? []), ...bonuses]));
    };
    // Талантуудыг 10/15/20/25 түвшнээр хос болгоно.
    const talents = (h.talents ?? []).map(talentText);
    heroAbilities[slug] = {
      abilities,
      talents: [10, 15, 20, 25].map((level, i) => ({ level, options: talents.slice(i * 2, i * 2 + 2) })),
    };
  }
  heroes.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Баатар: ${heroes.length}`);

  // ---------------------------------------------------------------- item-ууд
  const since = `extract(epoch from now() - interval '${DAYS} days')`;
  const [itemList, shops, purchases, neutralRows, latestNotes] = await Promise.all([
    feed("itemlist").then((j) => j.result.data.itemabilities),
    fetch(SHOPS).then((r) => r.text()).then(parseShops),
    explorer(`SELECT k AS item, count(*) AS n FROM player_matches pm JOIN matches m ON m.match_id = pm.match_id,
      json_object_keys(pm.purchase) k WHERE m.start_time > ${since} GROUP BY 1`),
    explorer(`SELECT e->>'item_neutral' AS item, e->>'item_neutral_enhancement' AS enh, count(*) AS n
      FROM player_matches pm JOIN matches m ON m.match_id = pm.match_id, unnest(pm.neutral_item_history) e
      WHERE m.start_time > ${since} GROUP BY 1, 2`),
    feed("patchnotes", { version: latest.patch_number }),
  ]);

  const byName = new Map(itemList.map((i) => [i.name.replace(/^item_/, ""), i]));
  const byId = new Map(itemList.map((i) => [i.id, i.name.replace(/^item_/, "")]));

  const wanted = new Map(); // key → kind
  for (const { item, n } of purchases) {
    const it = byName.get(item);
    if (!it || +n < MIN_USES || EXCLUDE.has(item) || item.startsWith("recipe_") || item.startsWith("enhancement_") || it.neutral_item_tier >= 0)
      continue;
    wanted.set(item, "shop");
  }
  const neutralUses = {};
  for (const { item, enh, n } of neutralRows) {
    if (item) neutralUses[item] = (neutralUses[item] ?? 0) + +n;
    if (enh) neutralUses[enh] = (neutralUses[enh] ?? 0) + +n;
  }
  for (const [key, n] of Object.entries(neutralUses)) {
    if (n < MIN_USES || EXCLUDE.has(key) || !byName.has(key)) continue;
    wanted.set(key, key.startsWith("enhancement_") ? "enchantment" : "neutral");
  }
  // Сүүлийн патчид дурдагдсан item-ууд: шинэ item-ийг про тоглогчид хараахан аваагүй ч шууд оруулна
  // (монгол контентгүй тул админ орчуулах хүртэл англиар харагдаж, админы "Анхаарах зүйлс"-д гарна).
  for (const entry of [...(latestNotes.items ?? []), ...(latestNotes.neutral_items ?? [])]) {
    const key = entry.ability_id > 0 ? byId.get(entry.ability_id) : null;
    const it = key ? byName.get(key) : null;
    if (!it || wanted.has(key) || EXCLUDE.has(key) || key.startsWith("recipe_")) continue;
    wanted.set(key, key.startsWith("enhancement_") ? "enchantment" : it.neutral_item_tier >= 0 ? "neutral" : "shop");
    console.log(`  патчид дурдагдсан item нэмэв: ${key}`);
  }
  // Баатрын counter зөвлөгөөнд дурдагдсан item заавал байх ёстой (байхгүй бол анхааруулна).
  for (const file of await readdir(path.join(DATA, "hero-content")).catch(() => [])) {
    const content = JSON.parse(await readFile(path.join(DATA, "hero-content", file), "utf8"));
    for (const { item } of content.counterItems)
      if (!wanted.has(item)) console.warn(`  анхаар: ${file} дахь counter item "${item}" одоогийн тоглоомд алга`);
  }

  // Тогтмол дараалал: OpenDota-гийн хариуны дараалал өдөр бүр өөр байдаг тул items.json-ийн diff дэмий томордог.
  const keys = [...wanted.keys()].sort();
  const itemData = await pool(keys, 6, async (key) => (await feed("itemdata", { item_id: byName.get(key).id })).result.data.items[0]);

  function parseItemAbilities(desc, specials) {
    const text = fillTemplate(desc, specials);
    const parts = text.split(/<h1>/i).slice(1);
    return parts
      .map((part) => {
        const [head, ...rest] = part.split(/<\/h1>/i);
        const m = htmlToText(head).match(/^(Active|Passive|Toggle|Use|Upgrade|Aura)\s*:\s*(.+)$/i);
        return {
          type: m ? m[1].toLowerCase().replace("aura", "passive") : "passive",
          title: m ? m[2].trim() : htmlToText(head),
          description: htmlToText(rest.join("")),
        };
      })
      .filter((a) => a.title);
  }

  const items = {};
  keys.forEach((key, i) => {
    const d = itemData[i];
    const kind = wanted.get(key);
    const specials = d.special_values ?? [];
    const recipe = byName.get(`recipe_${key}`)?.recipes?.[0]?.items;
    items[key] = {
      id: d.id,
      key,
      name: d.name_loc,
      kind,
      cost: d.item_cost ?? 0,
      // Valve neutral биш item-д -1-ийг unsigned (4294967295) хэлбэрээр өгдөг.
      tier: d.item_neutral_tier >= 0 && d.item_neutral_tier < 10 ? d.item_neutral_tier + 1 : null,
      category: kind === "shop" ? (shops[key] ?? shops[key.replace(/_2$/, "")] ?? null) : null,
      img: `${CDN}/apps/dota2/images/dota_react/items/${key}.png`,
      components: recipe?.length ? recipe.map((id) => byId.get(id)).filter(Boolean) : null,
      abilities: parseItemAbilities(d.desc_loc, specials),
      attrib: specials
        .filter((s) => s.heading_loc && s.values_float?.some((v) => v !== 0))
        .map((s) => ({
          key: s.name,
          display: statDisplay(htmlToText(s.heading_loc), s.is_percentage),
          value: formatValues(s.values_float),
        })),
      cooldown: d.cooldowns?.[0] || null,
      manaCost: d.mana_costs?.[0] || null,
      lore: htmlToText(d.lore_loc),
      notes: (d.notes_loc ?? []).map((n) => htmlToText(fillTemplate(n, specials))).join("\n"),
    };
  });
  const count = (k) => Object.values(items).filter((x) => x.kind === k).length;
  console.log(`Item: дэлгүүр ${count("shop")}, neutral ${count("neutral")}, enchantment ${count("enchantment")}`);
  if (unknownTokens.size) console.warn(`  нэргүй үзүүлэлтийн тэмдэгт: ${[...unknownTokens].join(", ")}`);

  // ---------------------------------------------------------------- патчийн өөрчлөлтүүд (одоогийн том патчийн бүх дэд патч)
  const major = latest.patch_number.replace(/[a-z]+$/, "");
  const series = patches.filter((p) => p.patch_number.replace(/[a-z]+$/, "") === major);
  const notesText = (list) => (list ?? []).map((n) => htmlToText(n.note)).filter((t) => t && t !== "");
  const heroSlugById = new Map(heroes.map((h) => [h.id, h.slug]));
  const patchNotes = { major, patches: series.map((p) => p.patch_number), heroes: {}, items: {} };
  // Патч бүрээр (патчийн өөрчлөлтийн хуудсанд): мөр бүр { t: текст, i: доголын түвшин, a?: skill-ийн нэр }.
  const byPatch = [];
  const noteLines = (list) =>
    (list ?? []).map((n) => ({ t: htmlToText(n.note), i: n.indent_level ?? 1 })).filter((l) => l.t);
  const itemEntries = (list) =>
    (list ?? [])
      .map((it) => {
        const key = it.ability_id > 0 ? (byId.get(it.ability_id) ?? null) : null;
        const name = key ? byName.get(key)?.name_loc : null;
        return { key, title: it.title ? htmlToText(it.title) : (name ?? null), lines: noteLines(it.ability_notes) };
      })
      .filter((e) => e.lines.length);

  for (const p of series) {
    const data = await feed("patchnotes", { version: p.patch_number });
    byPatch.push({
      patch: p.patch_number,
      date: new Date(p.patch_timestamp * 1000).toISOString(),
      general: (data.general_notes ?? [])
        .map((g) => ({ title: htmlToText(g.title ?? ""), lines: noteLines(g.generic) }))
        .filter((g) => g.lines.length),
      heroes: (data.heroes ?? [])
        .map((h) => ({
          slug: heroSlugById.get(h.hero_id) ?? null,
          lines: [
            ...noteLines(h.hero_notes),
            ...(h.abilities ?? []).flatMap((a) =>
              noteLines(a.ability_notes).map((l) => ({ ...l, a: abilityNames.get(a.ability_id) ?? null })),
            ),
            ...noteLines(h.talent_notes).map((l) => ({ ...l, a: "Talent" })),
          ],
        }))
        .filter((h) => h.slug && h.lines.length),
      items: itemEntries(data.items),
      neutralItems: itemEntries(data.neutral_items),
      neutralCreeps: (data.neutral_creeps ?? [])
        .map((c) => ({ name: c.localized_name, lines: noteLines(c.neutral_creep_notes) }))
        .filter((c) => c.lines.length),
    });
    for (const h of data.heroes ?? []) {
      const slug = heroSlugById.get(h.hero_id);
      if (!slug) continue;
      const lines = [
        ...notesText(h.hero_notes).map((text) => ({ ability: null, text })),
        ...(h.abilities ?? []).flatMap((a) =>
          notesText(a.ability_notes).map((text) => ({ ability: abilityNames.get(a.ability_id) ?? null, text })),
        ),
        ...notesText(h.talent_notes).map((text) => ({ ability: "Talent", text })),
      ];
      if (lines.length) (patchNotes.heroes[slug] ??= []).push({ patch: p.patch_number, lines });
    }
    for (const it of [...(data.items ?? []), ...(data.neutral_items ?? [])]) {
      const key = byId.get(it.ability_id);
      const lines = notesText(it.ability_notes);
      if (key && lines.length) (patchNotes.items[key] ??= []).push({ patch: p.patch_number, lines });
    }
  }
  // Шинэ нь эхэндээ.
  for (const list of [...Object.values(patchNotes.heroes), ...Object.values(patchNotes.items)]) list.reverse();

  // ---------------------------------------------------------------- бичих
  await write("heroes.json", heroes);
  await write("hero-abilities.json", heroAbilities);
  await write("lore_en.json", loreEn);
  await write("items.json", items);
  await write("patch-notes.json", patchNotes);
  await write("patches.json", { major, latest: latest.patch_number, patches: byPatch.reverse() });
  await write(
    "meta.json",
    {
      ...meta,
      patch: latest.patch_number,
      patchDate: new Date(latest.patch_timestamp * 1000).toISOString(),
      gameDataUpdatedAt: new Date().toISOString(),
      source: "dota2.com datafeed",
    },
    2,
  );
  console.log("Тоглоомын өгөгдөл шинэчлэгдлээ.");
}
