"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "@/app/admin/actions";

// Баатар, item-ийн контент засах нийтлэг хэсгүүд. `save` нь тухайн баатар/item-д холбогдсон server action
// (saveHeroContent.bind(null, slug) гэх мэт); талбарын нэрээр { [field]: утга } илгээнэ, null бол анхных руу буцаана.

type Saver = { save(patch: Record<string, unknown>): Promise<ActionState> };
type Option = { value: string; label: string };

const input = "w-full rounded border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-gold";
const removeBtn = "self-start rounded px-2 py-1.5 text-xs text-bad ring-1 ring-bad/40 hover:bg-bad/10";
const addBtn = "rounded px-2.5 py-1.5 ring-1 ring-line hover:bg-panel-2";

/** Засварын төлөв: одоогийн утга, хадгалсан утга, админ зассан эсэх, хадгалах/буцаах үйлдэл. */
function useField<T>(save: Saver["save"], field: string, original: T, value: T | null) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionState>(null);
  const [edited, setEdited] = useState(value !== null);
  const [current, setCurrent] = useState<T>(value ?? original);
  const [saved, setSaved] = useState(JSON.stringify(value ?? original));
  const run = (payload: T | null, after: () => void) =>
    start(async () => {
      const r = await save({ [field]: payload });
      setMsg(r);
      if (r?.ok) after();
    });
  return {
    current,
    setCurrent,
    pending,
    msg,
    edited,
    dirty: JSON.stringify(current) !== saved,
    onSave: () =>
      run(current, () => {
        setSaved(JSON.stringify(current));
        setEdited(true);
      }),
    onReset: () =>
      run(null, () => {
        setCurrent(original);
        setSaved(JSON.stringify(original));
        setEdited(false);
      }),
  };
}

type SectionState = {
  edited: boolean;
  dirty: boolean;
  pending: boolean;
  msg: ActionState;
  onSave: () => void;
  onReset: () => void;
};

function Section({
  title,
  state,
  extra,
  children,
}: {
  title: string;
  state: SectionState;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const { edited, dirty, pending, msg, onSave, onReset } = state;
  return (
    <section className="space-y-3 rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{title}</h2>
        <span className={`text-xs ${edited ? "text-gold" : "text-muted"}`}>{edited ? "Админ зассан" : "Анхны текст"}</span>
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {extra}
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={onSave}
          className="rounded bg-accent px-3 py-1.5 font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {edited && (
          <button type="button" disabled={pending} onClick={onReset} className="text-muted underline hover:text-fg">
            Анхны текст рүү буцаах
          </button>
        )}
        {msg?.error && <span className="text-bad">{msg.error}</span>}
        {msg?.ok && !dirty && <span className="text-good">{msg.ok}</span>}
      </div>
    </section>
  );
}

/** Нэг текст талбар (тойм, түүх, заавар). */
export function TextFieldEditor({
  save,
  field,
  title,
  original,
  value,
  rows = 4,
  reference,
}: Saver & {
  field: string;
  title: string;
  original: string;
  value: string | null;
  rows?: number;
  reference?: { label: string; text: string };
}) {
  const state = useField(save, field, original, value);
  return (
    <Section title={title} state={state}>
      <textarea value={state.current} onChange={(e) => state.setCurrent(e.target.value)} rows={rows} className={input} />
      {reference?.text && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer hover:text-fg">{reference.label}</summary>
          <p className="mt-2 whitespace-pre-line rounded bg-bg/60 p-2 text-fg/75">{reference.text}</p>
        </details>
      )}
    </Section>
  );
}

/** Мөр мөрөөр нэмж/хасаж болох текстүүд (зөвлөгөө). */
export function StringListEditor({
  save,
  field,
  title,
  addLabel,
  original,
  value,
}: Saver & { field: string; title: string; addLabel: string; original: string[]; value: string[] | null }) {
  const state = useField(save, field, original, value);
  const { current: list, setCurrent: setList } = state;
  return (
    <Section
      title={title}
      state={state}
      extra={
        <button type="button" onClick={() => setList([...list, ""])} className={addBtn}>
          + {addLabel}
        </button>
      }
    >
      <ul className="space-y-2">
        {list.map((t, i) => (
          <li key={i} className="flex gap-2">
            <textarea
              value={t}
              onChange={(e) => setList(list.map((x, k) => (k === i ? e.target.value : x)))}
              rows={2}
              className={input}
            />
            <button type="button" onClick={() => setList(list.filter((_, k) => k !== i))} className={removeBtn} aria-label="Хасах">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Жагсаалтаас сонгох утгууд (ойролцоо/тохирох баатрууд). */
export function OptionListEditor({
  save,
  field,
  title,
  addLabel,
  placeholder,
  original,
  value,
  options,
}: Saver & {
  field: string;
  title: string;
  addLabel: string;
  placeholder: string;
  original: string[];
  value: string[] | null;
  options: Option[];
}) {
  const state = useField(save, field, original, value);
  const { current: list, setCurrent: setList } = state;
  return (
    <Section
      title={title}
      state={state}
      extra={
        <button type="button" onClick={() => setList([...list, ""])} className={addBtn}>
          + {addLabel}
        </button>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((s, i) => (
          <li key={i} className="flex gap-2">
            <select value={s} onChange={(e) => setList(list.map((x, k) => (k === i ? e.target.value : x)))} className={input}>
              <option value="">— {placeholder} —</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setList(list.filter((_, k) => k !== i))} className={removeBtn} aria-label="Хасах">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

type CounterItem = { item: string; reason: string };

/** Баатрын "Эсрэг авах item": item сонгох + тайлбар. */
export function CounterItemsEditor({
  save,
  original,
  value,
  options,
}: Saver & { original: CounterItem[]; value: CounterItem[] | null; options: Option[] }) {
  const state = useField(save, "counterItems", original, value);
  const { current: list, setCurrent: setList } = state;
  const set = (i: number, patch: Partial<CounterItem>) => setList(list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  return (
    <Section
      title="Эсрэг авах item"
      state={state}
      extra={
        <button type="button" onClick={() => setList([...list, { item: "", reason: "" }])} className={addBtn}>
          + Item нэмэх
        </button>
      }
    >
      <ul className="space-y-3">
        {list.map((c, i) => (
          <li key={i} className="grid gap-2 sm:grid-cols-[220px_1fr_auto]">
            <select value={c.item} onChange={(e) => set(i, { item: e.target.value })} className={input}>
              <option value="">— Item сонгох —</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <textarea
              value={c.reason}
              onChange={(e) => set(i, { reason: e.target.value })}
              rows={2}
              placeholder="Яагаад энэ баатрын эсрэг сайн вэ?"
              className={input}
            />
            <button type="button" onClick={() => setList(list.filter((_, k) => k !== i))} className={removeBtn} aria-label="Хасах">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

type AbilityText = { title: string; description: string };

/** Item-ийн чадвар бүрийн монгол тайлбар (англи эх нь хажууд). */
export function AbilityTextsEditor({
  save,
  abilities,
  original,
  value,
}: Saver & {
  abilities: { title: string; type: string; en: string }[];
  original: AbilityText[];
  value: AbilityText[] | null;
}) {
  // Чадвар бүрт нэг мөр — орчуулгагүй бол хоосон.
  const fill = (list: AbilityText[]) =>
    abilities.map((a) => ({ title: a.title, description: list.find((x) => x.title === a.title)?.description ?? "" }));
  const state = useField(save, "abilities", fill(original), value ? fill(value) : null);
  const { current: list, setCurrent: setList } = state;
  return (
    <Section title="Чадварын орчуулга" state={state}>
      <ul className="space-y-4">
        {abilities.map((a, i) => (
          <li key={a.title} className="grid gap-2 border-t border-line pt-3 first:border-0 first:pt-0 md:grid-cols-2">
            <div className="text-sm">
              <p className="mb-1 font-semibold">
                {a.title} <span className="text-[10px] uppercase tracking-wide text-muted">{a.type}</span>
              </p>
              <p className="whitespace-pre-line text-fg/75">{a.en}</p>
            </div>
            <textarea
              value={list[i]?.description ?? ""}
              onChange={(e) => setList(list.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)))}
              rows={5}
              placeholder="Монгол тайлбар (хоосон бол англиар харагдана)"
              className={input}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
