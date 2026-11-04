// data/ хавтас дахь JSON-ийг ажиллах үед уншина. Автомат шинэчлэлт файлыг солиход
// (mtime өөрчлөгдөхөд) дахин уншдаг тул сайтыг дахин build хийх шаардлагагүй.
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data");
const cache = new Map<string, { mtime: number; value: unknown }>();

/** Шинэчлэгдсэн өгөгдлөөр хадгалсан 'use cache' үр дүнг цэвэрлэх tag. */
export const GAME_DATA_TAG = "game-data";

export function readData<T>(file: string, fallback?: T): T {
  const full = path.join(DIR, file);
  let mtime: number;
  try {
    mtime = statSync(full).mtimeMs;
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
  const hit = cache.get(full);
  if (hit && hit.mtime === mtime) return hit.value as T;
  const value = JSON.parse(readFileSync(full, "utf8")) as T;
  cache.set(full, { mtime, value });
  return value;
}

/** Нэг өгөгдлийн хувилбарт (объектын identity) тооцсон утгыг дахин ашиглана. */
export function memo<K extends object, V>(store: WeakMap<K, V>, key: K, compute: () => V): V {
  let v = store.get(key);
  if (v === undefined) {
    v = compute();
    store.set(key, v);
  }
  return v;
}
