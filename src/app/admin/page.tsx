import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ActionButton from "@/components/admin/ActionButton";
import LoginForm from "@/components/admin/LoginForm";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { getMatchupMeta } from "@/lib/matchups";
import { formatDate } from "@/lib/news";
import { readNews } from "@/lib/newsStore";
import { getGameMeta, shortDate } from "@/lib/patch";
import { getUpdateStatus, isHosted, workflowUrl } from "@/lib/updater";
import { deleteNews, logout, setStatus, syncNews, translateItem, updateGameData } from "./actions";

export const metadata: Metadata = { title: "Админ", robots: { index: false } };

function GameDataCard() {
  const meta = getGameMeta();
  const matchups = getMatchupMeta();
  const status = getUpdateStatus();
  const hosted = isHosted();
  const workflow = workflowUrl();
  const rows: [string, string][] = [
    ["Одоогийн патч", `${meta.patch ?? "—"} (${shortDate(meta.patchDate)})`],
    ["Баатар, skill, item", `сүүлд шинэчилсэн ${shortDate(meta.gameDataUpdatedAt)}`],
    ["Статистик", `${matchups.matchCount.toLocaleString("en-US")} тоглолт, ${shortDate(matchups.to)} хүртэл`],
  ];
  if (!hosted)
    rows.push([
      "Сүүлийн автомат шалгалт",
      status.lastRunAt
        ? `${status.lastRunAt.slice(0, 16).replace("T", " ")} — ${status.lastResult === "ok" ? "амжилттай" : "алдаа"}`
        : "одоохондоо болоогүй",
    ]);
  return (
    <section className="space-y-3 rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Тоглоомын өгөгдөл</h2>
        {hosted ? (
          workflow && (
            <a
              href={workflow}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-panel-2 px-2.5 py-1 text-xs font-semibold ring-1 ring-line hover:brightness-110"
            >
              GitHub Actions дээр шинэчлэх ↗
            </a>
          )
        ) : (
          <ActionButton
            action={updateGameData}
            label="Одоо шинэчлэх"
            pendingLabel="Шинэчилж байна… (1–3 минут)"
            className="bg-panel-2 ring-1 ring-line"
          />
        )}
      </div>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {status.lastResult === "error" && status.message && (
        <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-bad/10 p-2 text-[11px] text-bad">{status.message}</pre>
      )}
      <p className="text-xs text-muted">
        {hosted
          ? "GitHub Actions 3 цаг тутам dota2.com-оос шинэ патч шалгаж, гарсан бол баатрын skill, item, neutral item-ийг татаж commit хийнэ — Vercel сайтыг өөрөө дахин deploy хийнэ. Ялах/ялагдах статистик өдөрт нэг шинэчлэгдэнэ."
          : "Сайт ажиллаж байх үед 3 цаг тутам шинэ патч гарсан эсэхийг dota2.com-оос шалгаж, гарсан бол баатрын skill, item, neutral item-ийг автоматаар татна. Ялах/ялагдах статистик өдөрт нэг шинэчлэгдэнэ."}
      </p>
    </section>
  );
}

async function AdminContent() {
  if (!adminConfigured())
    return (
      <p className="rounded-lg border border-line bg-panel p-6 text-sm">
        Админ хэсгийг идэвхжүүлэхийн тулд төслийн <code>.env.local</code> файлд <code>ADMIN_PASSWORD=...</code>{" "}
        тохируулаад серверээ дахин асаана уу.
      </p>
    );
  if (!(await isAdmin())) return <LoginForm />;

  const news = await readNews();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Админ</h1>
        <form action={logout} className="ml-auto">
          <button className="text-sm text-muted hover:text-fg">Гарах</button>
        </form>
      </div>

      <GameDataCard />

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/banners" className="rounded-lg border border-line bg-panel p-4 transition hover:border-gold/60">
          <p className="font-bold">Нүүр хуудасны слайд →</p>
          <p className="text-sm text-muted">Баннерын зураг, гарчиг, холбоос нэмэх, дараалал өөрчлөх.</p>
        </Link>
        <Link href="/admin/patch" className="rounded-lg border border-line bg-panel p-4 transition hover:border-gold/60">
          <p className="font-bold">Патчийн орчуулга →</p>
          <p className="text-sm text-muted">Автоматаар орчуулсан патчийн өөрчлөлтүүдийг засах.</p>
        </Link>
        <Link href="/admin/skills" className="rounded-lg border border-line bg-panel p-4 transition hover:border-gold/60">
          <p className="font-bold">Skill-ийн орчуулга →</p>
          <p className="text-sm text-muted">Баатрын skill, талантын автомат орчуулгыг засах.</p>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Мэдээ</h2>
          <Link href="/admin/news/new" className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110">
            + Шинэ мэдээ нэмэх
          </Link>
          <ActionButton
            action={syncNews}
            label="Steam-ийн албан мэдээ татах"
            pendingLabel="Татаж байна…"
            className="bg-panel-2 ring-1 ring-line"
          />
        </div>
        <p className="text-sm text-muted">
          Мэдээг өөрөө бичиж нэмнэ. Steam-ээс татсан англи мэдээг &quot;Засах&quot; дээр дарж орчуулаад нийтэлж болно
          (&quot;AI орчуулах&quot; нь .env.local дахь ANTHROPIC_API_KEY-тэй үед л ажиллана).
        </p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2">Огноо</th>
                <th className="px-3 py-2">Гарчиг</th>
                <th className="px-3 py-2">Төлөв</th>
                <th className="px-3 py-2">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n) => (
                <tr key={n.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{formatDate(n.date)}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{n.titleMn ?? <span className="text-muted">— орчуулаагүй —</span>}</p>
                    <p className="text-xs text-muted">{n.titleEn || "Админ бичсэн"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        n.status === "published" ? "bg-good/15 text-good" : "bg-panel-2 text-muted"
                      }`}
                    >
                      {n.status === "published" ? "Нийтэлсэн" : "Ноорог"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <Link
                        href={`/admin/news/${n.id}`}
                        className="rounded px-2.5 py-1 text-xs font-semibold ring-1 ring-line hover:bg-panel-2"
                      >
                        Засах
                      </Link>
                      {n.bodyEn && (
                        <ActionButton
                          action={translateItem.bind(null, n.id)}
                          label={n.bodyMn ? "Дахин AI орчуулах" : "AI орчуулах"}
                          pendingLabel="Орчуулж байна…"
                          className="bg-panel-2 ring-1 ring-line"
                        />
                      )}
                      {n.status === "published" ? (
                        <ActionButton action={setStatus.bind(null, n.id, "draft")} label="Нуух" pendingLabel="…" className="bg-panel-2 ring-1 ring-line" />
                      ) : (
                        <ActionButton action={setStatus.bind(null, n.id, "published")} label="Нийтлэх" pendingLabel="…" className="bg-radiant text-white" />
                      )}
                      <ActionButton
                        action={deleteNews.bind(null, n.id)}
                        label="Устгах"
                        pendingLabel="…"
                        confirm={`"${n.titleMn ?? n.titleEn}" мэдээг бүр мөсөн устгах уу?`}
                        className="text-bad ring-1 ring-bad/40"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <Suspense fallback={<p className="text-muted">Ачаалж байна…</p>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
