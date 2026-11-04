import Link from "next/link";

const TABS = [
  { href: "/items", label: "Дэлгүүрийн item" },
  { href: "/items/neutral", label: "Neutral item" },
] as const;

export default function ItemTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <div className="flex rounded-lg border border-line bg-panel p-0.5 text-sm">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-md px-4 py-1.5 transition ${
            active === t.href ? "bg-accent text-white" : "text-muted hover:text-fg"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
