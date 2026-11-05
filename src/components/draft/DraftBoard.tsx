"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { CM_STEPS, formatPct, suggest, type DraftData, type Side } from "@/lib/draft";
import CmTimeline from "./CmTimeline";
import { cmReducer, cmTeams, initialCm, other, sideOfStep } from "./cmState";
import HeroGrid from "./HeroGrid";
import Inspector from "./Inspector";
import { EnemyItems, SuggestionList } from "./Suggestions";
import TeamPanel from "./TeamPanel";
import HeroThumb from "./HeroThumb";

type Mode = "cm" | "free";
type FreeTarget = "ally" | "enemy" | "ban";
type FreeState = Record<FreeTarget, number[]>;
type Tab = "pick" | "ban" | "items";

const TARGET_LABEL: Record<FreeTarget, string> = { ally: "Манай баг", enemy: "Эсрэг баг", ban: "Бан" };
const EMPTY_FREE: FreeState = { ally: [], enemy: [], ban: [] };

export default function DraftBoard({ data }: { data: DraftData }) {
  const [mode, setMode] = useState<Mode>("cm");
  const [mySide, setMySide] = useState<Side>("radiant");
  const [cm, dispatch] = useReducer(cmReducer, undefined, () => initialCm());
  const [timerOn, setTimerOn] = useState(false);
  const [free, setFree] = useState<FreeState>(EMPTY_FREE);
  const [freeHistory, setFreeHistory] = useState<FreeTarget[]>([]);
  const [target, setTarget] = useState<FreeTarget>("ally");
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab | null>(null);

  const indexOf = useMemo(() => new Map(data.heroes.map((h, i) => [h.slug, i])), [data.heroes]);
  const cmDisabled = useMemo(
    () => new Set(data.heroes.flatMap((h, i) => (h.cmEnabled ? [] : [i]))),
    [data.heroes],
  );

  const teams = cmTeams(cm);
  const step = CM_STEPS[cm.picks.length] ?? null;
  const stepSide = sideOfStep(cm, cm.picks.length);
  const enemySide = other(mySide);

  const allies = mode === "cm" ? teams[mySide].picks : free.ally;
  const enemies = mode === "cm" ? teams[enemySide].picks : free.enemy;
  const bans =
    mode === "cm"
      ? [...teams.radiant.bans, ...teams.dire.bans].filter((b): b is number => b !== null)
      : free.ban;
  const disabled = mode === "cm" ? cmDisabled : new Set<number>();
  const taken = new Set([...allies, ...enemies, ...bans]);
  const unavailable = new Set([...taken, ...disabled]);

  // Одоогийн үйлдэлд аль талын нүдээр харах вэ: "pick" = манай багт сайн, "threat" = эсрэг багт сайн.
  let focus: "pick" | "threat" = "pick";
  if (mode === "cm" && step && stepSide) {
    const mine = stepSide === mySide;
    focus = (step.action === "pick") === mine ? "pick" : "threat";
  } else if (mode === "free") {
    focus = target === "ally" ? "pick" : "threat";
  }

  const pickList = suggest(data, allies, enemies, unavailable, 12);
  const threatList = suggest(data, enemies, allies, unavailable, 12);
  const focusList = focus === "pick" ? pickList : threatList;
  const ranks = new Map(focusList.slice(0, 8).map((s, i) => [s.hero, i + 1]));
  const activeTab: Tab = tab ?? (focus === "pick" ? "pick" : "ban");

  // Цаг хэмжигч: алхам бүрт секунд тоолж, дуусвал нөөц цагаас хасна.
  const draftDone = cm.picks.length >= CM_STEPS.length;
  useEffect(() => {
    if (!timerOn || mode !== "cm" || draftDone) return;
    const pool = data.heroes.map((_, i) => i).filter((i) => !unavailable.has(i));
    const id = setInterval(
      () => dispatch({ type: "tick", fallback: pool[Math.floor(Math.random() * pool.length)] }),
      1000,
    );
    return () => clearInterval(id);
    // unavailable нь пикээс шууд хамаардаг тул cm.picks өөрчлөгдөхөд дахин үүснэ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerOn, mode, draftDone, cm.picks, data.heroes]);

  function commit(hero: number, to?: FreeTarget) {
    if (unavailable.has(hero)) return;
    if (mode === "cm") {
      if (!step) return;
      dispatch({ type: "act", hero });
    } else {
      const t = to ?? target;
      if (t !== "ban" && free[t].length >= 5) return;
      setFree((f) => ({ ...f, [t]: [...f[t], hero] }));
      setFreeHistory((h) => [...h, t]);
    }
    // Сонгосны дараа дараагийн алхмын саналыг харуулна.
    setSelected(null);
  }

  function removeFree(hero: number) {
    const t = (Object.keys(free) as FreeTarget[]).find((k) => free[k].includes(hero));
    if (!t) return;
    setFree((f) => ({ ...f, [t]: f[t].filter((x) => x !== hero) }));
    setFreeHistory((h) => {
      const i = h.lastIndexOf(t);
      return i < 0 ? h : [...h.slice(0, i), ...h.slice(i + 1)];
    });
  }

  function undo() {
    if (mode === "cm") return dispatch({ type: "undo" });
    const last = freeHistory.at(-1);
    if (!last) return;
    setFree((f) => ({ ...f, [last]: f[last].slice(0, -1) }));
    setFreeHistory((h) => h.slice(0, -1));
  }

  function reset() {
    if (mode === "cm") dispatch({ type: "reset" });
    else {
      setFree(EMPTY_FREE);
      setFreeHistory([]);
    }
    setSelected(null);
  }

  function onTeamHero(hero: number) {
    if (mode === "free") removeFree(hero);
    else setSelected(hero);
  }

  // Inspector доторх үйлдлийн товчнууд.
  let actions = null;
  if (selected !== null && !unavailable.has(selected)) {
    if (mode === "cm" && step && stepSide) {
      const mine = stepSide === mySide;
      const label = `${mine ? "Манай баг" : "Эсрэг баг"}: ${step.action === "pick" ? "ПИК" : "БАН"} хийх`;
      actions = (
        <button
          onClick={() => commit(selected)}
          className={`w-full rounded py-2 font-bold uppercase tracking-wide text-white transition hover:brightness-110 ${
            step.action === "ban" ? "bg-dire" : "bg-radiant"
          }`}
        >
          {label}
        </button>
      );
    } else if (mode === "free") {
      actions = (
        <div className="grid grid-cols-3 gap-1.5">
          {(["ally", "enemy", "ban"] as FreeTarget[]).map((t) => (
            <button
              key={t}
              onClick={() => commit(selected, t)}
              disabled={t !== "ban" && free[t].length >= 5}
              className={`rounded py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-30 ${
                t === "ally" ? "bg-radiant" : t === "enemy" ? "bg-dire" : "bg-panel-2 ring-1 ring-line"
              }`}
            >
              {TARGET_LABEL[t]}
            </button>
          ))}
        </div>
      );
    }
  }

  // Багуудын драфтын ойролцоо үнэлгээ.
  const matchupScore = allies.reduce((s, a) => s + enemies.reduce((t, e) => t + data.vs[a][e], 0), 0);
  const synergyOf = (team: number[]) =>
    team.reduce((s, a, i) => s + team.slice(i + 1).reduce((t, b) => t + data.with[a][b], 0), 0);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-4">
      {/* Тохиргоо */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex rounded-lg border border-line bg-panel p-0.5">
          {(
            [
              ["cm", "Captain's Mode"],
              ["free", "Чөлөөт (Ranked All Pick)"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 transition ${mode === m ? "bg-accent text-white" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "cm" && (
          <>
            <label className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2 py-1.5">
              <span className="text-muted">Эхний пик</span>
              <select
                value={cm.firstPick}
                onChange={(e) => dispatch({ type: "setFirst", side: e.target.value as Side })}
                className="bg-transparent font-semibold outline-none"
              >
                <option value="radiant">Radiant</option>
                <option value="dire">Dire</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-panel px-2 py-1.5">
              <input type="checkbox" checked={timerOn} onChange={(e) => setTimerOn(e.target.checked)} />
              <span>Цаг хэмжих</span>
            </label>
          </>
        )}

        {mode === "free" && (
          <div className="flex items-center gap-1 rounded-lg border border-line bg-panel p-0.5">
            <span className="px-2 text-muted">Дарахад нэмэх:</span>
            {(["ally", "enemy", "ban"] as FreeTarget[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`rounded-md px-3 py-1.5 transition ${
                  target === t
                    ? t === "ally"
                      ? "bg-radiant text-white"
                      : t === "enemy"
                        ? "bg-dire text-white"
                        : "bg-line text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                {TARGET_LABEL[t]}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <button onClick={undo} className="rounded-lg border border-line bg-panel px-3 py-1.5 hover:bg-panel-2">
            ↶ Буцаах
          </button>
          <button onClick={reset} className="rounded-lg border border-line bg-panel px-3 py-1.5 hover:bg-panel-2">
            Шинээр эхлэх
          </button>
        </div>
      </div>

      {/* Чөлөөт горимын багууд (CM-д зүүн талын самбар) */}
      {mode === "free" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <TeamPanel data={data} title="Манай баг" subtitle="дарж хасна" tone="radiant" picks={free.ally} onHero={onTeamHero} active={target === "ally"} />
          <TeamPanel data={data} title="Эсрэг баг" subtitle="дарж хасна" tone="dire" picks={free.enemy} onHero={onTeamHero} active={target === "enemy"} />
          {free.ban.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 lg:col-span-2">
              <span className="mr-1 text-xs text-muted">Бан:</span>
              {free.ban.map((b) => (
                <button key={b} onClick={() => removeFree(b)} title="Хасах">
                  <HeroThumb hero={data.heroes[b]} width={48} className="w-12 rounded-sm grayscale" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {allies.length > 0 && enemies.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-line bg-panel px-4 py-2 text-sm">
          <span className="text-muted">Драфтын ойролцоо үнэлгээ:</span>
          <span>
            Матчап (манай талаас){" "}
            <b className={matchupScore >= 0 ? "text-good" : "text-bad"}>{formatPct(matchupScore)}</b>
          </span>
          <span>
            Манай хамтын нэмэгдэл <b className="text-good">{formatPct(synergyOf(allies))}</b>
          </span>
          <span>
            Эсрэг багийн хамтын нэмэгдэл <b className="text-bad">{formatPct(synergyOf(enemies))}</b>
          </span>
        </div>
      )}

      {/* CM: самбар | баатрууд | зөвлөмж. Чөлөөт: баатрууд | зөвлөмж. */}
      <div
        className={`grid gap-4 ${
          mode === "cm"
            ? "lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_380px]"
            : "lg:grid-cols-[minmax(0,1fr)_400px]"
        }`}
      >
        {mode === "cm" && (
          // Самбарыг бүтнээр нь харуулна: дэлгэц хангалттай өндөр үед л доош гүйлгэхэд дагаж үлдэнэ.
          <div className="lg:row-span-2 lg:self-start xl:row-span-1 [@media(min-height:840px)]:lg:sticky [@media(min-height:840px)]:lg:top-[84px]">
            <CmTimeline
              data={data}
              cm={cm}
              mySide={mySide}
              timerOn={timerOn}
              onHero={onTeamHero}
              onCaptain={setMySide}
              onSkipBan={() => dispatch({ type: "act", hero: null })}
            />
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Баатар хайх…"
              className="w-full max-w-xs rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <p className="hidden text-xs text-muted md:block">
              Нэг дарж мэдээлэл харах, хоёр дарж шууд сонгох.{" "}
              <span className={focus === "pick" ? "text-good" : "text-bad"}>Дугаартай</span> нь одоогийн алхамд санал
              болгож буй баатрууд.
            </p>
          </div>
          <HeroGrid
            data={data}
            query={query}
            taken={taken}
            disabled={disabled}
            selected={selected}
            ranks={ranks}
            rankTone={focus === "pick" ? "good" : "bad"}
            onSelect={setSelected}
            onCommit={commit}
          />
          <p className="text-[11px] text-muted">
            {data.meta.patch && <>Патч {data.meta.patch}. </>}
            Статистик: OpenDota-гийн {data.meta.matchCount.toLocaleString("en-US")} ranked тоглолт (
            {data.meta.to.slice(0, 10)} хүртэл). Давуу тал = бодит ялалтын хувь − хоёр баатрын ерөнхий хүчнээс
            хүлээгдэх хувь.
          </p>
        </div>

        <aside className={`space-y-4 ${mode === "cm" ? "lg:col-start-2 xl:col-start-auto" : ""}`}>
          {selected !== null && (
            // Гар утсанд доороос гарч ирэх самбар, том дэлгэцэнд хажуугийн багана.
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto shadow-[0_-12px_40px_rgba(0,0,0,0.6)] lg:static lg:max-h-none lg:overflow-visible lg:shadow-none">
              <Inspector
                data={data}
                hero={selected}
                allies={allies}
                enemies={enemies}
                taken={taken}
                indexOf={indexOf}
                actions={actions}
                onSelect={setSelected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
          {/* Баатар сонгосон үед том дэлгэцэнд санал нь мэдээллээр солигдоно (гар утсанд мэдээлэл доороос гардаг). */}
          <section className={`rounded-lg border border-line bg-panel ${selected !== null ? "lg:hidden" : ""}`}>
            <div className="flex border-b border-line text-sm">
              {(
                [
                  ["pick", "Пик санал"],
                  ["ban", "Бан санал"],
                  ["items", "Эсрэг item"],
                ] as [Tab, string][]
              ).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 transition ${
                    activeTab === t ? "border-b-2 border-gold font-semibold text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-2">
              {activeTab === "pick" && (
                <>
                  <p className="px-1.5 pb-1 text-[11px] text-muted">
                    Манай багт: эсрэг баатруудын эсрэг сайн + манай баатруудтай сайн хамтардаг.
                  </p>
                  <SuggestionList data={data} list={pickList} tone="good" onSelect={setSelected} />
                </>
              )}
              {activeTab === "ban" && (
                <>
                  <p className="px-1.5 pb-1 text-[11px] text-muted">
                    Эсрэг багт хамгийн их тус болох (манайхыг ялдаг) баатрууд — бан хийх эсвэл анхаарах.
                  </p>
                  <SuggestionList data={data} list={threatList} tone="bad" onSelect={setSelected} />
                </>
              )}
              {activeTab === "items" && (
                <div className="p-1.5">
                  <EnemyItems data={data} enemies={enemies} onSelect={setSelected} />
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
