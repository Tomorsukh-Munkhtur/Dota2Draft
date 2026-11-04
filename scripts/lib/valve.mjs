// dota2.com-ийн албан ёсны datafeed-ээс өгөгдөл татах ба текстийг цэвэрлэх туслахууд.
const FEED = "https://www.dota2.com/datafeed";
export const CDN = "https://cdn.cloudflare.steamstatic.com";

export async function feed(path, params = {}, attempt = 1) {
  const qs = new URLSearchParams({ language: "english", ...params });
  try {
    const res = await fetch(`${FEED}/${path}?${qs}`, {
      headers: { "user-agent": "dota2-mn-site (local data sync)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (attempt >= 4) throw new Error(`${path} ${JSON.stringify(params)}: ${e.message}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return feed(path, params, attempt + 1);
  }
}

/** Олон хүсэлтийг `limit` зэрэг ажиллуулна (Valve-ийн серверийг ачаалахгүйн тулд). */
export async function pool(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i], i);
      }
    }),
  );
  return out;
}

const num = (v) => String(Math.round(v * 100) / 100);

/** special_values-ийн утгуудыг "25 / 30 / 35" хэлбэрээр. */
export function formatValues(values) {
  if (!values?.length) return "";
  const uniq = values.every((v) => v === values[0]) ? [values[0]] : values;
  return uniq.map(num).join(" / ");
}

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/** HTML-ийг энгийн текст болгоно (<br> → мөр шилжилт). */
export function htmlToText(html) {
  return (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:h\d|p|div)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? m)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Valve-ийн загвар текстийг бөглөнө: "%duration%s" → "9 / 8 / 7s", "%%" → "%",
 * талантын "{s:value}" → "15".
 */
export function fillTemplate(text, specials) {
  const byName = new Map((specials ?? []).map((s) => [s.name.toLowerCase(), s]));
  const value = (name) => {
    const s = byName.get(name.toLowerCase());
    return s ? formatValues(s.values_float) : null;
  };
  return (text ?? "")
    .replace(/\{s:([a-z0-9_]+)\}/gi, (_, name) => value(name) ?? "?")
    .replace(/%([a-z0-9_]+)%/gi, (m, name) => value(name) ?? "")
    .replace(/%%/g, "%");
}
