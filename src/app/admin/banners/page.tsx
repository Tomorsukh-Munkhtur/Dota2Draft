import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ActionButton from "@/components/admin/ActionButton";
import BannerForm from "@/components/admin/BannerForm";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { listBanners } from "@/lib/banners";
import { getSupabase } from "@/lib/supabase";
import { moveBanner, removeBanner, setBannerActive } from "../actions";

export const metadata: Metadata = { title: "Баннер", robots: { index: false } };

async function Content() {
  if (!(await isAdmin())) return <LoginForm />;
  if (!getSupabase())
    return <p className="rounded-lg border border-line bg-panel p-4 text-sm">Баннер хадгалахад Supabase тохируулсан байх хэрэгтэй.</p>;

  let banners: Awaited<ReturnType<typeof listBanners>> = [];
  let error: string | null = null;
  try {
    banners = await listBanners();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Нүүр хуудасны слайд (баннер)</h1>
      <p className="text-sm text-muted">
        Идэвхтэй баннер байвал нүүрний слайдад зөвхөн тэдгээр харагдана. Бүгдийг нуувал автомат слайдууд (драфт, патч,
        мэдээ, баатар, item) буцаж гарна. Зургийн тохиромжтой хэмжээ: 1600×600 орчим, 4MB хүртэл.
      </p>
      {error && (
        <p className="rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm">
          Баннерын хүснэгт олдсонгүй: <code>supabase/migrations/0002_banners_patch_translations.sql</code>-ийг Supabase-ийн
          SQL Editor дээр ажиллуулна уу. <span className="text-muted">({error})</span>
        </p>
      )}

      <section className="space-y-3 rounded-lg border border-line bg-panel p-4">
        <h2 className="font-bold">Шинэ баннер</h2>
        <BannerForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">Баннерууд ({banners.length})</h2>
        {banners.length === 0 && (
          <p className="text-sm text-muted">Баннер алга — нүүр хуудсанд автомат слайдууд харагдана.</p>
        )}
        {banners.map((b, i) => (
          <div key={b.id} className={`flex flex-wrap gap-4 rounded-lg border border-line bg-panel p-3 ${b.active ? "" : "opacity-60"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt="" className="h-24 w-48 rounded object-cover" />
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <p className="font-semibold">{b.title || <span className="text-muted">(гарчиггүй)</span>}</p>
              {b.subtitle && <p className="text-muted">{b.subtitle}</p>}
              {b.linkUrl && (
                <p className="text-xs text-muted">
                  → {b.linkUrl} {b.buttonLabel && `(${b.buttonLabel})`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <ActionButton action={moveBanner.bind(null, b.id, -1)} label="↑" pendingLabel="…" className="bg-panel-2 ring-1 ring-line" />
              <ActionButton action={moveBanner.bind(null, b.id, 1)} label="↓" pendingLabel="…" className="bg-panel-2 ring-1 ring-line" />
              <ActionButton
                action={setBannerActive.bind(null, b.id, !b.active)}
                label={b.active ? "Нуух" : "Харуулах"}
                pendingLabel="…"
                className="bg-panel-2 ring-1 ring-line"
              />
              <ActionButton
                action={removeBanner.bind(null, b.id)}
                label="Устгах"
                pendingLabel="…"
                confirm="Энэ баннерыг бүр мөсөн устгах уу?"
                className="text-bad ring-1 ring-bad/40"
              />
            </div>
            <span className="w-full text-[11px] text-muted">Дараалал #{i + 1}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function BannersPage() {
  return (
    <div className="mx-auto max-w-[1000px] space-y-4 px-4 py-6">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Админ
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}
