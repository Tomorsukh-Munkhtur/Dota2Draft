import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HeroLinkRow from "@/components/heroes/HeroLinkRow";
import HeroHeader from "@/components/heroes/HeroHeader";
import HeroKitPanels from "@/components/heroes/HeroKitPanels";
import PatchNotesList from "@/components/PatchNotesList";
import Tabs from "@/components/Tabs";
import { getHeroContent } from "@/lib/content";
import { getHero, getHeroKit, getHeroes, getItems, translateKit } from "@/lib/heroes";
import { getMatchupMeta, heroPickRate, heroWinrate, vsRow, withRow } from "@/lib/matchups";
import { getAbilityTranslator, getGameMeta, getHeroPatchNotes } from "@/lib/patch";

export function generateStaticParams() {
  return getHeroes().map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: PageProps<"/heroes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hero = getHero(slug);
  if (!hero) return {};
  const content = await getHeroContent(slug);
  return { title: hero.name, description: content.summary || `${hero.name} — түүх, skill, матчап, эсрэг item.` };
}

async function HeroDetail({ slug }: { slug: string }) {
  const hero = getHero(slug);
  if (!hero) notFound();
  const i = getHeroes().indexOf(hero);
  const content = await getHeroContent(slug);
  const kit = getHeroKit(slug);
  const kitMn = kit && translateKit(kit, await getAbilityTranslator());
  const patchNotes = getHeroPatchNotes(slug);
  const { patch } = getGameMeta();
  const matchupMeta = getMatchupMeta();
  const items = getItems();

  const vs = vsRow(i);
  const beats = [...vs].sort((a, b) => b.value - a.value).slice(0, 8);
  const losesTo = [...vs].sort((a, b) => a.value - b.value).slice(0, 8);
  const synergy = withRow(i)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const empty = <p className="text-sm text-muted">Мэдээлэл алга</p>;
  const heroList = (rows: { slug: string; value?: number; games?: number }[], hint: string) => (
    <>
      <p className="mb-2 text-[11px] text-muted">{hint}</p>
      {rows.length ? rows.map((r) => <HeroLinkRow key={r.slug} {...r} />) : empty}
    </>
  );

  return (
    <>
      <HeroHeader
        hero={hero}
        summary={content.summary}
        winrate={heroWinrate(i)}
        pickRate={heroPickRate(i)}
        patch={patch ?? null}
        lore={
          <>
            {content.translated ? null : (
              <p className="mb-3 rounded bg-panel-2 px-3 py-2 text-xs text-muted">
                Монгол орчуулга удахгүй нэмэгдэнэ. Доорх нь англи эх.
              </p>
            )}
            <div className="prose-mn text-fg/90">
              {content.lore.split(/\n{2,}/).map((p, k) => (
                <p key={k}>{p}</p>
              ))}
            </div>
          </>
        }
      />

      {/* 2-р мөр: талант | чадварууд (зургаар нь сонгоно) */}
      {kit && kitMn && (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <HeroKitPanels kitMn={kitMn} kitEn={kit} patch={patch ?? null} />
        </div>
      )}

      {/* 3-р мөр: матчап | item, зөвлөгөө, патч */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Tabs
          className="lg:min-h-[460px]"
          tabs={[
            { key: "counter", label: "Counter heroes", content: heroList(losesTo, `${hero.name}-ийн эсрэг сонгоход сайн`) },
            { key: "good", label: "Good against", content: heroList(beats, `${hero.name} эдгээрийг ялдаг`) },
            {
              key: "similar",
              label: "Similar heroes",
              content: heroList(
                content.similar.map((sl) => ({ slug: sl })),
                "Ижил үүрэгтэй, ойролцоо тоглодог баатрууд",
              ),
            },
            { key: "synergy", label: "Synergy", content: heroList(synergy, `${hero.name}-тэй сайн хамтардаг`) },
          ]}
        />
        <Tabs
          className="lg:min-h-[460px]"
          tabs={[
            {
              key: "items",
              label: "Эсрэг авах item",
              content: content.counterItems.length ? (
                <ul className="space-y-3">
                  {content.counterItems.map((c) => {
                    const it = items[c.item];
                    if (!it) return null;
                    return (
                      <li key={c.item} className="flex gap-3 text-sm">
                        <Image src={it.img} alt={it.name} width={48} height={35} className="h-[35px] w-12 shrink-0 rounded" />
                        <div>
                          <p className="font-semibold text-gold">
                            <Link href={`/items/${it.key}`} className="hover:underline">
                              {it.name}
                            </Link>{" "}
                            <span className="text-xs font-normal text-muted">{it.cost}</span>
                          </p>
                          <p className="text-xs text-fg/80">{c.reason}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                empty
              ),
            },
            {
              key: "tips",
              label: "Эсрэг нь яаж тоглох вэ",
              content: content.counterTips.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg/85">
                  {content.counterTips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                empty
              ),
            },
            {
              key: "patch",
              label: `${patchNotes.major || patch || ""} патчийн өөрчлөлт`.trim(),
              content: patchNotes.entries.length ? (
                <>
                  <p className="mb-2 text-[11px] text-muted">Valve-ийн тэмдэглэл · машин орчуулга</p>
                  <PatchNotesList entries={patchNotes.entries} />
                </>
              ) : (
                <p className="text-sm text-muted">Энэ патчид өөрчлөгдөөгүй.</p>
              ),
            },
          ]}
        />
      </div>
      <p className="-mt-3 text-[11px] text-muted">
        Матчапын хувь: OpenDota-гийн {matchupMeta.matchCount.toLocaleString("en-US")} ranked тоглолтоос (
        {matchupMeta.to.slice(0, 10)} хүртэл) — хоёр баатрын ерөнхий хүчнээс хүлээгдэхээс хэр их ялсныг харуулна.
      </p>
    </>
  );
}

export default function HeroPage({ params }: PageProps<"/heroes/[slug]">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
      <Suspense fallback={<div className="h-[460px] animate-pulse rounded-2xl bg-panel ring-1 ring-white/10" />}>
        {params.then(({ slug }) => (
          <HeroDetail slug={slug} />
        ))}
      </Suspense>
    </div>
  );
}
