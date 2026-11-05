"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export type Slide = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
  /** Бүтэн дэвсгэр зураг (админы баннер, мэдээний зураг). */
  image?: string;
  /** Зургийн хавтан (баатар, item-ийн жижиг зургууд). */
  mosaic?: string[];
  /** Драфтын слайд: Radiant ба Dire-ийн 5 баатар. */
  teams?: [string[], string[]];
  tone?: "fire" | "gold" | "blue" | "green";
  /** Гол (драфтын) товч хэлбэрээр харуулах. */
  primary?: boolean;
};

const TONE: Record<NonNullable<Slide["tone"]>, string> = {
  fire: "bg-[radial-gradient(80%_120%_at_85%_50%,rgba(255,92,54,0.35),transparent_60%)]",
  gold: "bg-[radial-gradient(80%_120%_at_85%_50%,rgba(227,180,92,0.3),transparent_60%)]",
  blue: "bg-[radial-gradient(80%_120%_at_85%_50%,rgba(74,174,232,0.3),transparent_60%)]",
  green: "bg-[radial-gradient(80%_120%_at_85%_50%,rgba(95,191,90,0.3),transparent_60%)]",
};

const AUTOPLAY_MS = 6500;

function Teams({ teams, active }: { teams: [string[], string[]]; active: boolean }) {
  const row = (imgs: string[], side: "radiant" | "dire") => (
    <div className="flex gap-1.5 sm:gap-2">
      {imgs.slice(0, 5).map((src, i) => (
        <div
          key={src}
          style={{ transitionDelay: `${i * 70}ms` } as CSSProperties}
          className={`clip-gaming-sm w-[13vw] max-w-[96px] overflow-hidden ring-2 ring-inset transition-all duration-700 sm:w-[9vw] xl:w-[6.5vw] ${
            side === "radiant" ? "ring-radiant/70" : "ring-dire/70"
          } ${active ? "translate-y-0 opacity-100" : `${side === "radiant" ? "-translate-y-4" : "translate-y-4"} opacity-0`}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="aspect-[4/3] w-full object-cover" draggable={false} />
        </div>
      ))}
    </div>
  );
  return (
    // Утсанд текстийн дээр, дунд дэлгэцэнд текстийн ард бүдэг, том дэлгэцэнд баруун талд тод.
    <div className="absolute inset-x-0 top-5 flex flex-col items-center gap-1.5 sm:inset-x-auto sm:right-8 sm:top-6 sm:gap-2 sm:opacity-30 xl:right-14 xl:top-1/2 xl:-translate-y-1/2 xl:gap-3 xl:opacity-100">
      <p className="hidden self-start font-display text-xs font-bold uppercase tracking-[0.25em] text-radiant sm:block">Radiant</p>
      {row(teams[0], "radiant")}
      <p className="font-display text-3xl font-extrabold italic leading-none text-white drop-shadow-[0_0_14px_rgba(255,92,54,0.9)] sm:text-4xl xl:text-5xl">
        VS
      </p>
      {row(teams[1], "dire")}
      <p className="hidden self-end font-display text-xs font-bold uppercase tracking-[0.25em] text-dire sm:block">Dire</p>
    </div>
  );
}

function Background({ slide, active }: { slide: Slide; active: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {slide.image && (
        // Админы оруулсан зураг ямар ч харьцаатай байж болох тул энгийн img.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${active ? "scale-105" : "scale-100"}`}
          draggable={false}
        />
      )}
      {slide.mosaic && (
        <div
          className={`absolute -right-10 -top-10 grid w-[85%] rotate-[-6deg] grid-cols-4 gap-1.5 opacity-60 transition-transform duration-[8000ms] ease-out [mask-image:linear-gradient(to_left,black_45%,transparent)] sm:w-[70%] sm:grid-cols-5 ${
            active ? "scale-110" : "scale-100"
          }`}
        >
          {slide.mosaic.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${src}-${i}`} src={src} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" draggable={false} />
          ))}
        </div>
      )}
      {slide.tone && <div className={`absolute inset-0 ${TONE[slide.tone]}`} />}
      {/* Текст уншигдахуйц байлгах бараан давхарга. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/55 to-transparent sm:bg-gradient-to-r sm:from-[#07090d] sm:via-[#07090d]/75 sm:to-transparent" />
      {slide.teams && <Teams teams={slide.teams} active={active} />}
    </div>
  );
}

function Arrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Өмнөх слайд" : "Дараагийн слайд"}
      className={`clip-gaming-sm absolute top-1/2 z-10 hidden -translate-y-1/2 bg-black/45 p-2.5 text-white/80 ring-1 ring-inset ring-white/15 backdrop-blur transition hover:bg-black/70 hover:text-white sm:block ${
        dir < 0 ? "left-3" : "right-3"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir < 0 ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

export default function HomeCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, count]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Онцлох"
      className="clip-gaming relative overflow-hidden bg-[#0b0f16] ring-1 ring-inset ring-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="relative h-[500px] sm:h-[400px] lg:h-[430px]">
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}: ${s.title}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? "z-[1] opacity-100" : "opacity-0"}`}
            >
              <Background slide={s} active={active} />
              <div className="relative flex h-full max-w-2xl flex-col justify-end gap-3 p-6 pb-14 sm:justify-center sm:p-12 sm:pb-14 lg:px-16">
                {s.eyebrow && (
                  <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-gold sm:text-sm sm:tracking-[0.3em]">{s.eyebrow}</p>
                )}
                <h2
                  className={`font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-wide text-white transition-all duration-700 sm:text-5xl ${
                    active ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
                  }`}
                >
                  {s.title}
                </h2>
                {s.subtitle && <p className="line-clamp-3 max-w-xl text-sm text-fg/80 sm:text-base">{s.subtitle}</p>}
                {s.href && (
                  <div className="mt-2">
                    {s.primary ? (
                      <Link href={s.href} className="btn-draft text-base">
                        <span className="!px-6 !py-3">{s.cta ?? "Нээх"} →</span>
                      </Link>
                    ) : /^https?:\/\//i.test(s.href) ? (
                      <a href={s.href} target="_blank" rel="noreferrer" className="btn-ghost clip-gaming-sm">
                        {s.cta || "Нээх"} ↗
                      </a>
                    ) : (
                      <Link href={s.href} className="btn-ghost clip-gaming-sm">
                        {s.cta || "Нээх"} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <Arrow dir={-1} onClick={() => go(index - 1)} />
          <Arrow dir={1} onClick={() => go(index + 1)} />
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}-р слайд`}
                aria-current={i === index}
                className="group/dot relative h-2.5 overflow-hidden rounded-full bg-white/20 transition-all"
                style={{ width: i === index ? 36 : 10 }}
              >
                {/* Идэвхтэй цэг дотор автоматаар солигдох хугацааны зурвас. */}
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold to-[#ff6a3d]"
                    style={{
                      width: paused ? "100%" : undefined,
                      animation: paused ? undefined : `carousel-progress ${AUTOPLAY_MS}ms linear forwards`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
