"use client";

import { useMemo } from "react";
import { CM_STEPS, type Action, type DraftData, type Side } from "@/lib/draft";
import { other, type CmState } from "./cmState";
import HeroThumb from "./HeroThumb";

// Тоглоомын Captain's Mode-ын самбар шиг: голд 1–24 дугаар, бан нь жижиг, пик нь том нүд,
// тухайн алхмыг хийх багийн талд байрлана.
const COL = 96; // нэг талын баганын өргөн
const MID = 36; // дугаарын баганын өргөн
const WIDTH = COL * 2 + MID;
const SIZE: Record<Action, { w: number; h: number }> = { ban: { w: 42, h: 24 }, pick: { w: 64, h: 36 } };
const GAP = 3; // нэг талын нүднүүдийн хоорондох зай
const NUM_GAP = 14; // дараалсан дугааруудын хамгийн бага босоо зай

const SIDE_LABEL: Record<Side, string> = { radiant: "Radiant", dire: "Dire" };
const SIDE_TEXT: Record<Side, string> = { radiant: "text-radiant", dire: "text-dire" };

type Slot = { i: number; side: Side; action: Action; top: number; num: number; w: number; h: number };

/** Нүд бүрийн босоо байрлал: тал бүрт давхцахгүй, дугаарууд дарааллаараа доошилно. */
function layout(firstPick: Side) {
  const bottom: Record<Side, number> = { radiant: -GAP, dire: -GAP };
  let prev = -Infinity;
  const slots: Slot[] = CM_STEPS.map((s, i) => {
    const side = s.order === "first" ? firstPick : other(firstPick);
    const { w, h } = SIZE[s.action];
    const top = Math.max(0, bottom[side] + GAP, prev + NUM_GAP - h / 2);
    bottom[side] = top + h;
    prev = top + h / 2;
    return { i, side, action: s.action, top, num: top + h / 2, w, h };
  });
  return { slots, height: Math.max(bottom.radiant, bottom.dire) };
}

function Crown({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 18H5L3 7.5zM5 19.5h14V21H5z" />
    </svg>
  );
}

type Props = {
  data: DraftData;
  cm: CmState;
  mySide: Side;
  timerOn: boolean;
  onHero: (hero: number) => void;
  onCaptain: (side: Side) => void;
  onSkipBan: () => void;
};

export default function CmTimeline({ data, cm, mySide, timerOn, onHero, onCaptain, onSkipBan }: Props) {
  const { slots, height } = useMemo(() => layout(cm.firstPick), [cm.firstPick]);
  const current = cm.picks.length;
  const step = CM_STEPS[current];
  const stepSide = slots[current]?.side ?? null;

  return (
    <section
      aria-label="Captain's Mode драфт"
      className="relative mx-auto w-fit overflow-hidden rounded-lg bg-[#10161f] p-3 ring-1 ring-white/10"
    >
      {/* Ээлж нь болсон багийн талыг өнгөөр гэрэлтүүлнэ. */}
      <div
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-radiant/40 via-radiant/10 to-transparent transition-opacity duration-500 ${
          stepSide === "radiant" ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-dire/40 via-dire/10 to-transparent transition-opacity duration-500 ${
          stepSide === "dire" ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative" style={{ width: WIDTH }}>
        {/* Captain болох: аль талаас зөвлөмж авах вэ */}
        <div className="mb-3 overflow-hidden rounded bg-[#1c2531] ring-1 ring-white/10">
          <p className="flex items-center justify-center gap-2 py-1.5 font-display text-sm font-bold uppercase tracking-wider text-fg/90">
            <Crown /> Become captain
          </p>
          <div className="grid grid-cols-2 border-t border-white/10">
            {(["radiant", "dire"] as Side[]).map((side) => {
              const on = mySide === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => onCaptain(side)}
                  aria-pressed={on}
                  className={`flex items-center justify-center gap-1 py-2 font-display text-xs font-bold uppercase tracking-wide transition ${
                    on
                      ? side === "radiant"
                        ? "bg-radiant/25 text-radiant"
                        : "bg-dire/25 text-dire"
                      : "text-muted hover:bg-white/5 hover:text-fg"
                  }`}
                >
                  {on && <Crown className="h-3.5 w-3.5" />}
                  {SIDE_LABEL[side]}
                </button>
              );
            })}
          </div>
        </div>
        {/* Багуудын нэр, нөөц цаг, одоогийн алхмын цаг */}
        <div className="mb-2 grid items-end" style={{ gridTemplateColumns: `${COL}px ${MID}px ${COL}px` }}>
          {(["radiant", "dire"] as Side[]).map((side, k) => (
            <div key={side} className={`text-center ${k === 1 ? "col-start-3" : ""}`}>
              <p
                className={`font-display text-sm font-extrabold uppercase tracking-widest transition ${SIDE_TEXT[side]} ${
                  stepSide === side ? "drop-shadow-[0_0_8px_currentColor]" : "opacity-60"
                }`}
              >
                {SIDE_LABEL[side]}
              </p>
              <p className="h-4 text-[10px] text-muted">
                {mySide === side ? (
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    <Crown className="h-3 w-3" /> Таны баг
                  </span>
                ) : (
                  "Эсрэг баг"
                )}
              </p>
              {timerOn && <p className="text-[10px] tabular-nums text-muted">нөөц {cm.reserve[side]}с</p>}
            </div>
          ))}
          {timerOn && step && (
            <p className="col-start-2 row-start-1 self-center text-center font-display text-lg font-extrabold tabular-nums text-gold">
              {cm.stepLeft}
            </p>
          )}
        </div>

        {/* Одоогийн алхам */}
        <div className="mb-3 rounded bg-black/45 px-2 py-1.5 text-center ring-1 ring-white/5">
          {step && stepSide ? (
            <>
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                <span className="text-muted">{current + 1}. </span>
                <span className={SIDE_TEXT[stepSide]}>{SIDE_LABEL[stepSide]}</span>{" "}
                {step.action === "ban" ? "бан" : "пик"}
              </p>
              <p className="text-[11px] text-muted">
                {stepSide === mySide ? "Таны ээлж — баатар сонгоно уу" : "Эсрэг багийн сонголтыг тэмдэглэнэ үү"}
              </p>
              {step.action === "ban" && (
                <button onClick={onSkipBan} className="text-[11px] text-muted underline hover:text-fg">
                  Бан алгасах
                </button>
              )}
            </>
          ) : (
            <p className="font-display font-bold uppercase text-gold">Драфт дууслаа!</p>
          )}
        </div>

        {/* 1–24 алхмын нүднүүд */}
        <div className="relative" style={{ height }}>
          {slots.map((s) => {
            const hero = cm.picks[s.i];
            const done = s.i < current;
            const active = s.i === current;
            const left = s.side === "radiant" ? COL - 8 - s.w : COL + MID + 8;
            const name = hero != null ? data.heroes[hero].name : null;
            const label = `${s.i + 1}. ${SIDE_LABEL[s.side]} ${s.action === "ban" ? "бан" : "пик"}${
              name ? ` — ${name}` : done ? " — алгассан" : ""
            }`;
            return (
              <div key={s.i}>
                {/* Дугаар ба нүд хоорондын зураас */}
                <span
                  aria-hidden
                  className={`absolute h-px ${active ? "bg-gold" : "bg-white/20"}`}
                  style={{ top: s.num, left: s.side === "radiant" ? COL - 8 : COL + MID - 9, width: 17 }}
                />
                <span
                  aria-hidden
                  className={`absolute grid h-4 place-items-center text-[11px] font-semibold tabular-nums ${
                    active ? "font-extrabold text-gold" : done ? "text-fg/70" : "text-muted"
                  }`}
                  style={{ top: s.num - 8, left: COL, width: MID }}
                >
                  {s.i + 1}
                </span>
                {hero != null ? (
                  <button
                    type="button"
                    onClick={() => onHero(hero)}
                    title={label}
                    aria-label={label}
                    className="absolute overflow-hidden rounded-sm ring-1 ring-black/60 transition hover:ring-gold"
                    style={{ top: s.top, left, width: s.w, height: s.h }}
                  >
                    <HeroThumb
                      hero={data.heroes[hero]}
                      width={s.w}
                      className={`h-full w-full object-cover ${s.action === "ban" ? "grayscale" : ""}`}
                    />
                    {s.action === "ban" && (
                      <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_44%,#e0533f_44%,#e0533f_56%,transparent_56%)]" />
                    )}
                  </button>
                ) : (
                  <div
                    title={label}
                    aria-label={label}
                    className={`absolute grid place-items-center rounded-sm text-[9px] font-bold uppercase ${
                      active
                        ? "animate-pulse bg-gold/15 text-gold ring-2 ring-gold shadow-[0_0_12px_rgba(227,180,92,0.6)]"
                        : done
                          ? "bg-black/70 text-muted ring-1 ring-white/10"
                          : "bg-black/70 ring-1 ring-white/10"
                    }`}
                    style={{ top: s.top, left, width: s.w, height: s.h }}
                  >
                    {active ? (s.action === "ban" ? "Бан" : "Пик") : done ? "—" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
