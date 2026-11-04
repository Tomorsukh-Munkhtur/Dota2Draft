import type { DraftData } from "@/lib/draft";
import { formatPct } from "@/lib/draft";
import HeroThumb from "./HeroThumb";

/** Жижиг баатар + %-ийн утга. Дарахад тухайн баатрыг сонгоно. */
export default function HeroChip({
  data,
  hero,
  value,
  onSelect,
  muted,
}: {
  data: DraftData;
  hero: number;
  value?: number;
  onSelect?: (hero: number) => void;
  muted?: boolean;
}) {
  const h = data.heroes[hero];
  return (
    <button
      onClick={() => onSelect?.(hero)}
      className={`flex items-center gap-1.5 rounded bg-panel-2 py-0.5 pl-0.5 pr-2 text-left text-xs transition hover:bg-line ${
        muted ? "opacity-40" : ""
      }`}
      title={h.name}
    >
      <HeroThumb hero={h} width={36} className="w-9 rounded-sm" />
      <span className="max-w-[90px] truncate">{h.name}</span>
      {value !== undefined && (
        <span className={`ml-auto pl-1 font-semibold tabular-nums ${value >= 0 ? "text-good" : "text-bad"}`}>
          {formatPct(value)}
        </span>
      )}
    </button>
  );
}
