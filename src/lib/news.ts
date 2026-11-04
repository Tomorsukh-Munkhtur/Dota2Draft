import { cacheLife, cacheTag } from "next/cache";
import { readNews } from "./newsStore";

export const NEWS_TAG = "news";

/**
 * Мэдээний сан (ж: Supabase түр зогссон) уншигдахгүй үед сайт болон Vercel build унахгүй байх ёстой —
 * эс бөгөөс тоглоомын өгөгдлийн шинэчлэлт ч deploy хийгдэхгүй. Ийм үед null буцаана.
 */
async function readNewsSafely() {
  try {
    return await readNews();
  } catch (e) {
    console.error(`[news] мэдээ уншиж чадсангүй: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/** Нийтлэгдсэн мэдээ (шинэ нь эхэндээ). Админ өөрчлөхөд updateTag(NEWS_TAG)-аар шинэчлэгдэнэ. */
export async function getPublishedNews() {
  "use cache";
  cacheTag(NEWS_TAG);
  const all = await readNewsSafely();
  // Алдаа гарсан бол удахгүй дахин оролдоно.
  if (all) cacheLife("hours");
  else cacheLife("minutes");
  return (all ?? []).filter((n) => n.status === "published" && n.bodyMn);
}

export async function getPublishedNewsItem(id: string) {
  "use cache";
  cacheTag(NEWS_TAG);
  const all = await readNewsSafely();
  if (all) cacheLife("hours");
  else cacheLife("minutes");
  return all?.find((n) => n.id === id && n.status === "published" && n.bodyMn) ?? null;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()} оны ${d.getUTCMonth() + 1}-р сарын ${d.getUTCDate()}`;
}
