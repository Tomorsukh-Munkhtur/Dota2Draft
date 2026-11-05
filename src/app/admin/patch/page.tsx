import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import PatchTranslationEditor, { type EditorLine } from "@/components/admin/PatchTranslationEditor";
import { isAdmin } from "@/lib/admin";
import { readData } from "@/lib/data";
import { getHero, getItems } from "@/lib/heroes";
import { getPatch, getPatches, getPatchTranslationOverrides } from "@/lib/patch";

export const metadata: Metadata = { title: "Патчийн орчуулга", robots: { index: false } };

async function Editor({ searchParams }: { searchParams: PageProps<"/admin/patch">["searchParams"] }) {
  if (!(await isAdmin())) return <LoginForm />;
  const { patches, latest } = getPatches();
  const v = (await searchParams).v;
  const version = typeof v === "string" && getPatch(v) ? v : latest;
  const patch = getPatch(version);
  if (!patch) return <p className="text-muted">Патчийн тэмдэглэл алга.</p>;

  const overrides = await getPatchTranslationOverrides();
  const machine = readData<Record<string, string>>("patch-notes-mn.json", {});
  // Шинээр гарсан мөрийн Google санал (админ батлах хүртэл сайтад англиар).
  const suggest = readData<Record<string, string>>("patch-notes-mn-suggest.json", {});
  const items = getItems();
  // Ижил англи мөр олон газар давтагдаж болно — орчуулга нь нэг тул нэг удаа харуулна.
  const seen = new Map<string, EditorLine>();
  const add = (en: string, context: string) => {
    if (!en || seen.has(en)) return;
    seen.set(en, {
      en,
      mn: overrides[en] ?? machine[en] ?? suggest[en] ?? "",
      edited: en in overrides,
      inBaseline: en in machine,
      context,
    });
  };
  // Ерөнхий хэсгийн гарчиг ("Twin Gates" гэх мэт) англиар нь харагддаг тул орчуулахгүй.
  for (const g of patch.general) g.lines.forEach((l) => add(l.t, `Ерөнхий · ${g.title}`));
  for (const h of patch.heroes) {
    const name = getHero(h.slug)?.name ?? h.slug;
    h.lines.forEach((l) => add(l.t, l.a ? `${name} · ${l.a}` : name));
  }
  for (const it of [...patch.items, ...patch.neutralItems]) {
    const name = it.key ? (items[it.key]?.name ?? it.title ?? it.key) : (it.title ?? "Item");
    if (!it.key && it.title) add(it.title, "Item · гарчиг");
    it.lines.forEach((l) => add(l.t, name));
  }
  for (const c of patch.neutralCreeps) c.lines.forEach((l) => add(l.t, c.name));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Патчийн орчуулга</h1>
      <p className="text-sm text-muted">
        Google Translate-ээр автоматаар орчуулсныг энд засна. Засвар тань нэн даруй сайтад гарах бөгөөд дараагийн
        автомат орчуулга үүнийг дарж бичихгүй.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {patches.map((p) => (
          <Link
            key={p.patch}
            href={`/admin/patch?v=${p.patch}`}
            className={`rounded-full px-3 py-1 text-sm ring-1 ${p.patch === version ? "bg-accent text-white ring-accent" : "text-muted ring-line hover:text-fg"}`}
          >
            {p.patch}
          </Link>
        ))}
      </div>
      <PatchTranslationEditor key={version} lines={[...seen.values()]} />
    </div>
  );
}

export default function AdminPatchPage({ searchParams }: PageProps<"/admin/patch">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-6">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Админ
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        <Editor searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
