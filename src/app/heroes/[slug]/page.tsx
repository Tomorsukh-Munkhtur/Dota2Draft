import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import HeroLinkRow from "@/components/heroes/HeroLinkRow";
import { AbilityList, TalentTree } from "@/components/heroes/HeroKitView";
import PatchNotesList from "@/components/PatchNotesList";
import { getHeroContent } from "@/lib/content";
import {
  ATTACK_LABEL,
  ATTR_COLOR,
  ATTR_LABEL,
  ROLE_LABEL,
  getHero,
  getHeroKit,
  getHeroes,
  getItems,
} from "@/lib/heroes";
import { getMatchupMeta, heroPickRate, heroWinrate, vsRow, withRow } from "@/lib/matchups";
import { getGameMeta, getHeroPatchNotes } from "@/lib/patch";

const RENDER_VIDEO = "https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders";
const COMPLEXITY = ["", "Тоглоход хялбар", "Дунд зэрэг", "Тоглоход хэцүү"];

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

function Card({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
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

async function HeroDetail({ slug }: { slug: string }) {
  const hero = getHero(slug);
  if (!hero) notFound();
  const i = getHeroes().indexOf(hero);
  const content = await getHeroContent(slug);
  const kit = getHeroKit(slug);
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
  const s = hero.stats;

  return (
    <>
      <header className="relative overflow-hidden rounded-xl border border-line bg-panel">
        <div className="grid items-center md:grid-cols-[1fr_380px]">
          <div className="relative z-10 space-y-3 p-6">
            <p className={`text-sm font-semibold uppercase tracking-wider ${ATTR_COLOR[hero.attr]}`}>
              {ATTR_LABEL[hero.attr]} · {ATTACK_LABEL[hero.attackType] ?? hero.attackType}
              {hero.complexity ? <span className="text-muted"> · {COMPLEXITY[hero.complexity]}</span> : null}
            </p>
            <h1 className="text-4xl font-black tracking-tight">{hero.name}</h1>
            <div className="flex flex-wrap gap-1.5">
              {hero.roles.map((r) => (
                <span key={r} className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs text-muted">
                  {ROLE_LABEL[r] ?? r}
                </span>
              ))}
            </div>
            {content.summary && <p className="max-w-xl text-fg/85">{content.summary}</p>}
            <div className="flex gap-6 pt-1 text-sm">
              <div>
                <p className="text-xs text-muted">Ялалтын хувь</p>
                <p className="text-xl font-bold tabular-nums">{heroWinrate(i).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted">Сонгогдох хувь</p>
                <p className="text-xl font-bold tabular-nums">{heroPickRate(i).toFixed(1)}%</p>
              </div>
              {patch && (
                <div>
                  <p className="text-xs text-muted">Патч</p>
                  <p className="text-xl font-bold">{patch}</p>
                </div>
              )}
            </div>
          </div>
          <video
            className="h-full max-h-[340px] w-full object-cover"
            src={`${RENDER_VIDEO}/${hero.slug}.webm`}
            poster={hero.img}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {kit && (
            <Card title="Чадварууд (skill)" note={`Valve-ийн албан ёсны тайлбар · патч ${patch ?? "?"}`}>
              <AbilityList kit={kit} />
            </Card>
          )}

          {kit && kit.talents.some((t) => t.options.length) && (
            <Card title="Талант">
              <TalentTree kit={kit} />
            </Card>
          )}

          <Card title="Түүх">
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
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Ялдаг баатрууд">
              {beats.map((r) => (
                <HeroLinkRow key={r.slug} {...r} />
              ))}
            </Card>
            <Card title="Ялагддаг баатрууд">
              {losesTo.map((r) => (
                <HeroLinkRow key={r.slug} {...r} />
              ))}
            </Card>
          </div>
          <p className="-mt-3 text-[11px] text-muted">
            OpenDota-гийн {matchupMeta.matchCount.toLocaleString("en-US")} ranked тоглолтоос (
            {matchupMeta.to.slice(0, 10)} хүртэл). Хувь нь хоёр баатрын ерөнхий хүчнээс хүлээгдэхээс хэр их
            ялсныг харуулна.
          </p>
        </div>

        <aside className="space-y-6">
          {content.counterItems.length > 0 && (
            <Card title="Эсрэг авах item">
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
            </Card>
          )}

          {content.counterTips.length > 0 && (
            <Card title="Эсрэг нь яаж тоглох вэ">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg/85">
                {content.counterTips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Card>
          )}

          {patchNotes.entries.length > 0 && (
            <Card title={`${patchNotes.major} патчийн өөрчлөлт`} note="Valve-ийн тэмдэглэл">
              <PatchNotesList entries={patchNotes.entries} />
            </Card>
          )}

          <Card title="Хамтрах баатрууд">
            {synergy.map((r) => (
              <HeroLinkRow key={r.slug} {...r} />
            ))}
          </Card>

          {content.similar.length > 0 && (
            <Card title="Ойролцоо баатрууд">
              {content.similar.map((sl) => (
                <HeroLinkRow key={sl} slug={sl} />
              ))}
            </Card>
          )}

          <Card title="Үндсэн үзүүлэлт" note="1-р түвшинд">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {(
                [
                  ["Хүч", `${s.str} +${s.strGain}`],
                  ["Авхаалж", `${s.agi} +${s.agiGain}`],
                  ["Ухаан", `${s.int} +${s.intGain}`],
                  ["HP", s.health],
                  ["Мана", s.mana],
                  ["Хуяг", s.armor],
                  ["Довтолгоо", `${s.attackMin}–${s.attackMax}`],
                  ["Довтолгооны зай", s.attackRange],
                  ["Хурд", s.moveSpeed],
                  ["Довтолгооны хурд", s.attackRate],
                ] as [string, string | number][]
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function HeroPage({ params }: PageProps<"/heroes/[slug]">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
      <Link href="/heroes" className="text-sm text-muted hover:text-fg">
        ← Бүх баатар
      </Link>
      <Suspense fallback={<div className="h-[340px] animate-pulse rounded-xl border border-line bg-panel" />}>
        {params.then(({ slug }) => (
          <HeroDetail slug={slug} />
        ))}
      </Suspense>
    </div>
  );
}
