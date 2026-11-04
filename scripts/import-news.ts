// Локал data/news.json дахь мэдээг Supabase-ийн `news` хүснэгт рүү хуулна (нэг удаа, Supabase-д шилжихэд).
// Ажиллуулах: npm run news:import   (.env.local-д SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY байх ёстой)
import { readFile } from "node:fs/promises";
import { insertNews, newsBackend, type NewsItem } from "../src/lib/newsStore.ts";

if (newsBackend() !== "supabase") {
  console.error("SUPABASE_URL ба SUPABASE_SERVICE_ROLE_KEY .env.local-д алга — юу ч хийгдсэнгүй.");
  process.exitCode = 1;
} else {
  const items = JSON.parse(await readFile("data/news.json", "utf8")) as NewsItem[];
  const added = await insertNews(items);
  console.log(`Supabase руу хуулав: ${added} шинэ (нийт файлд ${items.length}).`);
}
