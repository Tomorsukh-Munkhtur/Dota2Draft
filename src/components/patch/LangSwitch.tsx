"use client";

import { useState, type ReactNode } from "react";

/**
 * Патчийн хуудасны Монгол/English сэлгүүр. Мөр бүр хоёр хэлээрээ сервер дээр зурагдсан
 * (.tr-mn, .tr-en), энд зөвхөн аль нь харагдахыг data-lang-аар сольно.
 */
export default function LangSwitch({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const btn = (value: "mn" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={`px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide transition ${
        lang === value ? "bg-int/25 text-white" : "text-fg/55 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div data-lang={lang} className="space-y-8">
      <div className="z-30 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/[0.06] bg-[#07090d]/85 px-4 py-2 backdrop-blur-xl lg:sticky lg:top-[72px]">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <div className="clip-gaming-sm flex shrink-0 bg-white/5 ring-1 ring-inset ring-white/10" role="group" aria-label="Хэл">
          {btn("mn", "Монгол")}
          {btn("en", "English")}
        </div>
      </div>
      {children}
    </div>
  );
}
