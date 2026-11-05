"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; match: (path: string) => boolean };

const LINKS: NavItem[] = [
  { href: "/heroes", label: "Баатрууд", match: (p) => p.startsWith("/heroes") },
  { href: "/items", label: "Items", match: (p) => p.startsWith("/items") && !p.startsWith("/items/neutral") },
  { href: "/items/neutral", label: "Neutral items", match: (p) => p.startsWith("/items/neutral") },
  { href: "/news", label: "Мэдээ", match: (p) => p.startsWith("/news") },
];

function SwordsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2" />
    </svg>
  );
}

/** Үндсэн цэс. pathname=null үед (Suspense fallback) идэвхтэй цэсгүй харагдана. */
export function MainNav({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Үндсэн цэс" className="min-w-0">
      <ul className="flex items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] sm:gap-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        <li className="mr-1 shrink-0 sm:mr-2">
          <Link href="/draft" className="btn-draft text-sm" aria-current={pathname?.startsWith("/draft") ? "page" : undefined}>
            <span>
              <SwordsIcon />
              Драфт эхлүүлэх
            </span>
          </Link>
        </li>
        {LINKS.map((item) => {
          const active = pathname !== null && item.match(pathname);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative block whitespace-nowrap px-3 py-2 font-display text-sm font-semibold uppercase tracking-wide transition ${
                  active ? "text-white" : "text-fg/60 hover:text-white"
                }`}
              >
                {item.label}
                {/* Идэвхтэй цэсний доорх гэрэлтсэн зураас. */}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-radiant via-int to-dire shadow-[0_0_10px_rgba(74,174,232,0.8)] transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ActiveMainNav() {
  return <MainNav pathname={usePathname()} />;
}

/** Гар утсанд драфт руу үргэлж харагдах товч (драфт хуудсан дээр нуугдана). */
export function MobileDraftButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/draft")) return null;
  return (
    <Link href="/draft" aria-label="Драфт эхлүүлэх" className="btn-draft fixed bottom-4 right-4 z-50 lg:hidden">
      <span className="!px-4 !py-3">
        <SwordsIcon className="h-5 w-5" />
        Драфт
      </span>
    </Link>
  );
}
