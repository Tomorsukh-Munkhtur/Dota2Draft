// Энгийн админ нэвтрэлт: .env.local дахь ADMIN_PASSWORD-оор нэвтэрч httpOnly cookie авна.
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";

function token(password: string) {
  return createHash("sha256").update(`dota2-mn-admin:${password}`).digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(password: string) {
  const real = process.env.ADMIN_PASSWORD;
  return Boolean(real) && same(token(password), token(real!));
}

export async function isAdmin() {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value) && same(value!, token(real));
}

/** Server Action бүрийн эхэнд дуудна — action-ууд POST-оор шууд дуудагдаж болно. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Админ эрхээр нэвтрэх шаардлагатай.");
}

export async function startAdminSession() {
  (await cookies()).set(COOKIE, token(process.env.ADMIN_PASSWORD!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}
