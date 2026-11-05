import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ActiveNavPill, NavPill } from "@/components/SiteNav";
import { getMatchupMeta } from "@/lib/matchups";
import { getGameMeta, shortDate } from "@/lib/patch";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
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
    <html lang="mn" className={`${inter.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        {/* Зүүн дээд булангийн гэрлийн туяа — доорх агуулгыг бага зэрэг гэрэлтүүлнэ. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-48 -top-56 z-30 h-[620px] w-[820px] rounded-full bg-[radial-gradient(closest-side,rgba(70,100,255,0.38),rgba(120,64,255,0.14)_55%,transparent)] mix-blend-screen blur-2xl"
        />
        <header className="sticky top-0 z-40 bg-gradient-to-b from-bg/90 to-bg/50 backdrop-blur-xl">
          <div className="mx-auto max-w-[1500px] px-4 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:pt-7">
            <div className="flex items-center justify-between gap-3 lg:contents">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight lg:col-start-1 lg:row-start-1 lg:justify-self-start"
              >
                {/* Том дэлгэцэнд лого цэсний дунд байрлана. */}
                <Image src="/logo.webp" alt="" width={32} height={32} priority className="h-8 w-8 lg:hidden" />
                <span>
                  Dota 2 <span className="text-gold">Draft</span>
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-3 sm:gap-5 lg:col-start-3 lg:row-start-1 lg:justify-self-end">
                {meta.patch && (
                  <span
                    title={`Сайтын өгөгдөл Dota 2-ын ${meta.patch} патчийнх (${shortDate(meta.patchDate)})`}
                    className="hidden text-sm text-fg/65 sm:inline"
                  >
                    Патч <b className="text-gold">{meta.patch}</b>
                  </span>
                )}
                <Link
                  href="/draft"
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/25 hover:bg-white/10 sm:px-5 sm:py-2.5"
                >
                  Драфт эхлүүлэх
                </Link>
              </div>
            </div>
            <div className="mt-3 lg:col-start-2 lg:row-start-1 lg:mt-0">
              {/* usePathname динамик хуудсанд Suspense шаарддаг; fallback нь идэвхтэй цэсгүй ижил цэс. */}
              <Suspense fallback={<NavPill pathname={null} />}>
                <ActiveNavPill />
              </Suspense>
            </div>
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
