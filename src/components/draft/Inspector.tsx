"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
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

type InfoTab = "counter" | "synergy" | "items";
const TABS: [InfoTab, string][] = [
  ["counter", "Counter"],
  ["synergy", "Synergy"],
  ["items", "Item"],
];

function top(values: number[], self: number, dir: 1 | -1, n = 5) {
  return values
    .map((value, hero) => ({ hero, value }))
    .filter((r) => r.hero !== self)
    .sort((a, b) => dir * (b.value - a.value))
    .slice(0, n);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h4 className={`text-[11px] font-semibold uppercase tracking-wider text-muted ${hint ? "" : "mb-1.5"}`}>{title}</h4>
      {hint && <p className="mb-1.5 text-[10px] leading-tight text-muted/80">{hint}</p>}
      {children}
    </div>
  );
}

/** Сонгосон баатрын товч мэдээлэл: үйлдлийн товч, энэ драфтад тохирох эсэх, табтай дэлгэрэнгүй. */
export default function Inspector({ data, hero, allies, enemies, taken, indexOf, actions, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<InfoTab>("counter");
  const h = data.heroes[hero];
  const content = data.content[h.slug];
  const beats = top(data.vs[hero], hero, 1);
  const losesTo = top(data.vs[hero], hero, -1);
  const synergy = top(data.with[hero], hero, 1);
  const similar = (content?.similar ?? []).map((s) => indexOf.get(s)).filter((i): i is number => i !== undefined);
  const counterItems = (content?.counterItems ?? []).filter((c) => data.items[c.item]);
  const list = (rows: { hero: number; value?: number }[]) => (
    <div className="flex flex-col gap-1">
      {rows.length ? (
        rows.map((r) => <HeroChip key={r.hero} data={data} hero={r.hero} value={r.value} onSelect={onSelect} />)
      ) : (
        <p className="text-xs text-muted">Мэдээлэл алга</p>
      )}
    </div>
  );

  return (
    <section className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <button onClick={onClose} className="text-xs text-muted hover:text-fg">
        ← Санал руу буцах
      </button>

      <div className="flex gap-3">
        <HeroThumb hero={h} width={96} className="w-24 shrink-0 rounded" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold uppercase leading-tight">{h.name}</h3>
          <p className="truncate text-[11px] text-muted">
            <span className={`font-semibold ${ATTR_COLOR[h.attr]}`}>{ATTR_LABEL[h.attr]}</span> ·{" "}
            {h.roles.map((r) => ROLE_LABEL[r] ?? r).join(", ")}
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2 text-xs">
            <span>
              Ялалт <span className="font-semibold tabular-nums">{data.winrate[hero].toFixed(1)}%</span>
            </span>
            <Link href={`/heroes/${h.slug}`} className="text-gold hover:underline">
              Дэлгэрэнгүй →
            </Link>
          </p>
        </div>
      </div>

      {actions}

      {(enemies.length > 0 || allies.length > 0) && !taken.has(hero) && (
        <Section title="Энэ драфтад" hint="Эсрэг баатрын эсрэг давуу тал, манай баатруудтай хамтрах нэмэгдэл">
          <div className="flex flex-wrap gap-1">
            {enemies.map((e) => (
              <HeroChip key={`e${e}`} data={data} hero={e} value={data.vs[hero][e]} onSelect={onSelect} />
            ))}
            {allies.map((a) => (
              <HeroChip key={`a${a}`} data={data} hero={a} value={data.with[hero][a]} onSelect={onSelect} />
            ))}
          </div>
        </Section>
      )}

      <div>
        <div className="flex border-b border-line text-sm" role="tablist">
          {TABS.map(([t, label]) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 transition ${
                tab === t ? "border-b-2 border-gold font-semibold text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-3">
          {tab === "counter" && (
            <div className="grid grid-cols-2 gap-3">
              <Section title="Good against" hint={`${h.name} эдгээрийг ялдаг`}>
                {list(beats)}
              </Section>
              <Section title="Counter heroes" hint={`${h.name}-ийн эсрэг сонгоход сайн`}>
                {list(losesTo)}
              </Section>
            </div>
          )}

          {tab === "synergy" && (
            <div className="grid grid-cols-2 gap-3">
              <Section title="Synergy" hint={`${h.name}-тэй сайн хамтардаг`}>
                {list(synergy)}
              </Section>
              <Section title="Similar heroes" hint="Ижил үүрэгтэй">
                {list(similar.map((s) => ({ hero: s })))}
              </Section>
            </div>
          )}

          {tab === "items" &&
            (counterItems.length ? (
              <Section title={`${h.name}-ийн эсрэг авах item`}>
                <ul className="space-y-1.5">
                  {counterItems.map((c) => {
                    const it = data.items[c.item];
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
            ) : (
              <p className="text-xs text-muted">Мэдээлэл алга</p>
            ))}
        </div>
      </div>
    </section>
  );
}
