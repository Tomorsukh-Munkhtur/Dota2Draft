import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import PatchTranslationEditor, { type EditorLine } from "@/components/admin/PatchTranslationEditor";
import { isAdmin } from "@/lib/admin";
import { readData } from "@/lib/data";
import { getHero, getHeroes, getHeroKit } from "@/lib/heroes";
import { getPatchTranslationOverrides } from "@/lib/patch";

export const metadata: Metadata = { title: "Skill-ийн орчуулга", robots: { index: false } };

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

async function Editor({ searchParams }: { searchParams: PageProps<"/admin/skills">["searchParams"] }) {
  if (!(await isAdmin())) return <LoginForm />;
  const heroes = [...getHeroes()].sort((a, b) => a.name.localeCompare(b.name));
  const h = (await searchParams).hero;
  const slug = typeof h === "string" && getHero(h) ? h : heroes[0]?.slug;
  const hero = slug ? getHero(slug) : undefined;
  const kit = slug ? getHeroKit(slug) : null;
  if (!hero || !kit) return <p className="text-muted">Баатрын skill-ийн өгөгдөл алга.</p>;

  const overrides = await getPatchTranslationOverrides();
  const machine = readData<Record<string, string>>("abilities-mn.json", {});
  // Ижил англи мөр (жишээ нь "DAMAGE") олон газар давтагддаг — орчуулга нь нэг тул нэг удаа харуулна.
  const seen = new Map<string, EditorLine>();
  const add = (en: string, context: string) => {
    if (!en || seen.has(en)) return;
    seen.set(en, { en, mn: overrides[en] ?? machine[en] ?? "", edited: en in overrides, context });
  };
  for (const a of kit.abilities) {
    lines(a.desc).forEach((l) => add(l, `${a.name} · тайлбар`));
    a.values.forEach((v) => add(v.label, `${a.name} · үзүүлэлт`));
    lines(a.scepter).forEach((l) => add(l, `${a.name} · Aghanim's Scepter`));
    lines(a.shard).forEach((l) => add(l, `${a.name} · Aghanim's Shard`));
    a.notes.forEach((n) => lines(n).forEach((l) => add(l, `${a.name} · тэмдэглэл`)));
  }
  for (const t of kit.talents) t.options.forEach((o) => add(o, `Талант ${t.level}`));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Skill-ийн орчуулга</h1>
      <p className="text-sm text-muted">
        Баатрын skill, талантын Google Translate-ээр автоматаар орчуулсан текстийг энд засна. Засвар нэн даруй сайтад
        гарах бөгөөд дараагийн автомат орчуулга үүнийг дарж бичихгүй. Ижил мөр (жишээ нь үзүүлэлтийн нэр) бусад
        баатарт ч мөн адил засагдана.
      </p>
      <form method="get" className="flex flex-wrap items-center gap-2">
        <select
          name="hero"
          defaultValue={slug}
          className="rounded border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {heroes.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.name}
            </option>
          ))}
        </select>
        <button className="rounded bg-accent px-3 py-2 text-sm font-semibold text-white hover:brightness-110">Нээх</button>
        <Link href={`/heroes/${slug}`} className="text-sm text-gold hover:underline">
          {hero.name}-ийн хуудас ↗
        </Link>
      </form>
      <PatchTranslationEditor key={slug} lines={[...seen.values()]} />
    </div>
  );
}

export default function AdminSkillsPage({ searchParams }: PageProps<"/admin/skills">) {
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
