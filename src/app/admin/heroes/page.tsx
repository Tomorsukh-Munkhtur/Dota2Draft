import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { getHeroContentOverrides } from "@/lib/heroContentStore";
import { getHeroes } from "@/lib/heroes";

export const metadata: Metadata = { title: "Баатрын контент", robots: { index: false } };

async function List() {
  if (!(await isAdmin())) return <LoginForm />;
  const overrides = await getHeroContentOverrides();
  const heroes = [...getHeroes()].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Баатрын контент</h1>
      <p className="text-sm text-muted">
        Баатраа сонгоод тойм, түүх, skill, талант, эсрэг авах item, зөвлөгөө, ойролцоо баатрыг засна. Засвар нэн даруй
        сайтад гарна.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {heroes.map((h) => {
          const edited = Object.keys(overrides[h.slug] ?? {}).length > 0;
          return (
            <li key={h.slug}>
              <Link
                href={`/admin/heroes/${h.slug}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel p-1.5 pr-2 text-sm transition hover:border-gold/60"
              >
                <Image src={h.img} alt="" width={64} height={36} className="h-9 w-16 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate">{h.name}</span>
                {edited && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" title="Админ зассан" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminHeroesPage() {
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
