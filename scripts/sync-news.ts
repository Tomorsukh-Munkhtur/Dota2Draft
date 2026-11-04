// Steam-ийн шинэ мэдээг ноорог болгон мэдээний сан руу (Supabase эсвэл data/news.json) нэмнэ.
// --translate өгвөл орчуулаагүй мэдээг Claude API-аар орчуулна (ANTHROPIC_API_KEY хэрэгтэй).
// Ажиллуулах: npm run news:sync  /  npm run news:sync -- --translate
import { fetchSteamNews } from "../src/lib/steam.ts";
import { insertNews, newsBackend, readNews, updateNewsItem } from "../src/lib/newsStore.ts";

const added = await insertNews(await fetchSteamNews());
console.log(`[${newsBackend()}] Шинээр нэмэгдсэн: ${added}`);

if (process.argv.includes("--translate")) {
  const { translateNews, describeTranslateError } = await import("../src/lib/translate.ts");
  for (const n of (await readNews()).filter((x) => x.bodyEn && !x.bodyMn)) {
    try {
      const t = await translateNews(n.titleEn, n.bodyEn);
      await updateNewsItem(n.id, {
        titleMn: t.title,
        summaryMn: t.summary,
        bodyMn: t.body,
        translatedAt: new Date().toISOString(),
      });
      console.log(`  ✓ ${n.titleEn}`);
    } catch (e) {
      console.error(`  ✗ ${n.titleEn}: ${describeTranslateError(e)}`);
      break;
    }
  }
}
