import { ATTRS, ATTR_LABEL, ATTR_COLOR } from "@/lib/labels";
import type { DraftData } from "@/lib/draft";
import HeroThumb from "./HeroThumb";

type Props = {
  data: DraftData;
  query: string;
  taken: Set<number>;
  disabled: Set<number>;
  selected: number | null;
  /** Одоогийн үйлдэлд санал болгож буй баатруудын эрэмбэ (1-ээс). */
  ranks: Map<number, number>;
  rankTone: "good" | "bad";
  onSelect: (hero: number) => void;
  onCommit: (hero: number) => void;
};

export default function HeroGrid({ data, query, taken, disabled, selected, ranks, rankTone, onSelect, onCommit }: Props) {
  const q = query.trim().toLowerCase();
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {ATTRS.map((attr) => (
        <section key={attr} className="rounded-lg border border-line bg-panel p-2">
          <h3 className={`mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider ${ATTR_COLOR[attr]}`}>
            {ATTR_LABEL[attr]}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-1">
            {data.heroes.map((h, i) => {
              if (h.attr !== attr) return null;
              const isTaken = taken.has(i);
              const isDisabled = disabled.has(i);
              const dim = q && !h.name.toLowerCase().includes(q);
              const rank = ranks.get(i);
              return (
                <button
                  key={h.slug}
                  onClick={() => onSelect(i)}
                  onDoubleClick={() => !isTaken && !isDisabled && onCommit(i)}
                  className={`group relative overflow-hidden rounded transition ${
                    selected === i ? "z-10 scale-110 ring-2 ring-gold" : "hover:z-10 hover:scale-110 hover:ring-1 hover:ring-fg/60"
                  } ${isTaken || isDisabled ? "opacity-25 grayscale" : ""} ${dim ? "opacity-15" : ""}`}
                >
                  <HeroThumb hero={h} width={64} className="w-full" />
                  {rank && !isTaken && (
                    <span
                      className={`absolute left-0 top-0 rounded-br px-1 text-[10px] font-bold leading-4 text-black ${
                        rankTone === "good" ? "bg-good" : "bg-bad"
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 px-0.5 text-[9px] leading-3 opacity-0 group-hover:opacity-100">
                    {h.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
