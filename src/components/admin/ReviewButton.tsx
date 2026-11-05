"use client";

import { useState, useTransition } from "react";
import { markReviewed } from "@/app/admin/actions";

/** "Анхаарах зүйлс"-ийн мөрийг шалгасан гэж тэмдэглэх / буцаах. */
export default function ReviewButton({ reviewKey, undo = false }: { reviewKey: string; undo?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <button
      type="button"
      disabled={pending}
      title={error ?? (undo ? "Дахин анхаарах зүйлс рүү буцаах" : "Шалгасан гэж тэмдэглэх")}
      onClick={() =>
        start(async () => {
          const r = await markReviewed(reviewKey, !undo);
          setError(r?.error ?? null);
        })
      }
      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold transition disabled:opacity-50 ${
        error ? "text-bad ring-1 ring-bad/50" : undo ? "text-muted ring-1 ring-line hover:text-fg" : "text-good ring-1 ring-good/40 hover:bg-good/10"
      }`}
    >
      {pending ? "…" : error ? "Алдаа" : undo ? "Буцаах" : "✓ Шалгасан"}
    </button>
  );
}
