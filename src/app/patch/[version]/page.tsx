import type { Metadata } from "next";
import { Suspense } from "react";
import PatchView from "@/components/patch/PatchView";
import { getPatches } from "@/lib/patch";

export function generateStaticParams() {
  return getPatches().patches.map((p) => ({ version: p.patch }));
}

export async function generateMetadata({ params }: PageProps<"/patch/[version]">): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `Патч ${version} — өөрчлөлтүүд`,
    description: `Dota 2-ын ${version} патчид баатар, item, neutral item-д орсон өөрчлөлтүүд монгол хэлээр.`,
  };
}

export default function PatchPage({ params }: PageProps<"/patch/[version]">) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <Suspense fallback={<div className="h-[260px] animate-pulse rounded-xl bg-white/[0.04]" />}>
        {params.then(({ version }) => (
          <PatchView version={version} />
        ))}
      </Suspense>
    </div>
  );
}
