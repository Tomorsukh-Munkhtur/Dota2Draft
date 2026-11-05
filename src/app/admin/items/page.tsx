import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import type { Item } from "@/lib/heroes";
import { getItemContentOverrides } from "@/lib/itemContentStore";
import { itemsOfKind } from "@/lib/items";

export const metadata: Metadata = { title: "Item-ийн контент", robots: { index: false } };

function Group({ title, items, edited }: { title: string; items: Item[]; edited: Set<string> }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
        {title} <span className="text-muted">{items.length}</span>
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={`/admin/items/${it.key}`}
              className="flex items-center gap-2 rounded-lg border border-line bg-panel p-1.5 pr-2 text-sm transition hover:border-gold/60"
            >
              <Image src={it.img} alt="" width={44} height={32} className="h-8 w-11 rounded-sm" />
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              {edited.has(it.key) && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" title="Админ зассан" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function List() {
  if (!(await isAdmin())) return <LoginForm />;
  const overrides = await getItemContentOverrides();
  const edited = new Set(Object.entries(overrides).filter(([, o]) => Object.keys(o).length).map(([k]) => k));
  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);
  const neutral = itemsOfKind("neutral");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Item-ийн контент</h1>
        <p className="text-sm text-muted">
          Item-ээ сонгоод товч тайлбар, чадварын орчуулга, хэрэглэх заавар, зөвлөгөө, тохирох баатрыг засна. Засвар
          нэн даруй сайтад гарна.
        </p>
      </div>
      <Group title="Дэлгүүрийн item" items={[...itemsOfKind("shop")].sort(byName)} edited={edited} />
      {[1, 2, 3, 4, 5].map((t) => (
        <Group
          key={t}
          title={`Neutral item · ${t}-р түвшин`}
          items={neutral.filter((it) => it.tier === t).sort(byName)}
          edited={edited}
        />
      ))}
      <Group title="Enchantment" items={[...itemsOfKind("enchantment")].sort(byName)} edited={edited} />
    </div>
  );
}

export default function AdminItemsPage() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-6">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Админ
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        <List />
      </Suspense>
    </div>
  );
}
