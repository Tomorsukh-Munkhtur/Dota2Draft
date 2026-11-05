import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Item } from "@/lib/heroes";

const ICONS = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons";
// Neutral item-ийн түвшний өнгө (тоглоомынхтой ойролцоо).
const TIER_RGB = ["", "189,189,189", "95,191,90", "74,174,232", "166,107,219", "227,145,60"];
const SHOP_RGB = "227,180,92";
const ENCHANT_RGB = "166,107,219";

function Chip({ icon, children, label }: { icon: ReactNode; children: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 ring-1 ring-inset ring-white/10 backdrop-blur">
      {icon}
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p className="font-display text-base font-bold tabular-nums text-white">{children}</p>
      </div>
    </div>
  );
}

/** Item-ийн хуудасны толгой: бүдэг дэвсгэр, төрлийн өнгөт гэрэл, том зураг, нэр, үнэ/cooldown/мана. */
export default function ItemHeader({
  item,
  kindLabel,
  summary,
  patch,
  back,
}: {
  item: Item;
  kindLabel: string;
  summary?: string;
  patch: string | null;
  back: { href: string; label: string };
}) {
  const rgb =
    item.kind === "neutral" ? (TIER_RGB[item.tier ?? 0] ?? SHOP_RGB) : item.kind === "enchantment" ? ENCHANT_RGB : SHOP_RGB;
  return (
    <header className="relative isolate overflow-hidden rounded-2xl bg-[#0b0f16] ring-1 ring-white/10">
      {/* Дэвсгэр: item-ийн зургийг бүдгэрүүлж, төрлийн өнгөөр гэрэлтүүлнэ. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.img}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full scale-150 object-cover opacity-35 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: `radial-gradient(45% 90% at 15% 50%, rgba(${rgb},0.35), transparent 70%)` }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-[#07090d]/60 to-[#07090d]/90" />
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-5 right-4 -z-10 hidden select-none whitespace-nowrap font-display text-[7rem] font-extrabold uppercase leading-none text-white/[0.03] lg:block"
      >
        {item.name}
      </p>

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="relative shrink-0 self-center">
          <div aria-hidden className="absolute -inset-6 rounded-full blur-2xl" style={{ background: `rgba(${rgb},0.35)` }} />
          <Image
            src={item.img}
            alt={item.name}
            width={176}
            height={128}
            priority
            className="relative h-32 w-44 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-2 ring-white/20"
          />
          {item.kind === "neutral" && item.tier && (
            <span
              className="clip-gaming-sm absolute -right-2 -top-2 px-2 py-0.5 font-display text-xs font-extrabold text-black"
              style={{ background: `rgb(${rgb})` }}
            >
              T{item.tier}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <nav aria-label="Замын мөр" className="text-xs text-muted">
            <Link href={back.href} className="hover:text-fg">
              {back.label}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-fg/80">{item.name}</span>
          </nav>

          <p
            className="clip-gaming-sm inline-block bg-white/[0.07] px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/10"
            style={{ color: `rgb(${rgb})` }}
          >
            {kindLabel}
          </p>

          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-wide text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-6xl">
            {item.name}
          </h1>

          <div className="flex flex-wrap gap-2">
            {item.cost > 0 && (
              <Chip label="Үнэ" icon={<Image src={`${ICONS}/gold.png`} alt="" width={20} height={20} className="h-5 w-5" />}>
                <span className="text-gold">{item.cost}</span>
              </Chip>
            )}
            {item.cooldown && (
              <Chip
                label="Cooldown"
                icon={<Image src={`${ICONS}/cooldown.png`} alt="" width={20} height={20} className="h-5 w-5" />}
              >
                {item.cooldown}с
              </Chip>
            )}
            {item.manaCost && (
              <Chip label="Мана" icon={<span className="h-4 w-4 rounded-sm bg-gradient-to-br from-[#5bc0ff] to-[#1b5fae]" />}>
                <span className="text-int">{item.manaCost}</span>
              </Chip>
            )}
            {patch && (
              <Chip label="Патч" icon={<span className="h-2 w-2 rounded-full bg-gold" />}>
                {patch}
              </Chip>
            )}
          </div>

          {summary && <p className="max-w-3xl text-sm leading-relaxed text-fg/85">{summary}</p>}
        </div>
      </div>
    </header>
  );
}
