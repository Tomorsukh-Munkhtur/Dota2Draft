import Image from "next/image";
import Link from "next/link";
import { getHero } from "@/lib/heroes";

/** Баатрын хуудас руу холбоос + (байвал) %-ийн утга, тоглолтын тоо. */
export default function HeroLinkRow({ slug, value, games }: { slug: string; value?: number; games?: number }) {
  const h = getHero(slug);
  if (!h) return null;
  return (
    <Link
      href={`/heroes/${slug}`}
      className="flex items-center gap-2 rounded px-1.5 py-1 transition hover:bg-panel-2"
    >
      <Image src={h.img} alt={h.name} width={56} height={32} className="h-8 w-14 rounded-sm object-cover" />
      <span className="min-w-0 flex-1 truncate text-sm">{h.name}</span>
      {value !== undefined && (
        <span className="text-right">
          <span className={`block text-sm font-semibold tabular-nums ${value >= 0 ? "text-good" : "text-bad"}`}>
            {value > 0 ? "+" : ""}
            {value.toFixed(1)}%
          </span>
          {games !== undefined && (
            <span className="block text-[10px] text-muted tabular-nums">{games.toLocaleString("en-US")} тоглолт</span>
          )}
        </span>
      )}
    </Link>
  );
}
