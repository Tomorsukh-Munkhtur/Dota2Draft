import type { Metadata } from "next";
import NewsCard from "@/components/news/NewsCard";
import { getPublishedNews } from "@/lib/news";

export const metadata: Metadata = {
  title: "Мэдээ",
  description: "Dota 2-ын албан ёсны мэдээ, патч — монгол хэлээр.",
};

export default async function NewsPage() {
  const news = await getPublishedNews();
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Мэдээ</h1>
        <p className="text-sm text-muted">Valve-ийн албан ёсны мэдээ, патчийн тайлбарыг монгол хэлээр.</p>
      </div>
      {news.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-panel p-6 text-muted">Одоогоор нийтлэгдсэн мэдээ алга.</p>
      )}
    </div>
  );
}
