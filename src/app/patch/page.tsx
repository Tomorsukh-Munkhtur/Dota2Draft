import type { Metadata } from "next";
import PatchView from "@/components/patch/PatchView";
import { getPatches } from "@/lib/patch";

export function generateMetadata(): Metadata {
  const { latest } = getPatches();
  return {
    title: `Патч ${latest} — өөрчлөлтүүд`,
    description: `Dota 2-ын ${latest} патчид баатар, item, neutral item-д орсон өөрчлөлтүүд монгол хэлээр.`,
  };
}

export default function LatestPatchPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <PatchView version={getPatches().latest} />
    </div>
  );
}
