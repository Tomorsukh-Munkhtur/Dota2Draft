import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import HomeCarousel, { type Slide } from "@/components/home/HomeCarousel";
import NewsCard from "@/components/news/NewsCard";
import { getActiveBanners } from "@/lib/banners";
import { ATTR_COLOR, ATTR_LABEL, getHero, getHeroes, getItems } from "@/lib/heroes";
import { getMatchupMeta, heroPickRate, heroWinrate } from "@/lib/matchups";
import { getPublishedNews } from "@/lib/news";
import { getPatches, shortDate } from "@/lib/patch";

// Слайд, карт дээр харуулах танил item-ууд.
const SHOWCASE_ITEMS = [
  "black_king_bar",
  "blink",
  "ultimate_scepter",
  "butterfly",
  "manta",
  "desolator",
  "heart",
  "skadi",
  "satanic",
  "radiance",
  "assault",
  "greater_crit",
  "abyssal_blade",
  "refresher",
  "sheepstick",
  "bloodthorn",
  "nullifier",
  "shivas_guard",
  "monkey_king_bar",
  "sphere",
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  swords: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  gem: "M6 3h12l4 6-10 13L2 9zM2 9h20M12 22 8 9l4-6 4 6z",
  news: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8z",
};

/** Нүүрний 4 карт. Драфтынх (featured) нь тод гэрэлтэй. */
function FeatureCard({
  href,
  title,
  sub,
  text,
  icon,
  images,
  featured,
}: {
  href: string;
  title: string;
  sub: string;
  text: string;
  icon: string;
  images: string[];
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden ${
        featured ? "btn-draft !flex" : "card-g clip-gaming"
      }`}
    >
      <div
        className={`clip-gaming relative flex h-full flex-col ${
          featured
            ? "bg-[linear-gradient(150deg,#ff6a3d_0%,#c7321f_45%,#4a0f0b_100%)]"
            : ""
        }`}
      >
        {/* Дээд талын зургийн тууз. */}
        <div className="relative h-24 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-4 gap-1 opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90">
            {images.slice(0, 4).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            ))}
          </div>
          <div
            className={`absolute inset-0 bg-gradient-to-t ${featured ? "from-[#a3221a] via-[#a3221a]/50" : "from-panel via-panel/60"} to-transparent`}
          />
          <span
            className={`clip-gaming-sm absolute bottom-2 left-4 grid h-11 w-11 place-items-center ${
              featured ? "bg-white text-[#c7321f]" : "bg-white/10 text-gold ring-1 ring-inset ring-white/15 backdrop-blur"
            }`}
          >
            <Icon d={icon} />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
          <h2 className="font-display text-xl font-extrabold uppercase leading-tight tracking-wide text-white">{title}</h2>
          <p className={`font-display text-sm font-bold ${featured ? "text-white/90" : "text-gold"}`}>{sub}</p>
          <p className={`text-sm ${featured ? "text-white/85" : "text-fg/70"}`}>{text}</p>
          <span
            className={`mt-auto pt-3 font-display text-sm font-bold uppercase tracking-wide transition group-hover:translate-x-1 ${
              featured ? "text-white" : "text-fg/80 group-hover:text-white"
            }`}
          >
            {featured ? "Эхлүүлэх →" : "Үзэх →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionHead({ title, note, link }: { title: string; note?: ReactNode; link?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="title-g text-xl sm:text-2xl">{title}</h2>
        {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      </div>
      {link && (
        <Link href={link.href} className="font-display text-sm font-bold uppercase tracking-wide text-gold hover:text-white">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [allNews, banners] = await Promise.all([getPublishedNews(), getActiveBanners()]);
  const news = allNews.slice(0, 3);
  const heroes = getHeroes();
  const items = getItems();
  const matchupMeta = getMatchupMeta();
  const { latest, patches } = getPatches();
  const latestPatch = patches[0];

  const ranked = heroes
    .map((h, i) => ({ h, wr: heroWinrate(i), pr: heroPickRate(i) }))
    .filter((x) => x.pr >= 4)
    .sort((a, b) => b.wr - a.wr);
  const trending = ranked.slice(0, 6);
  const showcaseItems = SHOWCASE_ITEMS.map((k) => items[k]?.img).filter((x): x is string => Boolean(x));
  const neutralImgs = Object.values(items)
    .filter((it) => it.kind === "neutral")
    .slice(0, 8)
    .map((it) => it.img);
  const heroImgs = (step: number, offset = 0) => heroes.filter((_, i) => i % step === offset).map((h) => h.img);

  // Админ баннер оруулсан бол түүнийг, эс бөгөөс автомат слайдуудыг харуулна.
  const slides: Slide[] = banners.length
    ? banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || undefined,
        image: b.imageUrl,
        href: b.linkUrl || undefined,
        cta: b.buttonLabel || undefined,
      }))
    : [
        {
          id: "draft",
          eyebrow: "Captain's Mode · Ranked All Pick",
          title: "Драфтаа ухаалаг хий",
          subtitle:
            "Пик, бан бүрт хэнд ялдаг, хэнд ялагддаг, хэнтэй сайн хамтардаг, ямар item авахыг шууд хар. 7.40+ дарааллаар, цаг хэмжигчтэй.",
          href: "/draft",
          cta: "Драфт эхлүүлэх",
          primary: true,
          tone: "fire",
          teams: [ranked.slice(0, 5).map((x) => x.h.img), ranked.slice(5, 10).map((x) => x.h.img)],
        },
        ...(latestPatch
          ? [
              {
                id: "patch",
                eyebrow: `Шинэ патч · ${shortDate(latestPatch.date)}`,
                title: `Патч ${latest}`,
                subtitle: `${latestPatch.heroes.length} баатар, ${latestPatch.items.length + latestPatch.neutralItems.length} item өөрчлөгдсөн. Юу өөрчлөгдсөнийг монголоор уншаарай.`,
                href: "/patch",
                cta: "Өөрчлөлтийг харах",
                tone: "gold" as const,
                mosaic: latestPatch.heroes
                  .map((h) => getHero(h.slug)?.img)
                  .filter((x): x is string => Boolean(x))
                  .slice(0, 20),
              },
            ]
          : []),
        ...(news[0]
          ? [
              {
                id: `news-${news[0].id}`,
                eyebrow: "Сүүлийн мэдээ",
                title: news[0].titleMn ?? "",
                subtitle: news[0].summaryMn ?? undefined,
                href: `/news/${news[0].id}`,
                cta: "Унших",
                image: news[0].image ?? undefined,
                tone: news[0].image ? undefined : ("blue" as const),
              },
            ]
          : []),
        {
          id: "heroes",
          eyebrow: `${heroes.length} баатар`,
          title: "Баатруудын түүх, үүрэг",
          subtitle: "Баатар бүрийн түүх монгол хэлээр, skill, talent, хэнд ялдаг, хэнд ялагддаг, ямар item авах вэ.",
          href: "/heroes",
          cta: "Баатрууд үзэх",
          tone: "green",
          mosaic: heroImgs(6, 1).slice(0, 20),
        },
        {
          id: "items",
          eyebrow: "Items & Neutral items",
          title: "Зэвсэг хэрэгслийн заавар",
          subtitle: "Дэлгүүрийн болон neutral item бүр юу өгдөг, хэзээ, хэнд авах вэ — монгол тайлбартай.",
          href: "/items",
          cta: "Item-ууд үзэх",
          tone: "blue",
          mosaic: [...showcaseItems, ...neutralImgs].slice(0, 20),
        },
      ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-12 px-4 py-6">
      <HomeCarousel slides={slides} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FeatureCard
          featured
          href="/draft"
          title="Captain mode"
          sub="Драфт эхлүүлэх"
          text="Баатраа оруулаад counter, хамтрах баатар, эсрэг item-ийг шууд хар."
          icon={ICONS.swords}
          images={ranked.slice(10, 14).map((x) => x.h.img)}
        />
        <FeatureCard
          href="/heroes"
          title="Heroes Role"
          sub="Баатруудын үүрэг"
          text={`${heroes.length} баатрын үүрэг, түүх, skill, хэнд ялдаг, хэнд ялагддаг.`}
          icon={ICONS.shield}
          images={heroImgs(9, 4)}
        />
        <FeatureCard
          href="/items"
          title="All Items & Neutral items"
          sub="Зэвсэг хэрэгслүүд"
          text="Item бүр юу өгдөг, хэзээ, яаж ашиглах заавар."
          icon={ICONS.gem}
          images={[...showcaseItems.slice(0, 2), ...neutralImgs.slice(0, 2)]}
        />
        <FeatureCard
          href="/news"
          title="News"
          sub="Мэдээ мэдээлэл"
          text="Dota 2-ын сүүлийн үеийн мэдээ, патчийн тайлбар монголоор."
          icon={ICONS.news}
          images={news.map((n) => n.image).filter((x): x is string => Boolean(x)).concat(heroImgs(11, 7)).slice(0, 4)}
        />
      </section>

      {news.length > 0 && (
        <section className="space-y-4">
          <SectionHead title="Сүүлийн мэдээ" link={{ href: "/news", label: "Бүгдийг харах" }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHead
          title="Хамгийн их ялж буй баатрууд"
          note={`Сүүлийн ${matchupMeta.matchCount.toLocaleString("en-US")} ranked тоглолтоор (4%-иас дээш сонгогддог баатруудаас).`}
          link={{ href: "/heroes", label: "Бүх баатар" }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {trending.map(({ h, wr, pr }, rank) => (
            <Link key={h.slug} href={`/heroes/${h.slug}`} className="card-g group overflow-hidden rounded-lg">
              <div className="relative overflow-hidden">
                <Image
                  src={h.img}
                  alt={h.name}
                  width={256}
                  height={144}
                  className="aspect-video w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="clip-gaming-sm absolute left-0 top-0 bg-black/70 px-2 py-0.5 font-display text-xs font-extrabold text-gold">
                  #{rank + 1}
                </span>
              </div>
              <div className="space-y-1.5 p-2.5">
                <p className="truncate font-display text-sm font-bold uppercase tracking-wide">{h.name}</p>
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className={ATTR_COLOR[h.attr]}>{ATTR_LABEL[h.attr]}</span>
                  <span className="font-display text-base font-extrabold tabular-nums text-good">{wr.toFixed(1)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-radiant to-good"
                    style={{ width: `${Math.min(100, Math.max(0, (wr - 45) * 10))}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted">сонголт {pr.toFixed(1)}%</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
