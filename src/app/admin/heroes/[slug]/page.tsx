import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { saveHeroContent } from "@/app/admin/actions";
import {
  CounterItemsEditor,
  OptionListEditor,
  StringListEditor,
  TextFieldEditor,
} from "@/components/admin/ContentEditor";
import LoginForm from "@/components/admin/LoginForm";
import PatchTranslationEditor, { type EditorLine } from "@/components/admin/PatchTranslationEditor";
import { isAdmin } from "@/lib/admin";
import { readHeroContentFile } from "@/lib/content";
import { readData } from "@/lib/data";
import { getHeroContentOverrides } from "@/lib/heroContentStore";
import { getHero, getHeroes, getHeroKit, getItems } from "@/lib/heroes";
import { getPatchTranslationOverrides } from "@/lib/patch";

export const metadata: Metadata = { title: "Баатрын контент засах", robots: { index: false } };

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

async function Editor({ slug }: { slug: string }) {
  if (!(await isAdmin())) return <LoginForm />;
  const hero = getHero(slug);
  if (!hero) notFound();

  const [original, overrides, trOverrides] = await Promise.all([
    readHeroContentFile(slug),
    getHeroContentOverrides(),
    getPatchTranslationOverrides(),
  ]);
  const o = overrides[slug] ?? {};
  const save = saveHeroContent.bind(null, slug);
  const loreEn = readData<Record<string, string>>("lore_en.json", {})[slug] ?? "";
  const kit = getHeroKit(slug);
  const machine = readData<Record<string, string>>("abilities-mn.json", {});
  // Шинээр гарсан мөрийн Google санал (админ батлах хүртэл сайтад англиар).
  const suggest = readData<Record<string, string>>("abilities-mn-suggest.json", {});
  const itemOptions = Object.values(getItems())
    .filter((it) => it.kind === "shop")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((it) => ({ value: it.key, label: `${it.name} (${it.cost})` }));
  const heroOptions = [...getHeroes()]
    .filter((h) => h.slug !== slug)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((h) => ({ value: h.slug, label: h.name }));

  // Skill бүрийн орчуулах мөрүүд. Ижил мөр өөр skill-д давтагдвал эхнийхэд нь л харуулна (орчуулга нь нэг).
  const seen = new Set<string>();
  const line = (en: string, context: string): EditorLine[] => {
    if (!en || seen.has(en)) return [];
    seen.add(en);
    return [
      {
        en,
        mn: trOverrides[en] ?? machine[en] ?? suggest[en] ?? "",
        edited: en in trOverrides,
        inBaseline: en in machine,
        context,
      },
    ];
  };
  const abilityGroups = (kit?.abilities ?? []).map((a) => ({
    a,
    lines: [
      ...lines(a.desc).flatMap((l) => line(l, "Тайлбар")),
      ...a.values.flatMap((v) => line(v.label, "Үзүүлэлтийн нэр")),
      ...lines(a.scepter).flatMap((l) => line(l, "Aghanim's Scepter")),
      ...lines(a.shard).flatMap((l) => line(l, "Aghanim's Shard")),
      ...a.notes.flatMap((n) => lines(n).flatMap((l) => line(l, "Нэмэлт тэмдэглэл"))),
    ],
  }));
  const talentLines = (kit?.talents ?? []).flatMap((t) => t.options.flatMap((op) => line(op, `${t.level}-р түвшин`)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Image src={hero.img} alt="" width={128} height={72} className="h-[72px] w-32 rounded-lg object-cover" />
        <div>
          <h1 className="text-2xl font-bold">{hero.name}</h1>
          <Link href={`/heroes/${slug}`} target="_blank" className="text-sm text-gold hover:underline">
            Сайт дээр харах ↗
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {[
          ["#general", "Тойм, түүх"],
          ["#skills", "Skill"],
          ["#talents", "Талант"],
          ["#counter", "Эсрэг item, зөвлөгөө"],
          ["#similar", "Similar heroes"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full px-3 py-1 text-muted ring-1 ring-line hover:text-fg">
            {label}
          </a>
        ))}
      </nav>

      <div id="general" className="scroll-mt-24 space-y-4">
        <TextFieldEditor
          save={save}
          field="summary"
          title="Товч тойм"
          original={original.summary}
          value={o.summary ?? null}
          rows={3}
        />
        <TextFieldEditor
          save={save}
          field="lore"
          title="Түүх"
          original={original.lore}
          value={o.lore ?? null}
          rows={12}
          reference={{ label: "Англи эх (Valve)", text: loreEn }}
        />
      </div>

      <section id="skills" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Skill-ийн орчуулга</h2>
          <p className="text-sm text-muted">
            Зүүн талд Valve-ийн англи эх, баруун талд монгол орчуулга. Хоосон хадгалбал машин орчуулга руу буцна. Ижил
            мөр (жишээ нь &quot;DAMAGE&quot;) бусад баатарт ч мөн адил засагдана.
          </p>
        </div>
        {abilityGroups.map(({ a, lines: ls }) => (
          <div key={a.id} className="rounded-lg border border-line bg-panel p-4">
            <div className="mb-1 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.img} alt="" width={40} height={40} className="h-10 w-10 rounded" />
              <h3 className="font-semibold">{a.name}</h3>
            </div>
            {ls.length ? (
              <PatchTranslationEditor lines={ls} showFilter={false} />
            ) : (
              <p className="text-sm text-muted">Орчуулах мөр алга.</p>
            )}
          </div>
        ))}
      </section>

      <section id="talents" className="scroll-mt-24 rounded-lg border border-line bg-panel p-4">
        <h2 className="mb-1 font-semibold">Талант</h2>
        {talentLines.length ? (
          <PatchTranslationEditor lines={talentLines} showFilter={false} />
        ) : (
          <p className="text-sm text-muted">Орчуулах мөр алга.</p>
        )}
      </section>

      <div id="counter" className="scroll-mt-24 space-y-4">
        <CounterItemsEditor
          save={save}
          original={original.counterItems}
          value={o.counterItems ?? null}
          options={itemOptions}
        />
        <StringListEditor
          save={save}
          field="counterTips"
          title="Эсрэг нь яаж тоглох вэ"
          addLabel="Зөвлөгөө нэмэх"
          original={original.counterTips}
          value={o.counterTips ?? null}
        />
      </div>

      <div id="similar" className="scroll-mt-24">
        <OptionListEditor
          save={save}
          field="similar"
          title="Similar heroes"
          addLabel="Баатар нэмэх"
          placeholder="Баатар сонгох"
          original={original.similar}
          value={o.similar ?? null}
          options={heroOptions}
        />
      </div>
    </div>
  );
}

export default function AdminHeroPage({ params }: PageProps<"/admin/heroes/[slug]">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-6">
      <Link href="/admin/heroes" className="text-sm text-muted hover:text-fg">
        ← Бүх баатар
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        {params.then(({ slug }) => (
          <Editor slug={slug} />
        ))}
      </Suspense>
    </div>
  );
}
