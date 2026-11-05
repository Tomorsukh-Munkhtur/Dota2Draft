"use client";

import { useState, useTransition } from "react";
import { savePatchTranslation } from "@/app/admin/actions";

/**
 * Орчуулах нэг мөр. `inBaseline` — анх бөөнөөр нь зөвшөөрсөн машин орчуулгатай (сайтад монголоор харагддаг);
 * худал бол шинээр гарсан мөр: `mn` нь зөвхөн Google-ийн санал, админ батлах хүртэл сайтад англиар харагдана.
 */
export type EditorLine = { en: string; mn: string; edited: boolean; inBaseline: boolean; context: string };

const isPending = (edited: boolean, inBaseline: boolean) => !edited && !inBaseline;

function Row({ line }: { line: EditorLine }) {
  const [value, setValue] = useState(line.mn);
  const [saved, setSaved] = useState(line.mn);
  const [edited, setEdited] = useState(line.edited);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, start] = useTransition();
  const dirty = value !== saved;
  const pending = isPending(edited, line.inBaseline);

  const save = (next: string) =>
    start(async () => {
      const result = await savePatchTranslation(line.en, next);
      setMsg(result);
      if (result?.ok) {
        setSaved(next);
        setEdited(Boolean(next.trim()));
      }
    });

  return (
    <li className={`grid gap-2 border-t border-line py-3 md:grid-cols-2 ${pending ? "bg-gold/[0.04]" : ""}`}>
      <div className="text-sm">
        <p className="text-[11px] uppercase tracking-wide text-muted">{line.context}</p>
        <p className="text-fg/80">{line.en}</p>
      </div>
      <div className="space-y-1">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          className={`w-full rounded border bg-bg px-2 py-1.5 text-sm outline-none focus:border-gold ${
            pending ? "border-gold/50" : "border-line"
          }`}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={edited ? "text-gold" : pending ? "font-semibold text-gold" : "text-muted"}>
            {edited ? "Админ баталсан" : pending ? "Батлагдаагүй — сайтад англиар" : "Машин орчуулга"}
          </span>
          {(dirty || pending) && (
            <button
              disabled={busy || !value.trim()}
              onClick={() => save(value)}
              className="rounded bg-accent px-2.5 py-1 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "…" : pending && !dirty ? "Батлах" : "Хадгалах"}
            </button>
          )}
          {edited && !dirty && (
            <button disabled={busy} onClick={() => save("")} className="text-muted underline hover:text-fg">
              {line.inBaseline ? "Машин орчуулга руу буцаах" : "Батламжаа цуцлах"}
            </button>
          )}
          {msg?.error && <span className="text-bad">{msg.error}</span>}
          {msg?.ok && !dirty && <span className="text-good">{msg.ok}</span>}
        </div>
      </div>
    </li>
  );
}

export default function PatchTranslationEditor({ lines, showFilter = true }: { lines: EditorLine[]; showFilter?: boolean }) {
  const [filter, setFilter] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const pendingCount = lines.filter((l) => isPending(l.edited, l.inBaseline)).length;
  const q = filter.trim().toLowerCase();
  const shown = lines.filter(
    (l) =>
      (!q || `${l.context} ${l.en} ${l.mn}`.toLowerCase().includes(q)) &&
      (!onlyPending || isPending(l.edited, l.inBaseline)),
  );
  return (
    <div className="space-y-2">
      {showFilter && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Хайх (баатар, item, үг)…"
            className="w-full max-w-sm rounded border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {pendingCount > 0 && (
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gold">
              <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
              Зөвхөн батлагдаагүй ({pendingCount})
            </label>
          )}
          <p className="text-xs text-muted">{shown.length} мөр</p>
        </div>
      )}
      <ul>
        {shown.map((l) => (
          <Row key={l.en} line={l} />
        ))}
      </ul>
    </div>
  );
}
