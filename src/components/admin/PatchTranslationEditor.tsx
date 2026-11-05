"use client";

import { useState, useTransition } from "react";
import { savePatchTranslation } from "@/app/admin/actions";

export type EditorLine = { en: string; mn: string; edited: boolean; context: string };

function Row({ line }: { line: EditorLine }) {
  const [value, setValue] = useState(line.mn);
  const [saved, setSaved] = useState(line.mn);
  const [edited, setEdited] = useState(line.edited);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = value !== saved;

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
    <li className="grid gap-2 border-t border-line py-3 md:grid-cols-2">
      <div className="text-sm">
        <p className="text-[11px] uppercase tracking-wide text-muted">{line.context}</p>
        <p className="text-fg/80">{line.en}</p>
      </div>
      <div className="space-y-1">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          className="w-full rounded border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-gold"
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={edited ? "text-gold" : "text-muted"}>{edited ? "Админ зассан" : "Машин орчуулга"}</span>
          {dirty && (
            <button disabled={pending} onClick={() => save(value)} className="rounded bg-accent px-2.5 py-1 font-semibold text-white disabled:opacity-50">
              {pending ? "…" : "Хадгалах"}
            </button>
          )}
          {edited && !dirty && (
            <button disabled={pending} onClick={() => save("")} className="text-muted underline hover:text-fg">
              Машин орчуулга руу буцаах
            </button>
          )}
          {msg?.error && <span className="text-bad">{msg.error}</span>}
          {msg?.ok && !dirty && <span className="text-good">{msg.ok}</span>}
        </div>
      </div>
    </li>
  );
}

export default function PatchTranslationEditor({ lines }: { lines: EditorLine[] }) {
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();
  const shown = q ? lines.filter((l) => `${l.context} ${l.en} ${l.mn}`.toLowerCase().includes(q)) : lines;
  return (
    <div className="space-y-2">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Хайх (баатар, item, үг)…"
        className="w-full max-w-sm rounded border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <p className="text-xs text-muted">{shown.length} мөр</p>
      <ul>
        {shown.map((l) => (
          <Row key={l.en} line={l} />
        ))}
      </ul>
    </div>
  );
}
