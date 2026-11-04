import Image from "next/image";
import Link from "next/link";
import NewsCard from "@/components/news/NewsCard";
import { ATTR_COLOR, ATTR_LABEL, getHeroes } from "@/lib/heroes";
import { getMatchupMeta, heroPickRate, heroWinrate } from "@/lib/matchups";
import { getPublishedNews } from "@/lib/news";

const FEATURES = [
  {
    href: "/draft",
    title: "Драфт туслах",
    text: "Captain's Mode болон Ranked All Pick-ийн үеэр баатраа оруулаад хэнд ялдаг, хэнд ялагддаг, хэнтэй сайн хамтардаг, ямар item авахыг шууд хар.",
  },
  {
    href: "/heroes",
    title: "Баатрууд",
    text: "127 баатрын түүх монгол хэлээр, үүрэг, ойролцоо баатрууд, эсрэг тоглох арга.",
  },
  {
    href: "/items",
    title: "Item-ууд",
    text: "Дэлгүүрийн болон neutral item бүр юу өгдөг, хэзээ, яаж ашиглах заавар.",
  },
  {
    href: "/news",
    title: "Мэдээ",
    text: "Valve-ийн албан ёсны мэдээ, патчийн тайлбар монгол орчуулгатай.",
  },
];

export default async function Home() {
  const news = (await getPublishedNews()).slice(0, 3);
  const heroes = getHeroes();
  const matchupMeta = getMatchupMeta();
  const trending = heroes
    .map((h, i) => ({ h, wr: heroWinrate(i), pr: heroPickRate(i) }))
    .filter((x) => x.pr >= 4)
    .sort((a, b) => b.wr - a.wr)
    .slice(0, 6);
  const mosaic = heroes.filter((_, i) => i % 3 === 0).slice(0, 36);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 grid grid-cols-6 opacity-25 sm:grid-cols-9 lg:grid-cols-12" aria-hidden>
          {mosaic.map((h) => (
            <Image key={h.slug} src={h.img} alt="" width={160} height={90} className="aspect-video w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,13,18,0.55),#0a0d12_75%)]" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent">Dota 2 · Монгол</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Драфтаа <span className="text-gold">ухаалаг</span> хий
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-fg/80">
            Шинэ тоглогчдод зориулсан пик/бан туслах, баатруудын түүх, сүүлийн үеийн мэдээ — бүгд монгол хэлээр.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/draft" className="rounded-lg bg-accent px-6 py-3 font-bold text-white transition hover:brightness-110">
              Драфт туслах эхлүүлэх
            </Link>
            <Link href="/heroes" className="rounded-lg border border-line bg-panel px-6 py-3 font-semibold transition hover:bg-panel-2">
              Баатрууд үзэх
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-12 px-4 py-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="rounded-lg border border-line bg-panel p-5 transition hover:-translate-y-0.5 hover:border-gold/60"
            >
              <h2 className="mb-2 text-lg font-bold text-gold">{f.title}</h2>
              <p className="text-sm text-fg/75">{f.text}</p>
            </Link>
          ))}
        </section>

        {news.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold">Сүүлийн мэдээ</h2>
              <Link href="/news" className="text-sm text-gold hover:underline">
                Бүгдийг харах →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Одоо хамгийн их ялж буй баатрууд</h2>
            <p className="text-xs text-muted">
              Сүүлийн {matchupMeta.matchCount.toLocaleString("en-US")} ranked тоглолтоор (4%-иас дээш сонгогддог
              баатруудаас).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trending.map(({ h, wr, pr }) => (
              <Link
                key={h.slug}
                href={`/heroes/${h.slug}`}
                className="overflow-hidden rounded-lg border border-line bg-panel transition hover:border-gold/60"
              >
                <Image src={h.img} alt={h.name} width={256} height={144} className="aspect-video w-full object-cover" />
                <div className="p-2">
                  <p className="truncate text-sm font-semibold">{h.name}</p>
                  <p className="flex justify-between text-[11px]">
                    <span className={ATTR_COLOR[h.attr]}>{ATTR_LABEL[h.attr]}</span>
                    <span className="text-good tabular-nums">{wr.toFixed(1)}%</span>
                  </p>
                  <p className="text-[10px] text-muted">сонголт {pr.toFixed(1)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
