// Автомат шинэчлэлтийн дотоод дуудлагыг баталгаажуулах токен (ADMIN_PASSWORD-оос гаргана).
import { createHash, timingSafeEqual } from "node:crypto";

export function updateToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password ? createHash("sha256").update(`dota2-mn-update:${password}`).digest("hex") : null;
}

export function isValidUpdateToken(value: string | null) {
  const expected = updateToken();
  if (!expected || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
