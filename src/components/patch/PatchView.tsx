import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getHero, getItems } from "@/lib/heroes";
import { getPatch, getPatches, getPatchTranslator, shortDate, type PatchEntry, type PatchLine } from "@/lib/patch";
import LangSwitch from "./LangSwitch";

type Tr = (en: string) => string;

/** Монгол болон англи хувилбарыг хоёуланг нь зурна — аль нь харагдахыг LangSwitch шийднэ. */
function T({ en, tr }: { en: string; tr: Tr }) {
  const mn = tr(en);
  if (mn === en) return <>{en}</>;
  return (
    <>
      <span className="tr-mn">{mn}</span>
      <span className="tr-en">{en}</span>
    </>
  );
}

const INDENT = ["", "", "pl-5", "pl-10", "pl-14"];

/** Мөрүүдийг дараалсан skill-ээр нь бүлэглэж харуулна (a=null бол баатрын ерөнхий өөрчлөлт). */
function Lines({ lines, tr }: { lines: PatchLine[]; tr: Tr }) {
  const groups: { a: string | null; lines: PatchLine[] }[] = [];
  for (const l of lines) {
    const last = groups.at(-1);
    if (last && last.a === (l.a ?? null)) last.lines.push(l);
    else groups.push({ a: l.a ?? null, lines: [l] });
  }
  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.a && (
            <p className={`mb-1 font-display text-xs font-bold uppercase tracking-wider ${g.a === "Talent" ? "text-int" : "text-gold"}`}>
              {g.a}
            </p>
          )}
          <ul className="space-y-1 text-sm leading-relaxed text-fg/85">
            {g.lines.map((l, i) => (
              <li key={i} className={`flex gap-2 ${INDENT[l.i] ?? "pl-14"}`}>
                <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 ${l.i > 1 ? "bg-muted/60" : "bg-radiant"}`} />
                <span>
                  <T en={l.t} tr={tr} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-44 space-y-4">
      <h2 className="title-g text-xl">
        {title}
        {count !== undefined && <span className="font-sans text-sm font-normal normal-case tracking-normal text-muted">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function EntryCard({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <article className="card-g overflow-hidden rounded-lg">
      <div className="border-b border-white/[0.06] bg-white/[0.03]">{head}</div>
      <div className="p-3.5">{children}</div>
    </article>
  );
}

function ItemCards({ entries, tr }: { entries: PatchEntry[]; tr: Tr }) {
  const items = getItems();
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((e, idx) => {
        const item = e.key ? items[e.key] : undefined;
        const head = item ? (
          <Link href={`/items/${item.key}`} className="flex items-center gap-3 p-2.5 transition hover:bg-white/[0.04]">
            <Image src={item.img} alt="" width={88} height={64} className="h-9 w-auto rounded-sm" />
            <span className="font-display font-bold uppercase tracking-wide">{item.name}</span>
          </Link>
        ) : (
          <p className="p-3 font-display font-bold uppercase tracking-wide">
            <T en={e.title ?? "Item"} tr={tr} />
          </p>
        );
        return (
          <EntryCard key={`${e.key ?? e.title}-${idx}`} head={head}>
            <Lines lines={e.lines} tr={tr} />
          </EntryCard>
        );
      })}
    </div>
  );
}

export function patchHref(version: string) {
  return version === getPatches().latest ? "/patch" : `/patch/${version}`;
}

export default async function PatchView({ version }: { version: string }) {
  const patch = getPatch(version);
  if (!patch) notFound();
  const { patches } = getPatches();
  const tr = await getPatchTranslator();

  const sections = [
    { id: "general", label: "Ерөнхий", count: patch.general.length },
    { id: "heroes", label: "Баатрууд", count: patch.heroes.length },
    { id: "items", label: "Items", count: patch.items.length },
    { id: "neutral-items", label: "Neutral items", count: patch.neutralItems.length },
    { id: "neutral-creeps", label: "Neutral creeps", count: patch.neutralCreeps.length },
  ].filter((s) => s.count > 0);

  const toolbar = (
    <nav aria-label="Хэсгүүд" className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wide text-fg/60 transition hover:text-white"
        >
          {s.label} <span className="text-muted">{s.count}</span>
        </a>
      ))}
    </nav>
  );

  return (
    <div className="space-y-6">
      <section className="clip-gaming relative overflow-hidden bg-[linear-gradient(120deg,rgba(95,191,90,0.16),rgba(74,174,232,0.07)_45%,rgba(224,83,63,0.16))] p-6 ring-1 ring-inset ring-white/10 sm:p-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">Gameplay update</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">Патч {patch.patch}</h1>
        <p className="mt-2 text-sm text-fg/75">
          {shortDate(patch.date)}-нд гарсан
          {patch.heroes.length > 0 && <> · {patch.heroes.length} баатар</>}
          {patch.items.length > 0 && <> · {patch.items.length} item</>}
          {patch.neutralItems.length > 0 && <> · {patch.neutralItems.length} neutral item</>} өөрчлөгдсөн
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {patches.map((p) => (
            <Link
              key={p.patch}
              href={patchHref(p.patch)}
              aria-current={p.patch === patch.patch ? "page" : undefined}
              className={`clip-gaming-sm px-3 py-1.5 font-display text-sm font-bold transition ${
                p.patch === patch.patch ? "bg-gold text-black" : "bg-white/5 text-fg/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.patch}
            </Link>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">
          Монгол орчуулгыг Google Translate-ээр автоматаар хийсэн тул алдаа байж болно — &quot;English&quot; товчоор эх
          хувийг харна уу.{" "}
          <a
            href={`https://www.dota2.com/patches/${patch.patch}`}
            target="_blank"
            rel="noreferrer"
            className="text-gold hover:underline"
          >
            Valve-ийн албан ёсны тэмдэглэл ↗
          </a>
        </p>
      </section>

      <LangSwitch toolbar={toolbar}>
        {patch.general.length > 0 && (
          <Section id="general" title="Ерөнхий өөрчлөлт">
            <div className="grid gap-3 md:grid-cols-2">
              {patch.general.map((g, i) => (
                <EntryCard
                  key={i}
                  head={
                    // Гарчиг нь газрын нэр ("Twin Gates", "Tormentor") тул англиар нь.
                    <p className="p-3 font-display font-bold uppercase tracking-wide">{g.title || "Ерөнхий"}</p>
                  }
                >
                  <Lines lines={g.lines} tr={tr} />
                </EntryCard>
              ))}
            </div>
          </Section>
        )}

        {patch.heroes.length > 0 && (
          <Section id="heroes" title="Баатрууд" count={patch.heroes.length}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {patch.heroes.map((h) => {
                const hero = getHero(h.slug);
                return (
                  <EntryCard
                    key={h.slug}
                    head={
                      <Link href={`/heroes/${h.slug}`} className="flex items-center gap-3 p-2.5 transition hover:bg-white/[0.04]">
                        {hero && <Image src={hero.img} alt="" width={256} height={144} className="h-10 w-auto rounded-sm" />}
                        <span className="font-display font-bold uppercase tracking-wide">{hero?.name ?? h.slug}</span>
                        <span className="ml-auto text-xs text-muted">{h.lines.length}</span>
                      </Link>
                    }
                  >
                    <Lines lines={h.lines} tr={tr} />
                  </EntryCard>
                );
              })}
            </div>
          </Section>
        )}

        {patch.items.length > 0 && (
          <Section id="items" title="Items" count={patch.items.length}>
            <ItemCards entries={patch.items} tr={tr} />
          </Section>
        )}

        {patch.neutralItems.length > 0 && (
          <Section id="neutral-items" title="Neutral items" count={patch.neutralItems.length}>
            <ItemCards entries={patch.neutralItems} tr={tr} />
          </Section>
        )}

        {patch.neutralCreeps.length > 0 && (
          <Section id="neutral-creeps" title="Neutral creeps" count={patch.neutralCreeps.length}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {patch.neutralCreeps.map((c) => (
                <EntryCard key={c.name} head={<p className="p-3 font-display font-bold uppercase tracking-wide">{c.name}</p>}>
                  <Lines lines={c.lines} tr={tr} />
                </EntryCard>
              ))}
            </div>
          </Section>
        )}
      </LangSwitch>
    </div>
  );
}
