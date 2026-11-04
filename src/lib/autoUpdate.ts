// Сервер ажиллаж байх хугацаанд тоглоомын өгөгдлийг тогтмол шалгана.
import { updateToken } from "./updateToken";

const FIRST_CHECK_MS = 60 * 1000;
const CHECK_EVERY_MS = 3 * 60 * 60 * 1000;

const state = globalThis as { __dota2AutoUpdate?: ReturnType<typeof setInterval> };

export function startAutoUpdate() {
  if (process.env.AUTO_UPDATE === "off" || state.__dota2AutoUpdate) return;
  // `next build` үед сервер байхгүй; Vercel дээр GitHub Actions шинэчилдэг.
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.VERCEL) return;
  if (!updateToken()) {
    console.warn("[auto-update] ADMIN_PASSWORD тохируулаагүй тул автомат шинэчлэлт идэвхгүй.");
    return;
  }

  const tick = async () => {
    // Next.js сервер асахдаа өөрийн хаягийг энд хадгалдаг.
    const origin = process.env.__NEXT_PRIVATE_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
    try {
      const res = await fetch(`${origin}/api/game-data/update`, {
        method: "POST",
        headers: { "x-update-token": updateToken()! },
      });
      const status = await res.json().catch(() => null);
      console.log(`[auto-update] ${res.status} ${status?.message ?? ""}`);
    } catch (e) {
      console.warn(`[auto-update] амжилтгүй: ${e instanceof Error ? e.message : e}`);
    }
  };

  // unref: timer нь процессыг дангаараа амьд байлгахгүй (HTTP сервер л барина).
  setTimeout(tick, FIRST_CHECK_MS).unref();
  state.__dota2AutoUpdate = setInterval(tick, CHECK_EVERY_MS);
  state.__dota2AutoUpdate.unref();
}
