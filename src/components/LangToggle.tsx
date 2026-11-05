"use client";

import { useState, type ReactNode } from "react";

/**
 * Жижиг Монгол/English сэлгүүр. `mn`, `en` хоёулаа сервер дээр зурагдсан; энд аль нь харагдахыг л сольно.
 * `note` нь товчны хажууд харагдах тайлбар (жишээ нь "Машин орчуулга").
 */
export default function LangToggle({ mn, en, note }: { mn: ReactNode; en: ReactNode; note?: ReactNode }) {
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const btn = (value: "mn" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={`px-2 py-0.5 text-[11px] font-semibold transition ${
        lang === value ? "bg-int/25 text-white" : "text-muted hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {note && <span className="text-[11px] text-muted">{note}</span>}
        <div className="flex overflow-hidden rounded ring-1 ring-line" role="group" aria-label="Хэл">
          {btn("mn", "Монгол")}
          {btn("en", "English")}
        </div>
      </div>
      {/* Хоёуланг нь DOM-д үлдээнэ (хайлт, SEO), харагдахгүйг нь hidden болгоно. */}
      <div hidden={lang !== "mn"}>{mn}</div>
      <div hidden={lang !== "en"} lang="en">
        {en}
      </div>
    </div>
  );
}
