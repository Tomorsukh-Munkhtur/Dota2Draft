import type { Metadata } from "next";
import DraftBoard from "@/components/draft/DraftBoard";
import { getDraftContent } from "@/lib/content";
import type { DraftData } from "@/lib/draft";
import { getHeroes, getItems } from "@/lib/heroes";
import { draftMatrices, getMatchupMeta } from "@/lib/matchups";
import { getGameMeta } from "@/lib/patch";

export const metadata: Metadata = {
  title: "Драфт туслах",
  description: "Captain's Mode болон Ranked All Pick-ийн пик/бан хийхэд туслах хэрэгсэл.",
};

export default async function DraftPage() {
  const matchupMeta = getMatchupMeta();
  const data: DraftData = {
    heroes: getHeroes().map(({ slug, name, attr, roles, img, icon, cmEnabled }) => ({
      slug,
      name,
      attr,
      roles,
      img,
      icon,
      cmEnabled,
    })),
    ...draftMatrices(),
    content: await getDraftContent(),
    items: Object.fromEntries(
      Object.values(getItems()).map(({ id, key, name, cost, img }) => [key, { id, key, name, cost, img }]),
    ),
    meta: { matchCount: matchupMeta.matchCount, to: matchupMeta.to, patch: getGameMeta().patch ?? null },
  };
  return <DraftBoard data={data} />;
}
