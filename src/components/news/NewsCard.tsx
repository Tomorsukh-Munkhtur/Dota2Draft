import Link from "next/link";
import { formatDate } from "@/lib/news";
import type { NewsItem } from "@/lib/newsStore";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className="card-g group flex flex-col overflow-hidden rounded-lg"
    >
      {item.image ? (
        // Steam-ийн зургууд янз бүрийн харьцаатай тул энгийн img ашиглана.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="aspect-[16/7] w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid aspect-[16/7] place-items-center bg-[linear-gradient(135deg,#2a1210,#11161e)] text-3xl font-black text-accent/70">
          PATCH
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-muted">{formatDate(item.date)}</p>
        <h3 className="font-display text-lg font-bold leading-snug group-hover:text-gold">{item.titleMn}</h3>
        {item.summaryMn && <p className="line-clamp-3 text-sm text-fg/75">{item.summaryMn}</p>}
      </div>
    </Link>
  );
}
