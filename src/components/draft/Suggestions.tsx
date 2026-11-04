import Image from "next/image";
import { formatPct, type DraftData, type Suggestion } from "@/lib/draft";
import HeroThumb from "./HeroThumb";

export function SuggestionList({
  data,
  list,
  tone,
  onSelect,
}: {
  data: DraftData;
  list: Suggestion[];
  tone: "good" | "bad";
  onSelect: (hero: number) => void;
}) {
  return (
    <ol className="space-y-1">
      {list.map((s, i) => {
        const h = data.heroes[s.hero];
        const parts = [...s.parts].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 4);
        return (
          <li key={s.hero}>
            <button
              onClick={() => onSelect(s.hero)}
              className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition hover:bg-panel-2"
            >
              <span
                className={`w-5 text-center text-xs font-bold ${tone === "good" ? "text-good" : "text-bad"}`}
              >
                {i + 1}
              </span>
              <HeroThumb hero={h} width={48} className="w-12 rounded-sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{h.name}</span>
                <span className="flex flex-wrap gap-x-2 text-[10px] text-muted">
                  {parts.map((p) => (
                    <span key={`${p.kind}${p.hero}`}>
                      {p.kind === "vs" ? "⚔" : "🤝"} {data.heroes[p.hero].name}{" "}
                      <span className={p.value >= 0 ? "text-good" : "text-bad"}>{formatPct(p.value)}</span>
                    </span>
                  ))}
                  {parts.length === 0 && <span>Ялалтын хувь {data.winrate[s.hero].toFixed(1)}%</span>}
                </span>
              </span>
              <span className="text-xs font-semibold tabular-nums text-fg/80">{s.score.toFixed(1)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Эсрэг багийн баатрууд бүрт тохирох counter item-уудыг нэгтгэнэ. */
export function EnemyItems({
  data,
  enemies,
  onSelect,
}: {
  data: DraftData;
  enemies: number[];
  onSelect: (hero: number) => void;
}) {
  if (!enemies.length)
    return <p className="text-sm text-muted">Эсрэг багийн баатрууд сонгогдоход энд counter item гарна.</p>;

  const agg = new Map<string, { heroes: number[]; reasons: string[] }>();
  for (const e of enemies) {
    for (const c of data.content[data.heroes[e].slug]?.counterItems ?? []) {
      const entry = agg.get(c.item) ?? { heroes: [], reasons: [] };
      entry.heroes.push(e);
      entry.reasons.push(`${data.heroes[e].name}: ${c.reason}`);
      agg.set(c.item, entry);
    }
  }
  const rows = [...agg.entries()]
    .filter(([key]) => data.items[key])
    .sort((a, b) => b[1].heroes.length - a[1].heroes.length);

  if (!rows.length) return <p className="text-sm text-muted">Item-ийн мэдээлэл хараахан ороогүй байна.</p>;

  return (
    <ul className="space-y-2">
      {rows.map(([key, v]) => {
        const it = data.items[key];
        return (
          <li key={key} className="flex gap-2">
            <Image src={it.img} alt={it.name} width={44} height={32} className="h-8 w-11 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gold">{it.name}</span>
                <span className="text-muted">{it.cost}</span>
                <span className="ml-auto flex gap-0.5">
                  {v.heroes.map((e) => (
                    <button key={e} onClick={() => onSelect(e)}>
                      <HeroThumb hero={data.heroes[e]} width={32} className="w-8 rounded-sm" />
                    </button>
                  ))}
                </span>
              </div>
              <ul className="mt-0.5 space-y-0.5 text-muted">
                {v.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
