// Нүүр хуудасны слайд (баннер): Supabase-ийн `banners` хүснэгт, зураг нь `banners` storage bucket-д.
import { cacheLife, cacheTag } from "next/cache";
import { check, getSupabase, logSupabaseReadError } from "./supabase.ts";

export const BANNERS_TAG = "banners";
const BUCKET = "banners";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  buttonLabel: string;
  sortOrder: number;
  active: boolean;
};

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_label: string;
  sort_order: number;
  active: boolean;
};

const fromRow = (r: BannerRow): Banner => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  imageUrl: r.image_url,
  linkUrl: r.link_url,
  buttonLabel: r.button_label,
  sortOrder: r.sort_order,
  active: r.active,
});

function db() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase тохируулаагүй байна (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  return client;
}

/** Бүх баннер (админд). */
export async function listBanners(): Promise<Banner[]> {
  const rows = check(await db().from("banners").select("*").order("sort_order").order("created_at"));
  return (rows as BannerRow[]).map(fromRow);
}

/** Нүүр хуудсанд харагдах баннерууд. Алдаатай бол хоосон (нүүр хуудас унахгүй). */
export async function getActiveBanners(): Promise<Banner[]> {
  "use cache";
  cacheTag(BANNERS_TAG);
  if (!getSupabase()) {
    cacheLife("hours");
    return [];
  }
  try {
    const banners = (await listBanners()).filter((b) => b.active);
    cacheLife("hours");
    return banners;
  } catch (e) {
    logSupabaseReadError("banners", e, "supabase/migrations/0002_banners_patch_translations.sql");
    // Хүснэгт үүсэхэд удалгүй өөрөө шинэчлэгдэнэ.
    cacheLife("minutes");
    return [];
  }
}

/** Зургийг storage-д байршуулж нийтийн URL буцаана. */
export async function uploadBannerImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  check(await db().storage.from(BUCKET).upload(name, file, { contentType: file.type, upsert: false }));
  return db().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

export async function insertBanner(b: Omit<Banner, "id">) {
  check(
    await db().from("banners").insert({
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.imageUrl,
      link_url: b.linkUrl,
      button_label: b.buttonLabel,
      sort_order: b.sortOrder,
      active: b.active,
    }),
  );
}

export async function updateBanner(id: string, patch: Partial<Pick<Banner, "sortOrder" | "active">>) {
  const values: Partial<BannerRow> = {};
  if (patch.sortOrder !== undefined) values.sort_order = patch.sortOrder;
  if (patch.active !== undefined) values.active = patch.active;
  check(await db().from("banners").update(values).eq("id", id));
}

/** Баннерыг устгаж, манай bucket-д байсан зургийг нь мөн устгана. */
export async function deleteBanner(id: string) {
  const row = check(await db().from("banners").select("image_url").eq("id", id).single()) as { image_url: string };
  check(await db().from("banners").delete().eq("id", id));
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const at = row.image_url.indexOf(marker);
  if (at >= 0) await db().storage.from(BUCKET).remove([row.image_url.slice(at + marker.length)]);
}
