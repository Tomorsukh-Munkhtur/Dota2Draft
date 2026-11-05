import type { Metadata } from "next";
import { Exo_2, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ActiveMainNav, MainNav } from "@/components/SiteNav";
import { getMatchupMeta } from "@/lib/matchups";
import { getGameMeta, shortDate } from "@/lib/patch";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

// Гарчиг, товч, цэсэнд ашиглах "gaming" фонт. Монгол Ө, Ү нь cyrillic-ext-д байдаг.
const exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Dota 2 Draft", template: "%s · Dota 2 Draft" },
  applicationName: "Dota 2 Draft",
  description: "Dota 2-ын драфтын туслах, баатар, item-ийн заавар, мэдээ — монгол хэлээр.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const meta = getGameMeta();
  const matchups = getMatchupMeta();
  return (
    <html lang="mn" className={`${inter.variable} ${exo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07090d]/80 backdrop-blur-xl">
          {/* Доод талын өнгөт гэрэлтсэн зураас. */}
          <div
            aria-hidden
            className="absolute inset-x-0 -bottom-px h-px [background-image:linear-gradient(90deg,transparent,rgba(95,191,90,0.55),rgba(74,174,232,0.55),rgba(224,83,63,0.55),transparent)]"
          />
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-1 px-4 pt-2.5 lg:flex-nowrap lg:py-3">
            <Link href="/" className="order-1 flex shrink-0 items-center gap-2.5" aria-label="Dota 2 Draft — нүүр">
              <Image src="/logo.webp" alt="" width={44} height={44} priority className="h-10 w-10 drop-shadow-[0_0_10px_rgba(227,180,92,0.35)] lg:h-11 lg:w-11" />
              <span className="font-display text-[15px] font-extrabold uppercase leading-[1.05] tracking-wider">
                <span className="block text-white">Dota 2</span>
                <span className="block bg-gradient-to-r from-gold to-[#ff8a4c] bg-clip-text text-transparent">Draft</span>
              </span>
            </Link>

            <div className="order-3 -mx-4 w-[calc(100%+2rem)] px-4 pb-1.5 lg:order-2 lg:mx-0 lg:w-auto lg:flex-1 lg:px-0 lg:pb-0">
              {/* usePathname динамик хуудсанд Suspense шаарддаг; fallback нь идэвхтэй цэсгүй ижил цэс. */}
              <Suspense fallback={<MainNav pathname={null} />}>
                <ActiveMainNav />
              </Suspense>
            </div>

            {meta.patch && (
              <Link
                href="/patch"
                title={`Сайтын өгөгдөл Dota 2-ын ${meta.patch} патчийнх (${shortDate(meta.patchDate)}). Дарж өөрчлөлтийг харна уу.`}
                className="clip-gaming-sm order-2 ml-auto flex shrink-0 items-center gap-2 bg-gold/10 px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide text-gold ring-1 ring-inset ring-gold/30 transition hover:bg-gold/20 lg:order-3"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                Патч {meta.patch}
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-10 border-t border-white/[0.06] bg-black/30 py-6 text-center text-xs text-muted">
          <div className="mx-auto max-w-[1500px] space-y-1 px-4">
            {meta.patch && (
              <p>
                Тоглоомын өгөгдөл:{" "}
                <Link href="/patch" className="font-semibold text-gold hover:underline">
                  патч {meta.patch}
                </Link>{" "}
                ({shortDate(meta.patchDate)}) · сүүлд шинэчилсэн {shortDate(meta.gameDataUpdatedAt)} · статистик{" "}
                {shortDate(matchups.to)} хүртэлх тоглолтоор
              </p>
            )}
            <p>Dota 2 нь Valve Corporation-ий бүтээгдэхүүн. Өгөгдөл: dota2.com, OpenDota. Энэ сайт Valve-тэй холбоогүй.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
