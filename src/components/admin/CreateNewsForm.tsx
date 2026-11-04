"use client";

import { useActionState } from "react";
import { createNews } from "@/app/admin/actions";

export default function CreateNewsForm() {
  const [state, run, pending] = useActionState(createNews, null);
  const field = "w-full rounded border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-gold";
  return (
    <form action={run} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-xs text-muted">Гарчиг *</span>
        <input name="titleMn" required className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Товч агуулга (картан дээр харагдана)</span>
        <textarea name="summaryMn" rows={2} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">
          Агуулга * — Markdown: <code>## Гарчиг</code>, <code>**тод**</code>, <code>- жагсаалт</code>,{" "}
          <code>[холбоос](https://...)</code>, <code>![](зургийн холбоос)</code>
        </span>
        <textarea name="bodyMn" required rows={18} className={`${field} font-mono text-xs`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs text-muted">Нүүр зургийн холбоос (заавал биш)</span>
          <input name="image" type="url" placeholder="https://..." className={field} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted">Эх сурвалжийн холбоос (заавал биш)</span>
          <input name="sourceUrl" type="url" placeholder="https://..." className={field} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" defaultChecked />
        Шууд нийтлэх
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Хадгалж байна…" : "Мэдээ нэмэх"}
        </button>
        {state?.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}
