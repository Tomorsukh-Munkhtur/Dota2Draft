import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ATTR_COLOR, ATTR_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { DraftData } from "@/lib/draft";
import HeroChip from "./HeroChip";
import HeroThumb from "./HeroThumb";

type Props = {
  data: DraftData;
  hero: number;
  allies: number[];
  enemies: number[];
  taken: Set<number>;
  indexOf: Map<string, number>;
  actions: ReactNode;
  onSelect: (hero: number) => void;
  onClose: () => void;
};

function top(values: number[], self: number, dir: 1 | -1, n = 5) {
  return values
    .map((value, hero) => ({ hero, value }))
    .filter((r) => r.hero !== self)
    .sort((a, b) => dir * (b.value - a.value))
    .slice(0, n);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h4>
      {children}
    </div>
  );
}

export default function Inspector({ data, hero, allies, enemies, taken, indexOf, actions, onSelect, onClose }: Props) {
  const h = data.heroes[hero];
  const content = data.content[h.slug];
  const beats = top(data.vs[hero], hero, 1);
  const losesTo = top(data.vs[hero], hero, -1);
  const synergy = top(data.with[hero], hero, 1);
  const similar = (content?.similar ?? []).map((s) => indexOf.get(s)).filter((i): i is number => i !== undefined);

  return (
    <section className="space-y-4 rounded-lg border border-line bg-panel p-4">
      <div className="flex gap-3">
        <HeroThumb hero={h} width={128} className="w-32 shrink-0 rounded" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight">{h.name}</h3>
            <button onClick={onClose} className="text-muted hover:text-fg" aria-label="Хаах">
              ✕
            </button>
          </div>
          <p className={`text-xs font-semibold ${ATTR_COLOR[h.attr]}`}>{ATTR_LABEL[h.attr]}</p>
          <p className="mt-0.5 text-xs text-muted">{h.roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ")}</p>
          <p className="mt-1 text-xs">
            Ялалтын хувь: <span className="font-semibold tabular-nums">{data.winrate[hero].toFixed(1)}%</span>
          </p>
        </div>
      </div>

      {content?.summary && <p className="text-sm text-fg/85">{content.summary}</p>}

      {actions}

      {(enemies.length > 0 || allies.length > 0) && !taken.has(hero) && (
        <Section title="Энэ драфтад">
          <div className="flex flex-wrap gap-1">
            {enemies.map((e) => (
              <HeroChip key={`e${e}`} data={data} hero={e} value={data.vs[hero][e]} onSelect={onSelect} />
            ))}
            {allies.map((a) => (
              <HeroChip key={`a${a}`} data={data} hero={a} value={data.with[hero][a]} onSelect={onSelect} />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Эсрэг баатрын эсрэг давуу тал ба манай баатруудтай хамтрах нэмэгдэл.
          </p>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Section title="Ялдаг баатрууд">
          <div className="flex flex-col gap-1">
            {beats.map((r) => (
              <HeroChip key={r.hero} data={data} hero={r.hero} value={r.value} onSelect={onSelect} />
            ))}
          </div>
        </Section>
        <Section title="Ялагддаг баатрууд">
          <div className="flex flex-col gap-1">
            {losesTo.map((r) => (
              <HeroChip key={r.hero} data={data} hero={r.hero} value={r.value} onSelect={onSelect} />
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Section title="Хамтрах баатрууд">
          <div className="flex flex-col gap-1">
            {synergy.map((r) => (
              <HeroChip key={r.hero} data={data} hero={r.hero} value={r.value} onSelect={onSelect} />
            ))}
          </div>
        </Section>
        <Section title="Ойролцоо баатрууд">
          <div className="flex flex-col gap-1">
            {similar.length ? (
              similar.map((s) => <HeroChip key={s} data={data} hero={s} onSelect={onSelect} />)
            ) : (
              <p className="text-xs text-muted">Мэдээлэл алга</p>
            )}
          </div>
        </Section>
      </div>

      {content?.counterItems.length ? (
        <Section title={`${h.name}-ийн эсрэг авах item`}>
          <ul className="space-y-1.5">
            {content.counterItems.map((c) => {
              const it = data.items[c.item];
              if (!it) return null;
              return (
                <li key={c.item} className="flex gap-2 text-xs">
                  <Image src={it.img} alt={it.name} width={40} height={29} className="h-[29px] w-10 shrink-0 rounded-sm" />
                  <span>
                    <Link href={`/items/${it.key}`} className="font-semibold text-gold hover:underline">
                      {it.name}
                    </Link>{" "}
                    <span className="text-muted">({it.cost})</span> — {c.reason}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Link href={`/heroes/${h.slug}`} className="block text-right text-xs text-gold hover:underline">
        Баатрын дэлгэрэнгүй хуудас →
      </Link>
    </section>
  );
}
