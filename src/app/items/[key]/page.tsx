import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import HeroLinkRow from "@/components/heroes/HeroLinkRow";
import ItemBuildTree from "@/components/items/ItemBuildTree";
import ItemHeader from "@/components/items/ItemHeader";
import PatchNotesList from "@/components/PatchNotesList";
import { getItems } from "@/lib/heroes";
import { formatStat } from "@/lib/itemStats";
import { buildsInto, getItemContent, heroesCounteredBy } from "@/lib/items";
import { SHOP_CATEGORIES } from "@/lib/labels";
import { getGameMeta, getItemPatchNotes } from "@/lib/patch";

const ABILITY_TYPE: Record<string, string> = {
  active: "Идэвхтэй",
  passive: "Пассив",
  use: "Хэрэглэх",
  toggle: "Асаах/унтраах",
  upgrade: "Сайжруулалт",
};

export function generateStaticParams() {
  return Object.values(getItems())
    .filter((it) => it.kind !== "legacy")
    .map((it) => ({ key: it.key }));
}

export async function generateMetadata({ params }: PageProps<"/items/[key]">): Promise<Metadata> {
  const { key } = await params;
  const item = getItems()[key];
  if (!item) return {};
  const content = await getItemContent(key);
  return { title: item.name, description: content?.summary || `${item.name} — хэрэглэх заавар.` };
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{title}</h2>
        {note && <span className="text-[11px] text-muted">{note}</span>}
      </div>
      {children}
    </section>
  );
}

async function ItemDetail({ itemKey }: { itemKey: string }) {
  const item = getItems()[itemKey];
  if (!item || item.kind === "legacy") notFound();
  const [content, countered] = await Promise.all([getItemContent(itemKey), heroesCounteredBy(itemKey)]);
  const parents = buildsInto(itemKey);
  const componentCost = (item.components ?? []).reduce((s, k) => s + (getItems()[k]?.cost ?? 0), 0);
  const recipeCost = item.components ? item.cost - componentCost : 0;
  const category = SHOP_CATEGORIES.find((c) => c.key === item.category)?.label;
  // Зарим item-д "+0" гэсэн хоосон үзүүлэлт байдаг.
  const stats = item.attrib.filter((a) => a.value.trim() !== "0");
  const patchNotes = getItemPatchNotes(itemKey);
  const { patch } = getGameMeta();
  const kindLabel =
    item.kind === "neutral"
      ? `Neutral item · ${item.tier}-р түвшин`
      : item.kind === "enchantment"
        ? "Enchantment"
        : `Дэлгүүрийн item${category ? ` · ${category}` : ""}`;

  const neutralLike = item.kind === "neutral" || item.kind === "enchantment";

  return (
    <>
      <ItemHeader
        item={item}
        kindLabel={kindLabel}
        summary={content?.summary}
        patch={patch ?? null}
        back={neutralLike ? { href: "/items/neutral", label: "Neutral items" } : { href: "/items", label: "Items" }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {(item.components?.length || parents.length > 0) && (
            <Card title="Бүрэлдэхүүн" note="Дээр: юунд ордог · Доор: бүрэлдэхүүн ба жор">
              <ItemBuildTree
                item={item}
                components={(item.components ?? []).map((k) => getItems()[k]).filter((x) => x !== undefined)}
                recipeCost={recipeCost}
                parents={parents}
              />
            </Card>
          )}

          {item.abilities.length > 0 && (
            <Card title="Чадварууд">
              <div className="space-y-4">
                {item.abilities.map((a, i) => {
                  const mn = content?.abilities.find((x) => x.title === a.title) ?? content?.abilities[i];
                  return (
                    <div key={`${a.title}${i}`}>
                      <p className="mb-1 flex items-center gap-2">
                        <span className="font-semibold">{a.title}</span>
                        <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                          {ABILITY_TYPE[a.type] ?? a.type}
                        </span>
                      </p>
                      <p className="whitespace-pre-line text-sm text-fg/85">{mn?.description ?? a.description}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {content?.usage ? (
            <Card title="Хэрэглэх заавар">
              <div className="prose-mn text-fg/90">
                {content.usage.split(/\n{2,}/).map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
              {content.tips.length > 0 && (
                <>
                  <h3 className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Зөвлөгөө</h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg/85">
                    {content.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          ) : (
            <p className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">
              Монгол заавар удахгүй нэмэгдэнэ.
            </p>
          )}

          {countered.length > 0 && (
            <Card title="Эдгээр баатрын эсрэг үр дүнтэй">
              <ul className="space-y-2">
                {countered.map((c) => (
                  <li key={c.slug} className="grid gap-1 sm:grid-cols-[200px_1fr] sm:items-center">
                    <HeroLinkRow slug={c.slug} />
                    <p className="text-xs text-fg/75">{c.reason}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          {stats.length > 0 && (
            <Card title="Өгөх үзүүлэлт">
              <ul className="space-y-1 text-sm">
                {stats.map((a) => (
                  <li key={a.key} className="tabular-nums">
                    {formatStat(a.display, a.value)}
                  </li>
                ))}
              </ul>
              {item.kind === "enchantment" && (
                <p className="mt-2 text-xs text-muted">«/»-аар тусгаарласан тоонууд нь урласан түвшнээс хамаарна.</p>
              )}
            </Card>
          )}

          {content && content.goodFor.length > 0 && (
            <Card title="Тохирох баатрууд">
              {content.goodFor.map((s) => (
                <HeroLinkRow key={s} slug={s} />
              ))}
            </Card>
          )}

          {patchNotes.entries.length > 0 && (
            <Card title={`${patchNotes.major} патчийн өөрчлөлт`}>
              <PatchNotesList
                entries={patchNotes.entries.map((e) => ({ patch: e.patch, lines: e.lines.map((text) => ({ ability: null, text })) }))}
              />
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

export default function ItemPage({ params }: PageProps<"/items/[key]">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-line bg-panel" />}>
        {params.then(({ key }) => (
          <ItemDetail itemKey={key} />
        ))}
      </Suspense>
    </div>
  );
}
