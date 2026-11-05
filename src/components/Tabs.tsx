"use client";

import { useState, type ReactNode } from "react";

export type TabItem = { key: string; label: string; content: ReactNode };

/**
 * Хавтас маягийн табтай карт. Бүх табын агуулга сервер дээр зурагдаж DOM-д үлдэнэ (хайлт, SEO),
 * сонгоогүйг нь hidden болгоно.
 */
export default function Tabs({ tabs, className = "" }: { tabs: TabItem[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.key);
  return (
    <section className={`flex flex-col ${className}`}>
      <div className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-t-md border px-3 py-1.5 text-sm transition ${
                on
                  ? "relative z-10 border-line border-b-panel bg-panel font-semibold text-gold"
                  : "border-transparent bg-white/[0.03] text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 rounded-b-lg rounded-tr-lg border border-line bg-panel p-4">
        {tabs.map((t) => (
          <div key={t.key} role="tabpanel" hidden={t.key !== active}>
            {t.content}
          </div>
        ))}
      </div>
    </section>
  );
}
