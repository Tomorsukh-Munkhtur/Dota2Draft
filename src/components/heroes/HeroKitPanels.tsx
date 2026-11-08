"use client";

import { useState } from "react";
import type { HeroKit } from "@/lib/heroes";
import AbilityIcon from "./AbilityIcon";
import { Ability, TalentTree } from "./HeroKitView";

type Lang = "mn" | "en";

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex overflow-hidden rounded ring-1 ring-line" role="group" aria-label="Хэл">
      {(
        [
          ["mn", "Монгол"],
          ["en", "English"],
        ] as [Lang, string][]
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setLang(value)}
          aria-pressed={lang === value}
          className={`px-2 py-0.5 text-[11px] font-semibold transition ${
            lang === value ? "bg-int/25 text-white" : "text-muted hover:text-fg"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Баатрын "Талант" ба "Чадварууд" хоёр карт (эцэг grid-д хоёр нүд болж орно). Skill-ийг зургаар нь сонгож
 * нэг нэгээр харуулна. Монгол/English сэлгүүр хоёр картад нэгэн зэрэг үйлчилнэ.
 */
export default function HeroKitPanels({ kitMn, kitEn, patch }: { kitMn: HeroKit; kitEn: HeroKit; patch: string | null }) {
  const [lang, setLang] = useState<Lang>("mn");
  const [index, setIndex] = useState(0);
  const kit = lang === "mn" ? kitMn : kitEn;
  const ability = kit.abilities[index] ?? kit.abilities[0];
  const hasTalents = kit.talents.some((t) => t.options.length);

  return (
    <>
      <section className="order-2 rounded-lg border border-line bg-panel p-4 lg:order-1">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Талант</h2>
        {hasTalents ? <TalentTree kit={kit} /> : <p className="text-sm text-muted">Мэдээлэл алга</p>}
      </section>

      <section className="order-1 rounded-lg border border-line bg-panel p-4 lg:order-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Чадварууд (skill)</h2>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-muted sm:inline">
              {lang === "mn" ? "Монгол орчуулга" : `Valve-ийн албан ёсны тайлбар · патч ${patch ?? "?"}`}
            </span>
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Чадварууд">
          {kit.abilities.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              title={a.name}
              onClick={() => setIndex(i)}
              className={`rounded transition ${
                i === index ? "ring-2 ring-gold" : "opacity-60 ring-1 ring-line hover:opacity-100"
              }`}
            >
              <AbilityIcon src={a.img} name={a.name} />
            </button>
          ))}
        </div>

        {ability && (
          <div className="rounded-lg border border-line bg-bg/40 p-4" role="tabpanel" lang={lang === "en" ? "en" : undefined}>
            <Ability a={ability} showIcon={false} />
          </div>
        )}
      </section>
    </>
  );
}
