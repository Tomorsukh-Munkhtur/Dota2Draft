import { readData } from "./data";

export type GameMeta = {
  patch?: string;
  patchDate?: string;
  gameDataUpdatedAt?: string;
  matchupsUpdatedAt?: string;
  source?: string;
};

export type PatchNoteEntry = { patch: string; lines: { ability: string | null; text: string }[] };

type PatchNotesFile = {
  major: string;
  patches: string[];
  heroes: Record<string, PatchNoteEntry[]>;
  items: Record<string, { patch: string; lines: string[] }[]>;
};

/** Сайтын өгөгдөл аль патчийнх болох, хэзээ шинэчлэгдсэн. */
export function getGameMeta(): GameMeta {
  return readData<GameMeta>("meta.json", {});
}

const EMPTY: PatchNotesFile = { major: "", patches: [], heroes: {}, items: {} };

export function getHeroPatchNotes(slug: string) {
  const notes = readData<PatchNotesFile>("patch-notes.json", EMPTY);
  return { major: notes.major, entries: notes.heroes[slug] ?? [] };
}

export function getItemPatchNotes(key: string) {
  const notes = readData<PatchNotesFile>("patch-notes.json", EMPTY);
  return { major: notes.major, entries: notes.items[key] ?? [] };
}

/** ISO огноог "2026.09.15" хэлбэрээр. */
export function shortDate(iso?: string) {
  return iso ? iso.slice(0, 10).replace(/-/g, ".") : "—";
}
