import type { Metadata } from "next";
import HeroBrowser from "@/components/heroes/HeroBrowser";
import { getHeroes } from "@/lib/heroes";
import { heroWinrate } from "@/lib/matchups";

export const metadata: Metadata = {
  title: "Баатрууд",
  description: "Dota 2-ын бүх баатрын түүх, давуу сул тал, эсрэг item — монгол хэлээр.",
};

export default function HeroesPage() {
  const heroes = getHeroes();
  const list = heroes.map((h, i) => ({
    slug: h.slug,
    name: h.name,
    attr: h.attr,
    roles: h.roles,
    img: h.img,
    winrate: heroWinrate(i),
  }));
  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Баатрууд</h1>
        <p className="text-sm text-muted">
          {heroes.length} баатар. Баатар дээр дарж түүх, хэнд ялдаг/ялагддаг, эсрэг тоглох item-ийг үзээрэй.
        </p>
      </div>
      <HeroBrowser heroes={list} />
    </div>
  );
}
