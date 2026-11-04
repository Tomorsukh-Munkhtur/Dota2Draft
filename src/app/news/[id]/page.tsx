import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate, getPublishedNewsItem } from "@/lib/news";

export async function generateMetadata({ params }: PageProps<"/news/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = await getPublishedNewsItem(id);
  return item ? { title: item.titleMn ?? item.titleEn, description: item.summaryMn ?? undefined } : {};
}

async function Article({ id }: { id: string }) {
  const item = await getPublishedNewsItem(id);
  if (!item) notFound();
  return (
    <article className="space-y-4">
      <p className="text-sm text-muted">{formatDate(item.date)}</p>
      <h1 className="text-3xl font-black leading-tight">{item.titleMn}</h1>
      <div className="prose-mn text-fg/90">
        <Markdown remarkPlugins={[remarkGfm]}>{item.bodyMn}</Markdown>
      </div>
      {item.sourceUrl && (
        <p className="border-t border-line pt-4 text-sm text-muted">
          Эх сурвалж:{" "}
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline">
            {item.titleEn || item.sourceUrl}
          </a>
        </p>
      )}
    </article>
  );
}

export default function NewsItemPage({ params }: PageProps<"/news/[id]">) {
  return (
    <div className="mx-auto max-w-[800px] space-y-6 px-4 py-6">
      <Link href="/news" className="text-sm text-muted hover:text-fg">
        ← Бүх мэдээ
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        {params.then(({ id }) => (
          <Article id={id} />
        ))}
      </Suspense>
    </div>
  );
}
