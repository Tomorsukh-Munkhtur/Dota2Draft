"use client";

import { useActionState } from "react";
import { saveItem } from "@/app/admin/actions";
import type { NewsItem } from "@/lib/newsStore";

export default function EditForm({ item }: { item: NewsItem }) {
  const [state, run, pending] = useActionState(saveItem.bind(null, item.id), null);
  const field = "w-full rounded border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-gold";
  return (
    <form action={run} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-xs text-muted">Гарчиг</span>
        <input name="titleMn" defaultValue={item.titleMn ?? ""} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Товч агуулга (картан дээр харагдана)</span>
        <textarea name="summaryMn" defaultValue={item.summaryMn ?? ""} rows={3} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Агуулга (Markdown)</span>
        <textarea name="bodyMn" defaultValue={item.bodyMn ?? ""} rows={24} className={`${field} font-mono text-xs`} />
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {state?.ok && <span className="text-sm text-good">{state.ok}</span>}
        {state?.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}
