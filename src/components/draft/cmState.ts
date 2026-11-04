import { CM_RESERVE_SECONDS, CM_STEPS, type Side } from "@/lib/draft";

export type CmState = {
  firstPick: Side;
  /** Алхам бүрийн сонголт. null = хугацаа дуусч бан алгасагдсан. */
  picks: (number | null)[];
  stepLeft: number;
  reserve: Record<Side, number>;
};

export type CmAction =
  | { type: "act"; hero: number | null }
  | { type: "undo" }
  | { type: "reset" }
  | { type: "setFirst"; side: Side }
  | { type: "tick"; fallback: number };

export const other = (s: Side): Side => (s === "radiant" ? "dire" : "radiant");

export function sideOfStep(state: CmState, index: number): Side | null {
  const step = CM_STEPS[index];
  if (!step) return null;
  return step.order === "first" ? state.firstPick : other(state.firstPick);
}

export function initialCm(firstPick: Side = "radiant"): CmState {
  return {
    firstPick,
    picks: [],
    stepLeft: CM_STEPS[0].seconds,
    reserve: { radiant: CM_RESERVE_SECONDS, dire: CM_RESERVE_SECONDS },
  };
}

export function cmReducer(s: CmState, a: CmAction): CmState {
  switch (a.type) {
    case "act": {
      if (!CM_STEPS[s.picks.length]) return s;
      const picks = [...s.picks, a.hero];
      return { ...s, picks, stepLeft: CM_STEPS[picks.length]?.seconds ?? 0 };
    }
    case "undo": {
      if (!s.picks.length) return s;
      const picks = s.picks.slice(0, -1);
      return { ...s, picks, stepLeft: CM_STEPS[picks.length].seconds };
    }
    case "reset":
      return initialCm(s.firstPick);
    case "setFirst":
      return { ...s, firstPick: a.side };
    case "tick": {
      const step = CM_STEPS[s.picks.length];
      const side = sideOfStep(s, s.picks.length);
      if (!step || !side) return s;
      if (s.stepLeft > 0) return { ...s, stepLeft: s.stepLeft - 1 };
      if (s.reserve[side] > 0) return { ...s, reserve: { ...s.reserve, [side]: s.reserve[side] - 1 } };
      // Нөөц цаг дууссан: бан алгасагдана, пик санамсаргүй сонгогдоно (тоглоомын дүрэм).
      return cmReducer(s, { type: "act", hero: step.action === "ban" ? null : a.fallback });
    }
  }
}

/** Багуудын пик/бан-ыг алхмуудаас ялгаж гаргана. */
export function cmTeams(s: CmState) {
  const teams: Record<Side, { picks: number[]; bans: (number | null)[] }> = {
    radiant: { picks: [], bans: [] },
    dire: { picks: [], bans: [] },
  };
  s.picks.forEach((hero, i) => {
    const side = sideOfStep(s, i)!;
    if (CM_STEPS[i].action === "pick") {
      if (hero !== null) teams[side].picks.push(hero);
    } else {
      teams[side].bans.push(hero);
    }
  });
  return teams;
}
