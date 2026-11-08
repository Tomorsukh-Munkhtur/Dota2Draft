import type { HeroAbility, HeroKit } from "@/lib/heroes";
import AbilityIcon from "./AbilityIcon";

const DAMAGE: Record<string, string> = { physical: "Физик", magical: "Ид шидийн", pure: "Цэвэр (pure)" };
const DISPEL: Record<string, string> = {
  strong: "Зөвхөн хүчтэй dispel арилгана",
  yes: "Dispel-ээр арилна",
  no: "Dispel-ээр арилахгүй",
};

function Tag({ children, tone = "muted" }: { children: string; tone?: "muted" | "gold" | "int" }) {
  const cls = { muted: "bg-panel-2 text-muted", gold: "bg-gold/15 text-gold", int: "bg-int/15 text-int" }[tone];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

export function Ability({ a, showIcon = true }: { a: HeroAbility; showIcon?: boolean }) {
  const facts = [
    a.cooldown && `Cooldown: ${a.cooldown}с`,
    a.manaCost && `Мана: ${a.manaCost}`,
    a.damageType && `Хохирол: ${DAMAGE[a.damageType]}`,
    a.piercesImmunity !== null && (a.piercesImmunity ? "Debuff дархлааг нэвтэлнэ" : "Debuff дархлааг нэвтлэхгүй"),
    a.dispellable && DISPEL[a.dispellable],
  ].filter(Boolean) as string[];

  return (
    <div className="flex gap-3 border-t border-line pt-4 first:border-0 first:pt-0">
      {showIcon && <AbilityIcon src={a.img} name={a.name} />}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-semibold">{a.name}</h3>
          {a.ultimate && <Tag tone="gold">Ульт</Tag>}
          {a.innate && <Tag>Төрөлхийн</Tag>}
          {a.passive && !a.innate && <Tag>Пассив</Tag>}
          {a.fromScepter && <Tag tone="int">Aghanim&apos;s Scepter</Tag>}
          {a.fromShard && <Tag tone="int">Aghanim&apos;s Shard</Tag>}
        </div>
        <p className="whitespace-pre-line text-sm text-fg/85">{a.desc}</p>
        {a.values.length > 0 && (
          <dl className="grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
            {a.values.map((v, i) => (
              <div key={i} className="flex justify-between gap-2">
                {/* Valve зарим нэрэнд <font color=…> тэмдэглэгээ оруулдаг — текстээр нь харуулахгүй. */}
                <dt className="text-muted">{v.label.replace(/<[^>]+>/g, "")}</dt>
                <dd className="tabular-nums">{v.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {facts.length > 0 && <p className="text-xs text-muted">{facts.join(" · ")}</p>}
        {(a.scepter || a.shard) && (
          <div className="space-y-1 rounded bg-int/5 p-2 text-xs">
            {a.scepter && (
              <p>
                <span className="font-semibold text-int">Aghanim&apos;s Scepter: </span>
                {a.scepter}
              </p>
            )}
            {a.shard && (
              <p>
                <span className="font-semibold text-int">Aghanim&apos;s Shard: </span>
                {a.shard}
              </p>
            )}
          </div>
        )}
        {a.notes.length > 0 && (
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-fg">Нэмэлт тэмдэглэл ({a.notes.length})</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {a.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

export function TalentTree({ kit }: { kit: HeroKit }) {
  return (
    <div className="space-y-1.5">
      {[...kit.talents].reverse().map((t) => (
        <div key={t.level} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
          <span className="rounded bg-panel-2 px-2 py-1.5 text-right">{t.options[1] ?? ""}</span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/15 font-bold text-gold">{t.level}</span>
          <span className="rounded bg-panel-2 px-2 py-1.5">{t.options[0] ?? ""}</span>
        </div>
      ))}
    </div>
  );
}
