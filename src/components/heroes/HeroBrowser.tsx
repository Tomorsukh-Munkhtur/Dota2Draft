"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ATTRS, ATTR_COLOR, ATTR_LABEL, ROLE_LABEL, type Attr } from "@/lib/labels";

export type BrowserHero = {
  slug: string;
  name: string;
  attr: Attr;
  roles: string[];
  img: string;
  winrate: number;
};

export default function HeroBrowser({ heroes }: { heroes: BrowserHero[] }) {
  const [query, setQuery] = useState("");
  const [attr, setAttr] = useState<Attr | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const shown = heroes.filter(
    (h) =>
      (!q || h.name.toLowerCase().includes(q)) &&
      (!attr || h.attr === attr) &&
      (!role || h.roles.includes(role)),
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active ? "border-gold bg-gold/15 text-gold" : "border-line text-muted hover:text-fg"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Баатар хайх…"
          className="w-full max-w-xs rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <button className={chip(!attr)} onClick={() => setAttr(null)}>
          Бүгд
        </button>
        {ATTRS.map((a) => (
          <button key={a} className={chip(attr === a)} onClick={() => setAttr(attr === a ? null : a)}>
            <span className={ATTR_COLOR[a]}>●</span> {ATTR_LABEL[a]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(ROLE_LABEL).map(([key, label]) => (
          <button key={key} className={chip(role === key)} onClick={() => setRole(role === key ? null : key)}>
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">{shown.length} баатар</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {shown.map((h) => (
          <Link
            key={h.slug}
            href={`/heroes/${h.slug}`}
            className="group overflow-hidden rounded-lg border border-line bg-panel transition hover:-translate-y-0.5 hover:border-gold/60"
          >
            <Image src={h.img} alt={h.name} width={256} height={144} className="aspect-video w-full object-cover" />
            <div className="p-2">
              <p className="truncate text-sm font-semibold group-hover:text-gold">{h.name}</p>
              <p className="flex justify-between text-[11px] text-muted">
                <span className={ATTR_COLOR[h.attr]}>{ATTR_LABEL[h.attr]}</span>
                <span className="tabular-nums">{h.winrate.toFixed(1)}%</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
