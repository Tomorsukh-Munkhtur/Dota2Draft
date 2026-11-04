import { cacheLife, cacheTag } from "next/cache";
import { readNews } from "./newsStore";

export const NEWS_TAG = "news";

/** Нийтлэгдсэн мэдээ (шинэ нь эхэндээ). Админ өөрчлөхөд updateTag(NEWS_TAG)-аар шинэчлэгдэнэ. */
export async function getPublishedNews() {
  "use cache";
  cacheLife("hours");
  cacheTag(NEWS_TAG);
  return (await readNews()).filter((n) => n.status === "published" && n.bodyMn);
}

export async function getPublishedNewsItem(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(NEWS_TAG);
  return (await readNews()).find((n) => n.id === id && n.status === "published" && n.bodyMn) ?? null;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()} оны ${d.getUTCMonth() + 1}-р сарын ${d.getUTCDate()}`;
}
