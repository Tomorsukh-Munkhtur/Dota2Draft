import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { getMatchupMeta } from "@/lib/matchups";
import { getGameMeta, shortDate } from "@/lib/patch";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: "Dota 2 Монгол", template: "%s · Dota 2 Монгол" },
  description: "Dota 2-ын драфтын туслах, баатруудын түүх, мэдээ — монгол хэлээр.",
};

const NAV = [
  { href: "/draft", label: "Драфт туслах" },
  { href: "/heroes", label: "Баатрууд" },
  { href: "/items", label: "Item-ууд" },
  { href: "/items/neutral", label: "Neutral item" },
  { href: "/news", label: "Мэдээ" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  const meta = getGameMeta();
  const matchups = getMatchupMeta();
  return (
    <html lang="mn" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4 sm:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-wide">
              <span className="grid h-7 w-7 place-items-center rounded bg-accent text-sm text-white">D2</span>
              <span className="hidden sm:inline">
                Dota 2 <span className="text-gold">Монгол</span>
              </span>
            </Link>
            <nav className="flex gap-1 overflow-x-auto text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="whitespace-nowrap rounded px-2 py-1.5 text-muted transition hover:bg-panel-2 hover:text-fg sm:px-3"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {meta.patch && (
              <span
                title={`Сайтын өгөгдөл Dota 2-ын ${meta.patch} патчийнх (${shortDate(meta.patchDate)})`}
                className="ml-auto hidden shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted md:inline"
              >
                Патч <b className="text-gold">{meta.patch}</b>
              </span>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="space-y-1 border-t border-line py-6 text-center text-xs text-muted">
          {meta.patch && (
            <p>
              Тоглоомын өгөгдөл: патч <b className="text-fg">{meta.patch}</b> ({shortDate(meta.patchDate)}) · сүүлд
              шинэчилсэн {shortDate(meta.gameDataUpdatedAt)} · статистик {shortDate(matchups.to)} хүртэлх тоглолтоор
            </p>
          )}
          <p>Dota 2 нь Valve Corporation-ий бүтээгдэхүүн. Өгөгдөл: dota2.com, OpenDota. Энэ сайт Valve-тэй холбоогүй.</p>
        </footer>
      </body>
    </html>
  );
}
