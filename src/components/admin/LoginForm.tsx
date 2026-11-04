"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, run, pending] = useActionState(login, null);
  return (
    <form action={run} className="mx-auto max-w-sm space-y-3 rounded-lg border border-line bg-panel p-6">
      <h1 className="text-lg font-bold">Админ нэвтрэх</h1>
      <input
        type="password"
        name="password"
        required
        autoComplete="current-password"
        placeholder="Нууц үг"
        className="w-full rounded border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
      />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <button disabled={pending} className="w-full rounded bg-accent py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
