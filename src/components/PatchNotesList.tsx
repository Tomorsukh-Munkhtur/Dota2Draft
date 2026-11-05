import Link from "next/link";
import { getPatches, getPatchTranslator, type PatchNoteEntry } from "@/lib/patch";

/** Valve-ийн патчийн тэмдэглэл — монгол орчуулгатай (хулганаа барихад англи эх нь), шинэ патч эхэндээ. */
export default async function PatchNotesList({ entries, limit = 4 }: { entries: PatchNoteEntry[]; limit?: number }) {
  const tr = await getPatchTranslator();
  const { latest } = getPatches();
  return (
    <div className="space-y-3">
      {entries.slice(0, limit).map((e) => (
        <div key={e.patch}>
          <Link
            href={e.patch === latest ? "/patch" : `/patch/${e.patch}`}
            className="mb-1 inline-block font-display text-xs font-bold text-accent hover:underline"
          >
            {e.patch}
          </Link>
          <ul className="space-y-1 text-xs text-fg/85">
            {e.lines.map((l, i) => (
              <li key={i} className="flex gap-1.5" title={l.text}>
                <span className="text-muted">•</span>
                <span>
                  {l.ability && <span className="font-semibold text-gold">{l.ability}: </span>}
                  {tr(l.text)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
