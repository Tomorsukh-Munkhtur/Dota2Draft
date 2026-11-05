"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; match: (path: string) => boolean };

const LEFT: NavItem[] = [
  { href: "/", label: "Нүүр", match: (p) => p === "/" },
  { href: "/draft", label: "Драфт туслах", match: (p) => p.startsWith("/draft") },
  { href: "/heroes", label: "Баатрууд", match: (p) => p.startsWith("/heroes") },
];

const RIGHT: NavItem[] = [
  { href: "/items", label: "Item-ууд", match: (p) => p.startsWith("/items") && !p.startsWith("/items/neutral") },
  { href: "/items/neutral", label: "Neutral item", match: (p) => p.startsWith("/items/neutral") },
  { href: "/news", label: "Мэдээ", match: (p) => p.startsWith("/news") },
];

function Item({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = pathname !== null && item.match(pathname);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`block whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition lg:px-4 ${
          active ? "bg-white/[0.08] text-white" : "text-fg/65 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    </li>
  );
}

/** Төвийн pill цэс. pathname=null үед (Suspense fallback) идэвхтэй цэсгүй харагдана. */
export function NavPill({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Үндсэн цэс" className="min-w-0">
      <ul className="flex items-center overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {LEFT.map((i) => (
          <Item key={i.href} item={i} pathname={pathname} />
        ))}
        {/* Цэсний дундах лого — pill-ээс дээш цухуйна (зөвхөн том дэлгэцэнд). */}
        <li aria-hidden className="relative hidden w-16 shrink-0 self-stretch lg:block">
          <span className="absolute left-1/2 top-[-26px] grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-white/10 bg-[#0c1017] shadow-[0_0_28px_-2px_rgba(64,140,255,0.55)]">
            <Image src="/logo.webp" alt="" width={36} height={36} className="h-9 w-9" />
          </span>
        </li>
        {RIGHT.map((i) => (
          <Item key={i.href} item={i} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

export function ActiveNavPill() {
  return <NavPill pathname={usePathname()} />;
}
