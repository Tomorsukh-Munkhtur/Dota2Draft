"use client";

import Link from "next/link";
import { useState } from "react";
import { SHOP_CATEGORIES } from "@/lib/labels";

export type BrowserItem = {
  key: string;
  name: string;
  cost: number;
  img: string;
  basic: boolean;
  category: string | null;
  summary: string;
};

function ItemCard({ item }: { item: BrowserItem }) {
  return (
    <Link
      href={`/items/${item.key}`}
      className="group flex gap-3 rounded-lg border border-line bg-panel p-2.5 transition hover:border-gold/60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.img} alt="" width={64} height={47} loading="lazy" className="h-[47px] w-16 shrink-0 rounded" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold group-hover:text-gold">{item.name}</p>
        <p className="text-xs text-gold/80 tabular-nums">{item.cost > 0 ? `${item.cost} алт` : "Үнэгүй"}</p>
        {item.summary && <p className="line-clamp-2 text-[11px] text-muted">{item.summary}</p>}
      </div>
    </Link>
  );
}

export default function ItemBrowser({ items }: { items: BrowserItem[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | "basic" | "upgrade">("all");

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (it) =>
      (!q || it.name.toLowerCase().includes(q) || it.summary.toLowerCase().includes(q)) &&
      (group === "all" || (group === "basic") === it.basic),
  );
  const known = new Set<string>(SHOP_CATEGORIES.map((c) => c.key));
  const sections = [
    ...SHOP_CATEGORIES.map((c) => ({ key: c.key, label: c.label, list: shown.filter((it) => it.category === c.key) })),
    { key: "other", label: "Ангилалгүй", list: shown.filter((it) => !it.category || !known.has(it.category)) },
  ].filter((s) => s.list.length);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active ? "border-gold bg-gold/15 text-gold" : "border-line text-muted hover:text-fg"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Item хайх… (нэр эсвэл тайлбараар)"
          className="w-full max-w-xs rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
        />
        {(
          [
            ["all", "Бүгд"],
            ["basic", "Суурь item"],
            ["upgrade", "Нийлмэл item"],
          ] as const
        ).map(([g, label]) => (
          <button key={g} className={chip(group === g)} onClick={() => setGroup(g)}>
            {label}
          </button>
        ))}
        <span className="text-xs text-muted">{shown.length} item</span>
      </div>
      {sections.map((s) => (
        <section key={s.key} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{s.label}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.list.map((it) => (
              <ItemCard key={it.key} item={it} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
