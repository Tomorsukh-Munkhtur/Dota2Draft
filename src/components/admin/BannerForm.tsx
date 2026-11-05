"use client";

import { useActionState, useRef } from "react";
import { createBanner } from "@/app/admin/actions";

export default function BannerForm() {
  const form = useRef<HTMLFormElement>(null);
  const [state, run, pending] = useActionState(async (prev: Awaited<ReturnType<typeof createBanner>>, data: FormData) => {
    const result = await createBanner(prev, data);
    if (result?.ok) form.current?.reset();
    return result;
  }, null);
  const field = "w-full rounded border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-gold";
  return (
    <form ref={form} action={run} className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 sm:col-span-2">
        <span className="text-xs text-muted">Зураг * — өргөн хэлбэртэй (ж: 1600×600), 4MB хүртэл</span>
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className={`${field} file:mr-3 file:rounded file:border-0 file:bg-panel-2 file:px-3 file:py-1 file:text-fg`} />
        <span className="block text-[11px] text-muted">эсвэл зургийн холбоос:</span>
        <input name="imageUrl" type="url" placeholder="https://..." className={field} />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted">Гарчиг</span>
        <input name="title" className={field} placeholder="ж: 7.41f патч гарлаа" />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted">Дэд тайлбар</span>
        <input name="subtitle" className={field} />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted">Холбоос (дарахад очих хаяг)</span>
        <input name="linkUrl" className={field} placeholder="/draft эсвэл https://..." />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted">Товчны бичиг</span>
        <input name="buttonLabel" className={field} placeholder="ж: Дэлгэрэнгүй" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button disabled={pending} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Байршуулж байна…" : "Баннер нэмэх"}
        </button>
        {state?.ok && <span className="text-sm text-good">{state.ok}</span>}
        {state?.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}
