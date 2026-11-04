import type { Metadata } from "next";
import Link from "next/link";
import ItemTabs from "@/components/items/ItemTabs";
import { getItemSummaries } from "@/lib/items";

export const metadata: Metadata = {
  title: "Neutral item",
  description: "Dota 2-ын neutral item ба enchantment-уудын танилцуулга, хэрэглэх заавар — монгол хэлээр.",
};

type Summary = Awaited<ReturnType<typeof getItemSummaries>>[number];

function Card({ item }: { item: Summary }) {
  return (
    <Link
      href={`/items/${item.key}`}
      className="group flex gap-3 rounded-lg border border-line bg-panel p-2.5 transition hover:border-gold/60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.img} alt="" width={64} height={47} loading="lazy" className="h-[47px] w-16 shrink-0 rounded" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold group-hover:text-gold">{item.name}</p>
        {item.summary && <p className="line-clamp-3 text-[11px] text-muted">{item.summary}</p>}
      </div>
    </Link>
  );
}

export default async function NeutralItemsPage() {
  const [neutral, enchantments] = await Promise.all([getItemSummaries("neutral"), getItemSummaries("enchantment")]);
  const tiers = [1, 2, 3, 4, 5].map((t) => ({ tier: t, list: neutral.filter((n) => n.tier === t) }));

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Neutral item</h1>
          <p className="max-w-3xl text-sm text-muted">
            Neutral item-ийг дэлгүүрээс худалдаж авдаггүй. Нейтрал крийпийн кемп цэвэрлэхэд <b>Madstone</b> унана.
            Хангалттай Madstone цуглуулбал 4–5 санамсаргүй item-ээс нэгийг, мөн нэмэлт үзүүлэлт өгөх Enchantment-ийг
            сонгож урладаг. Түвшнүүдийг дарааллаар нь урлах бөгөөд цуглуулж болох Madstone-ийн хэмжээ тоглолтын
            цагаар хязгаарлагддаг тул өндөр түвшин хожуу нээгдэнэ. Баатар нэг л neutral item зүүнэ — шинийг урлавал
            хуучин нь солигдоно.
          </p>
        </div>
        <ItemTabs active="/items/neutral" />
      </div>

      {tiers.map(({ tier, list }) => (
        <section key={tier} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{tier}-р түвшин</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((it) => (
              <Card key={it.key} item={it} />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Enchantment</h2>
        <p className="max-w-3xl text-sm text-muted">
          Neutral item урлахдаа хамт сонгож нэмэлт үзүүлэлт авна. Санал болгогдох Enchantment баатрын үндсэн
          үзүүлэлтээс хамаардаг бөгөөд өндөр түвшинд авах тусам тоо нь өсдөг.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enchantments.map((it) => (
            <Card key={it.key} item={it} />
          ))}
        </div>
      </section>
    </div>
  );
}
