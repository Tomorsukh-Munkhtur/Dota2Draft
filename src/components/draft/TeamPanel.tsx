import type { DraftData } from "@/lib/draft";
import HeroThumb from "./HeroThumb";

type Props = {
  data: DraftData;
  title: string;
  subtitle: string;
  tone: "radiant" | "dire";
  picks: number[];
  bans?: (number | null)[];
  banSlots?: number;
  active?: boolean;
  reserve?: number;
  onHero: (hero: number) => void;
};

const TONE = {
  radiant: { text: "text-radiant", border: "border-radiant", bg: "bg-radiant/10" },
  dire: { text: "text-dire", border: "border-dire", bg: "bg-dire/10" },
};

export default function TeamPanel({
  data,
  title,
  subtitle,
  tone,
  picks,
  bans,
  banSlots = 0,
  active,
  reserve,
  onHero,
}: Props) {
  const t = TONE[tone];
  return (
    <section
      className={`rounded-lg border p-3 transition ${active ? `${t.border} ${t.bg}` : "border-line bg-panel"}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className={`font-bold uppercase tracking-wide ${t.text}`}>{title}</h2>
        <span className="text-xs text-muted">
          {subtitle}
          {reserve !== undefined && <span className="ml-2 tabular-nums">нөөц {reserve}с</span>}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }, (_, i) => {
          const h = picks[i];
          return h === undefined ? (
            <div key={i} className="aspect-video rounded border border-dashed border-line bg-bg/50" />
          ) : (
            <button key={i} onClick={() => onHero(h)} className="overflow-hidden rounded ring-1 ring-line">
              <HeroThumb hero={data.heroes[h]} width={120} className="w-full" />
            </button>
          );
        })}
      </div>
      {banSlots > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: banSlots }, (_, i) => {
            const h = bans?.[i];
            if (h === undefined)
              return <div key={i} className="h-6 w-10 rounded border border-dashed border-line" />;
            if (h === null)
              return (
                <div key={i} title="Бан алгасагдсан" className="grid h-6 w-10 place-items-center rounded bg-bg text-[10px] text-muted">
                  —
                </div>
              );
            return (
              <button key={i} onClick={() => onHero(h)} className="relative overflow-hidden rounded">
                <HeroThumb hero={data.heroes[h]} width={40} className="w-10 grayscale" />
                <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,#e0533f_45%,#e0533f_55%,transparent_55%)]" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
