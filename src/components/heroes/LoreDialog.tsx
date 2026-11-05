"use client";

import { useRef, type ReactNode } from "react";

/** "Түүх унших" товч — баатрын түүхийг дэлгэцийн дунд цонхоор нээнэ. */
export default function LoreDialog({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={`btn-ghost clip-gaming-sm text-sm ${className}`}>
        Түүх унших
      </button>
      <dialog
        ref={ref}
        // Цонхны гадна (backdrop) дарахад хаагдана.
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(720px,calc(100vw-2rem))] rounded-xl border border-line bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-gold">{title}</h2>
          <button type="button" onClick={() => ref.current?.close()} className="text-muted hover:text-fg" aria-label="Хаах">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </dialog>
    </>
  );
}
