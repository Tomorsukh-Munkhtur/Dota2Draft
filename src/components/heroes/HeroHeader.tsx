import Link from "next/link";
import type { ReactNode } from "react";
import { ATTACK_LABEL, ATTR_COLOR, ATTR_LABEL, ROLE_LABEL, type Hero } from "@/lib/heroes";
import LoreDialog from "./LoreDialog";

const CDN = "https://cdn.cloudflare.steamstatic.com/apps/dota2";
const ATTR_ICON = { str: "strength", agi: "agility", int: "intelligence", all: "universal" } as const;
// Атрибутын өнгөөр гэрэлтэх дэвсгэр.
const ATTR_GLOW = {
  str: "rgba(236,106,76,0.45)",
  agi: "rgba(71,201,122,0.4)",
  int: "rgba(74,174,232,0.45)",
  all: "rgba(214,167,74,0.4)",
} as const;
const COMPLEXITY = ["", "Тоглоход хялбар", "Дунд зэрэг", "Тоглоход хэцүү"];

type Props = {
  hero: Hero;
  summary: string;
  winrate: number;
  pickRate: number;
  patch: string | null;
  /** "Түүх унших" цонхны агуулга. */
  lore: ReactNode;
};

function Stat({ label, value, sub, tone, title }: { label: string; value: ReactNode; sub?: string; tone?: string; title?: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5" title={title}>
      <dt className={`truncate text-[10px] font-semibold uppercase tracking-wider ${tone ?? "text-muted"}`}>{label}</dt>
      <dd className="font-display text-base font-bold tabular-nums text-white">
        {value}
        {sub && <span className="ml-1 text-xs font-semibold text-good">{sub}</span>}
      </dd>
    </div>
  );
}

/** Баатрын хуудасны толгой: бүдэг дэвсгэр, атрибутын өнгөт гэрэл, том нэр, хөдөлгөөнт зураг, үзүүлэлтийн зурвас. */
export default function HeroHeader({ hero, summary, winrate, pickRate, patch, lore }: Props) {
  const s = hero.stats;
  return (
    <header className="relative isolate overflow-hidden rounded-2xl bg-[#0b0f16] ring-1 ring-white/10">
      {/* Дэвсгэр: баатрын зургийг бүдгэрүүлж, атрибутын өнгөөр гэрэлтүүлнэ. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hero.img}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-30 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: `radial-gradient(60% 80% at 78% 45%, ${ATTR_GLOW[hero.attr]}, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07090d]/60 via-transparent to-[#07090d] lg:bg-gradient-to-r lg:from-[#07090d] lg:via-[#07090d]/80 lg:to-transparent"
      />
      {/* Том бүдэг нэр (чимэглэл). */}
      <p
        aria-hidden
        className="pointer-events-none absolute -right-4 bottom-16 -z-10 hidden select-none whitespace-nowrap font-display text-[8.5rem] font-extrabold uppercase leading-none text-white/[0.025] lg:block"
      >
        {hero.name}
      </p>

      <div className="relative">
        {/* Хөдөлгөөнт зураг: утсанд дээр, том дэлгэцэнд баруун талд. */}
        <video
          className="mx-auto h-56 w-full object-contain sm:h-72 lg:absolute lg:bottom-0 lg:right-0 lg:h-[115%] lg:w-[55%] lg:object-bottom"
          src={`${CDN}/videos/dota_react/heroes/renders/${hero.slug}.webm`}
          poster={hero.img}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="relative space-y-4 p-6 sm:p-8 lg:max-w-[52%] lg:py-10">
          <nav aria-label="Замын мөр" className="text-xs text-muted">
            <Link href="/heroes" className="hover:text-fg">
              Баатрууд
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-fg/80">{hero.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider">
            <span className={`flex items-center gap-1.5 ${ATTR_COLOR[hero.attr]}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${CDN}/images/dota_react/icons/hero_${ATTR_ICON[hero.attr]}.png`} alt="" className="h-5 w-5" />
              {ATTR_LABEL[hero.attr]}
            </span>
            <span className="text-fg/60">{ATTACK_LABEL[hero.attackType] ?? hero.attackType}</span>
            {hero.complexity ? (
              <span className="flex items-center gap-1 text-fg/60" title={COMPLEXITY[hero.complexity]}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`h-2 w-2 rotate-45 ${n <= (hero.complexity ?? 0) ? "bg-gold" : "bg-white/15"}`}
                  />
                ))}
                <span className="ml-1">{COMPLEXITY[hero.complexity]}</span>
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-wide text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl">
            {hero.name}
          </h1>

          <div className="flex flex-wrap gap-1.5">
            {hero.roles.map((r) => (
              <span
                key={r}
                className="clip-gaming-sm bg-white/[0.07] px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-fg/80 ring-1 ring-inset ring-white/10"
              >
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>

          {summary && <p className="max-w-xl text-sm leading-relaxed text-fg/85">{summary}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex divide-x divide-white/10 rounded-lg bg-black/35 ring-1 ring-white/10 backdrop-blur">
              <div className="px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted">Ялалтын хувь</p>
                <p className={`font-display text-xl font-extrabold tabular-nums ${winrate >= 50 ? "text-good" : "text-bad"}`}>
                  {winrate.toFixed(1)}%
                </p>
              </div>
              <div className="px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted">Сонгогдох хувь</p>
                <p className="font-display text-xl font-extrabold tabular-nums">{pickRate.toFixed(1)}%</p>
              </div>
              {patch && (
                <div className="px-4 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted">Патч</p>
                  <p className="font-display text-xl font-extrabold text-gold">{patch}</p>
                </div>
              )}
            </div>
            <LoreDialog title={`${hero.name} — түүх`}>{lore}</LoreDialog>
          </div>
        </div>
      </div>

      {/* Үндсэн үзүүлэлт (1-р түвшинд) */}
      <dl className="relative grid grid-cols-2 divide-white/[0.06] border-t border-white/10 bg-black/45 backdrop-blur sm:grid-cols-5 sm:divide-x lg:grid-cols-10">
        <Stat label="Strength" value={s.str} sub={`+${s.strGain}`} tone="text-str" />
        <Stat label="Agility" value={s.agi} sub={`+${s.agiGain}`} tone="text-agi" />
        <Stat label="Intelligence" value={s.int} sub={`+${s.intGain}`} tone="text-int" />
        <Stat label="HP" value={s.health} tone="text-good" />
        <Stat label="Мана" value={s.mana} tone="text-int" />
        <Stat label="Хуяг" value={s.armor} />
        <Stat label="Довтолгоо" value={`${s.attackMin}–${s.attackMax}`} />
        <Stat label="Зай" value={s.attackRange} title="Довтолгооны зай" />
        <Stat label="Хурд" value={s.moveSpeed} title="Хөдөлгөөний хурд" />
        <Stat label="BAT" value={s.attackRate} title="Суурь довтолгооны хугацаа (Base Attack Time)" />
      </dl>
    </header>
  );
}
