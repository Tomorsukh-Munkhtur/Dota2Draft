"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endAdminSession, requireAdmin, startAdminSession } from "@/lib/admin";
import { NEWS_TAG } from "@/lib/news";
import { deleteNewsItem, insertNews, readNews, updateNewsItem, type NewsStatus } from "@/lib/newsStore";
import { fetchSteamNews } from "@/lib/steam";
import { describeTranslateError, translateNews } from "@/lib/translate";
import { runGameDataUpdate } from "@/lib/updater";

export type ActionState = { ok?: string; error?: string } | null;

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!checkPassword(String(formData.get("password") ?? ""))) return { error: "Нууц үг буруу байна." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin");
}

export async function syncNews(): Promise<ActionState> {
  await requireAdmin();
  try {
    const added = await insertNews(await fetchSteamNews());
    refresh();
    return { ok: added ? `${added} шинэ мэдээ нэмэгдлээ.` : "Шинэ мэдээ алга." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function translateItem(id: string): Promise<ActionState> {
  await requireAdmin();
  const item = (await readNews()).find((n) => n.id === id);
  if (!item) return { error: "Мэдээ олдсонгүй." };
  try {
    const t = await translateNews(item.titleEn, item.bodyEn);
    await updateNewsItem(id, {
      titleMn: t.title,
      summaryMn: t.summary,
      bodyMn: t.body,
      translatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return { error: describeTranslateError(e) };
  }
  if (item.status === "published") updateTag(NEWS_TAG);
  refresh();
  return { ok: "Орчууллаа." };
}

export async function saveItem(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const item = await updateNewsItem(id, {
    titleMn: text("titleMn"),
    summaryMn: text("summaryMn"),
    bodyMn: text("bodyMn"),
  });
  if (item.status === "published") updateTag(NEWS_TAG);
  refresh();
  return { ok: "Хадгаллаа." };
}

/** Админ өөрөө бичсэн мэдээ. */
export async function createNews(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const title = text("titleMn");
  const body = text("bodyMn");
  if (!title || !body) return { error: "Гарчиг ба агуулга заавал хэрэгтэй." };
  const image = text("image");
  if (image && !/^https?:\/\//i.test(image)) return { error: "Зургийн холбоос http:// эсвэл https://-ээр эхлэх ёстой." };
  const publish = formData.get("publish") === "on";
  const now = new Date().toISOString();
  await insertNews([{
    id: `local-${Date.now()}`,
    sourceUrl: text("sourceUrl"),
    author: "admin",
    date: now,
    image: image || null,
    titleEn: "",
    bodyEn: "",
    titleMn: title,
    summaryMn: text("summaryMn") || null,
    bodyMn: body,
    status: publish ? "published" : "draft",
    translatedAt: null,
    publishedAt: publish ? now : null,
  }]);
  if (publish) updateTag(NEWS_TAG);
  redirect("/admin");
}

export async function deleteNews(id: string): Promise<ActionState> {
  await requireAdmin();
  const item = (await readNews()).find((n) => n.id === id);
  if (!item) return { error: "Мэдээ олдсонгүй." };
  await deleteNewsItem(id);
  if (item.status === "published") updateTag(NEWS_TAG);
  refresh();
  return { ok: "Устгалаа." };
}

/** Тоглоомын өгөгдлийг (патч, баатар, skill, item, статистик) одоо шинэчилнэ. */
export async function updateGameData(): Promise<ActionState> {
  await requireAdmin();
  const status = await runGameDataUpdate({ force: true });
  refresh();
  return status.lastResult === "ok" ? { ok: status.message } : { error: status.message };
}

export async function setStatus(id: string, status: NewsStatus): Promise<ActionState> {
  await requireAdmin();
  const item = (await readNews()).find((n) => n.id === id);
  if (!item) return { error: "Мэдээ олдсонгүй." };
  if (status === "published" && !(item.titleMn && item.bodyMn)) return { error: "Эхлээд монгол гарчиг, агуулгаа оруулна уу." };
  await updateNewsItem(id, {
    status,
    publishedAt: status === "published" ? new Date().toISOString() : item.publishedAt,
  });
  updateTag(NEWS_TAG);
  refresh();
  return { ok: status === "published" ? "Нийтэллээ." : "Нуулаа." };
}
