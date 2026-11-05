import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { saveItemContent } from "@/app/admin/actions";
import {
  AbilityTextsEditor,
  OptionListEditor,
  StringListEditor,
  TextFieldEditor,
} from "@/components/admin/ContentEditor";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { getHeroes, getItems } from "@/lib/heroes";
import { getItemContentOverrides } from "@/lib/itemContentStore";
import { readItemContentFile } from "@/lib/items";

export const metadata: Metadata = { title: "Item-ийн контент засах", robots: { index: false } };

const ABILITY_TYPE: Record<string, string> = { active: "Идэвхтэй", passive: "Пассив", toggle: "Асаах/унтраах", use: "Хэрэглээ" };

async function Editor({ itemKey }: { itemKey: string }) {
  if (!(await isAdmin())) return <LoginForm />;
  const item = getItems()[itemKey];
  if (!item || item.kind === "legacy") notFound();

  const [file, overrides] = await Promise.all([readItemContentFile(itemKey), getItemContentOverrides()]);
  const o = overrides[itemKey] ?? {};
  const save = saveItemContent.bind(null, itemKey);
  const heroOptions = [...getHeroes()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((h) => ({ value: h.slug, label: h.name }));
  const backHref = item.kind === "shop" ? "/items" : "/items/neutral";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Image src={item.img} alt="" width={88} height={64} className="h-16 w-[88px] rounded-lg" />
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <Link href={`/items/${itemKey}`} target="_blank" className="text-sm text-gold hover:underline">
            Сайт дээр харах ↗
          </Link>
          <span className="ml-3 text-xs text-muted">
            <Link href={backHref} className="hover:text-fg">
              {item.kind === "shop" ? "Items" : "Neutral items"}
            </Link>
          </span>
        </div>
      </div>
      {!file && (
        <p className="rounded-lg border border-line bg-panel p-3 text-sm text-muted">
          Энэ item-д монгол контент хараахан алга. Доор бичиж хадгалбал сайтад гарна.
        </p>
      )}

      <TextFieldEditor
        save={save}
        field="summary"
        title="Товч тайлбар"
        original={file?.summary ?? ""}
        value={o.summary ?? null}
        rows={3}
        reference={item.lore ? { label: "Англи lore (Valve)", text: item.lore } : undefined}
      />

      {item.abilities.length > 0 && (
        <AbilityTextsEditor
          save={save}
          abilities={item.abilities.map((a) => ({
            title: a.title,
            type: ABILITY_TYPE[a.type] ?? a.type,
            en: a.description,
          }))}
          original={file?.abilities ?? []}
          value={o.abilities ?? null}
        />
      )}

      <TextFieldEditor
        save={save}
        field="usage"
        title="Хэрэглэх заавар"
        original={file?.usage ?? ""}
        value={o.usage ?? null}
        rows={8}
      />

      <StringListEditor
        save={save}
        field="tips"
        title="Зөвлөгөө"
        addLabel="Зөвлөгөө нэмэх"
        original={file?.tips ?? []}
        value={o.tips ?? null}
      />

      <OptionListEditor
        save={save}
        field="goodFor"
        title="Тохирох баатрууд"
        addLabel="Баатар нэмэх"
        placeholder="Баатар сонгох"
        original={file?.goodFor ?? []}
        value={o.goodFor ?? null}
        options={heroOptions}
      />
    </div>
  );
}

export default function AdminItemPage({ params }: PageProps<"/admin/items/[key]">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-6">
      <Link href="/admin/items" className="text-sm text-muted hover:text-fg">
        ← Бүх item
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        {params.then(({ key }) => (
          <Editor itemKey={key} />
        ))}
      </Suspense>
    </div>
  );
}
