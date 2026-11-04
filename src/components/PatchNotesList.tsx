import type { PatchNoteEntry } from "@/lib/patch";

/** Valve-ийн патчийн тэмдэглэл (англи) — шинэ патч эхэндээ. */
export default function PatchNotesList({ entries, limit = 4 }: { entries: PatchNoteEntry[]; limit?: number }) {
  return (
    <div className="space-y-3">
      {entries.slice(0, limit).map((e) => (
        <div key={e.patch}>
          <p className="mb-1 text-xs font-bold text-accent">{e.patch}</p>
          <ul className="space-y-1 text-xs text-fg/85">
            {e.lines.map((l, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-muted">•</span>
                <span>
                  {l.ability && <span className="font-semibold text-gold">{l.ability}: </span>}
                  {l.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
