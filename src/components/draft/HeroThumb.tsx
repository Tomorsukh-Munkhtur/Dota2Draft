import type { DraftHero } from "@/lib/draft";

/**
 * Баатрын хэвтээ (16:9) зураг. Зургууд CDN-ээс шууд ирдэг (next.config-д unoptimized) тул
 * next/image-ийн оронд энгийн img ашиглана — олон жижиг хэмжээнд харьцааны анхааруулга өгдөггүй.
 */
export default function HeroThumb({
  hero,
  className = "",
  width = 64,
}: {
  hero: DraftHero;
  className?: string;
  width?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hero.img}
      alt={hero.name}
      title={hero.name}
      width={width}
      height={Math.round((width * 9) / 16)}
      loading="lazy"
      decoding="async"
      className={`aspect-video object-cover ${className}`}
      draggable={false}
    />
  );
}
