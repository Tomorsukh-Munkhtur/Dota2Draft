import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CreateNewsForm from "@/components/admin/CreateNewsForm";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Шинэ мэдээ", robots: { index: false } };

async function Gate() {
  if (!(await isAdmin())) return <LoginForm />;
  return (
    <section className="space-y-4 rounded-lg border border-line bg-panel p-5">
      <h1 className="text-xl font-bold">Шинэ мэдээ нэмэх</h1>
      <CreateNewsForm />
    </section>
  );
}

export default function NewNewsPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Админ
      </Link>
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        <Gate />
      </Suspense>
    </div>
  );
}
