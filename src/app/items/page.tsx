import type { Metadata } from "next";
import ItemBrowser from "@/components/items/ItemBrowser";
import ItemTabs from "@/components/items/ItemTabs";
import { getItemSummaries } from "@/lib/items";

export const metadata: Metadata = {
  title: "Item-ууд",
  description: "Dota 2-ын дэлгүүрийн item бүрийн танилцуулга, хэрэглэх заавар — монгол хэлээр.",
};

export default async function ItemsPage() {
  const list = await getItemSummaries("shop");
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Item-ууд</h1>
          <p className="text-sm text-muted">
            Дэлгүүрийн {list.length} item. Item дээр дарж юу өгдөг, хэзээ, яаж ашиглахыг үзээрэй.
          </p>
        </div>
        <ItemTabs active="/items" />
      </div>
      <ItemBrowser items={list} />
    </div>
  );
}
