// Мэдээний сан: SUPABASE_URL ба SUPABASE_SERVICE_ROLE_KEY тохируулсан бол Supabase-ийн `news` хүснэгт,
// үгүй бол локал data/news.json файл. Зөвхөн сервер талд ашиглана (service role түлхүүр клиент рүү гарахгүй).
// scripts/ дотроос node-оор шууд импортлогддог тул энд "@/..." alias хэрэглэхгүй.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type NewsStatus = "draft" | "published";

export type NewsItem = {
  id: string;
  sourceUrl: string;
  author: string;
  date: string;
  image: string | null;
  titleEn: string;
  bodyEn: string;
  titleMn: string | null;
  summaryMn: string | null;
  bodyMn: string | null;
  status: NewsStatus;
  translatedAt: string | null;
  publishedAt: string | null;
};

type NewsRow = {
  id: string;
  source_url: string;
  author: string;
  date: string;
  image: string | null;
  title_en: string;
  body_en: string;
  title_mn: string | null;
  summary_mn: string | null;
  body_mn: string | null;
  status: NewsStatus;
  translated_at: string | null;
  published_at: string | null;
};

const toRow = (n: NewsItem): NewsRow => ({
  id: n.id,
  source_url: n.sourceUrl,
  author: n.author,
  date: n.date,
  image: n.image,
  title_en: n.titleEn,
  body_en: n.bodyEn,
  title_mn: n.titleMn,
  summary_mn: n.summaryMn,
  body_mn: n.bodyMn,
  status: n.status,
  translated_at: n.translatedAt,
  published_at: n.publishedAt,
});

const fromRow = (r: NewsRow): NewsItem => ({
  id: r.id,
  sourceUrl: r.source_url,
  author: r.author,
  date: new Date(r.date).toISOString(),
  image: r.image,
  titleEn: r.title_en,
  bodyEn: r.body_en,
  titleMn: r.title_mn,
  summaryMn: r.summary_mn,
  bodyMn: r.body_mn,
  status: r.status,
  translatedAt: r.translated_at,
  publishedAt: r.published_at,
});

const PATCH_COLUMNS: Record<keyof NewsItem, keyof NewsRow> = {
  id: "id",
  sourceUrl: "source_url",
  author: "author",
  date: "date",
  image: "image",
  titleEn: "title_en",
  bodyEn: "body_en",
  titleMn: "title_mn",
  summaryMn: "summary_mn",
  bodyMn: "body_mn",
  status: "status",
  translatedAt: "translated_at",
  publishedAt: "published_at",
};

let client: SupabaseClient | null | undefined;

function supabase() {
  if (client === undefined) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }
  return client;
}

export const newsBackend = () => (supabase() ? "supabase" : "file");

function check<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data;
}

// ---------------------------------------------------------------- локал файл
const FILE = path.join(process.cwd(), "data", "news.json");

async function readFileNews(): Promise<NewsItem[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as NewsItem[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeFileNews(items: NewsItem[]) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(FILE, JSON.stringify(sorted, null, 2) + "\n");
}

// ---------------------------------------------------------------- нийтийн API

/** Бүх мэдээ, шинэ нь эхэндээ. */
export async function readNews(): Promise<NewsItem[]> {
  const db = supabase();
  if (!db) return (await readFileNews()).sort((a, b) => b.date.localeCompare(a.date));
  const rows = check(await db.from("news").select("*").order("date", { ascending: false }));
  return (rows as NewsRow[]).map(fromRow);
}

/** Байхгүй id-тай мэдээг нэмнэ (байгаа мэдээний орчуулга/төлөвийг хөндөхгүй). Нэмэгдсэн тоог буцаана. */
export async function insertNews(incoming: NewsItem[]): Promise<number> {
  const db = supabase();
  if (!db) {
    const existing = await readFileNews();
    const known = new Set(existing.map((n) => n.id));
    const added = incoming.filter((n) => !known.has(n.id));
    if (added.length) await writeFileNews([...existing, ...added]);
    return added.length;
  }
  if (!incoming.length) return 0;
  const rows = check(
    await db
      .from("news")
      .upsert(incoming.map(toRow), { onConflict: "id", ignoreDuplicates: true })
      .select("id"),
  );
  return (rows as { id: string }[]).length;
}

export async function updateNewsItem(id: string, patch: Partial<NewsItem>): Promise<NewsItem> {
  const db = supabase();
  if (!db) {
    const items = await readFileNews();
    const i = items.findIndex((n) => n.id === id);
    if (i < 0) throw new Error(`Мэдээ олдсонгүй: ${id}`);
    items[i] = { ...items[i], ...patch };
    await writeFileNews(items);
    return items[i];
  }
  const values = Object.fromEntries(
    Object.entries(patch).map(([k, v]) => [PATCH_COLUMNS[k as keyof NewsItem], v]),
  );
  const row = check(await db.from("news").update(values).eq("id", id).select("*").single());
  return fromRow(row as NewsRow);
}

export async function deleteNewsItem(id: string): Promise<void> {
  const db = supabase();
  if (!db) {
    await writeFileNews((await readFileNews()).filter((n) => n.id !== id));
    return;
  }
  check(await db.from("news").delete().eq("id", id));
}
