import Image from "next/image";
import Link from "next/link";
import { getAttention, type AttentionRow } from "@/lib/attention";
import ReviewButton from "./ReviewButton";

function Row({ row, reviewable, undo }: { row: AttentionRow; reviewable: boolean; undo?: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-bg/40 p-1.5 pr-2">
      <Link href={row.href} className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:text-gold">
        {row.img && <Image src={row.img} alt="" width={48} height={28} className="h-7 w-12 shrink-0 rounded-sm object-cover" />}
        <span className="min-w-0 flex-1 truncate">{row.label}</span>
        {row.note && <span className="shrink-0 text-[11px] text-muted">{row.note}</span>}
      </Link>
      {reviewable && <ReviewButton reviewKey={row.key} undo={undo} />}
    </li>
  );
}

/** Админы нүүрний "Анхаарах зүйлс": мөр бүр засварлах хуудас руу холбоотой. */
export default async function AttentionPanel() {
  const { groups, reviewed } = await getAttention();
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  return (
    <section className="space-y-4 rounded-lg border border-gold/40 bg-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">
          Анхаарах зүйлс{" "}
          {total > 0 && <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">{total}</span>}
        </h2>
        <p className="text-xs text-muted">Шинэ, өөрчлөгдсөн текст админ батлах хүртэл сайтад англиар харагдана.</p>
      </div>

      {total === 0 && <p className="text-sm text-good">Анхаарах зүйл алга ✓</p>}

      {groups.map((g) => (
        <details key={g.id} open={g.rows.length <= 60} className="group space-y-2">
          <summary className="cursor-pointer list-none">
            <span className="text-sm font-semibold text-gold">
              {g.title} <span className="text-muted">({g.rows.length})</span>
            </span>
            <span className="ml-2 text-[11px] text-muted">{g.hint}</span>
          </summary>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {g.rows.map((r) => (
              <Row key={r.key} row={r} reviewable={g.reviewable} />
            ))}
          </ul>
        </details>
      ))}

      {reviewed.length > 0 && (
        <details className="space-y-2 border-t border-line pt-3">
          <summary className="cursor-pointer text-xs text-muted hover:text-fg">Шалгасан ({reviewed.length})</summary>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {reviewed.map((r) => (
              <Row key={r.key} row={r} reviewable undo />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
