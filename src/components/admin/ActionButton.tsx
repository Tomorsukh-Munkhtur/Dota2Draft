"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

/** Server Action дуудах товч: дуудаж байх үед идэвхгүй болж, үр дүнгийн мессежийг харуулна. */
export default function ActionButton({
  action,
  label,
  pendingLabel,
  className = "",
  confirm,
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel: string;
  className?: string;
  /** Өгвөл дарахаас өмнө баталгаажуулалт асууна. */
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(() => action(), null);
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-0.5"
    >
      <button
        disabled={pending}
        className={`rounded px-2.5 py-1 text-xs font-semibold transition hover:brightness-110 disabled:opacity-50 ${className}`}
      >
        {pending ? pendingLabel : label}
      </button>
      {state?.error && <span className="max-w-[320px] whitespace-pre-line text-[11px] text-bad">{state.error}</span>}
      {state?.ok && <span className="text-[11px] text-good">{state.ok}</span>}
    </form>
  );
}
