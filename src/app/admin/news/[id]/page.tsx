import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EditForm from "@/components/admin/EditForm";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { readNews } from "@/lib/newsStore";

async function Editor({ id }: { id: string }) {
  if (!(await isAdmin())) return <LoginForm />;
  const item = (await readNews()).find((n) => n.id === id);
  if (!item) notFound();
  // Админ өөрөө бичсэн мэдээнд англи эх байхгүй.
  if (!item.bodyEn)
    return (
      <section className="max-w-[900px] space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Мэдээ засах</h2>
        <EditForm item={item} />
      </section>
    );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Монгол орчуулга</h2>
        <EditForm item={item} />
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Англи эх</h2>
        <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-line bg-panel p-4">
          <h3 className="mb-3 text-lg font-bold">{item.titleEn}</h3>
          <div className="prose-mn text-sm text-fg/85">
            <Markdown remarkPlugins={[remarkGfm]}>{item.bodyEn}</Markdown>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function EditNewsPage({ params }: PageProps<"/admin/news/[id]">) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Мэдээний жагсаалт
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        {params.then(({ id }) => (
          <Editor id={id} />
        ))}
      </Suspense>
    </div>
  );
}
