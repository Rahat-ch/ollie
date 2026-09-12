"use client";

import { getSkill } from "@/loop";
import type { SessionResult } from "@/loop";
import { Ollie } from "@/ollie/Ollie";
import { MASTERED_LINE, SESSION_DONE } from "@/play/lines";
import { BigButton } from "@/ui/BigButton";

const CONFETTI = [
  ["rect", 70, 60, "sun", -24],
  ["rect", 180, 150, "berry", 18],
  ["dot", 130, 260, "leaf", 0],
  ["rect", 240, 40, "sky", 30],
  ["rect", 330, 120, "plum", -40],
  ["dot", 420, 60, "rust", 0],
  ["rect", 600, 50, "leaf", 12],
  ["rect", 700, 130, "sun", -30],
  ["dot", 800, 70, "berry", 0],
  ["rect", 880, 140, "plum", 40],
  ["rect", 950, 60, "sky", -15],
  ["dot", 930, 280, "rust", 0],
  ["rect", 60, 420, "plum", 20],
  ["dot", 110, 560, "sun", 0],
  ["rect", 200, 640, "leaf", -25],
  ["rect", 850, 470, "berry", 35],
  ["dot", 960, 600, "sky", 0],
  ["rect", 780, 680, "rust", -20],
  ["rect", 500, 700, "plum", 45],
  ["dot", 640, 720, "leaf", 0],
] as const;

const FILL = {
  sun: "fill-sun",
  berry: "fill-berry",
  leaf: "fill-leaf",
  sky: "fill-sky",
  plum: "fill-plum",
  rust: "fill-rust",
} as const;

/** Flat paper confetti in the six hues, drifting once. */
function Confetti() {
  return (
    <svg viewBox="0 0 1024 768" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {CONFETTI.map(([shape, x, y, hue, angle], i) => {
        const delay = { animationDelay: `${(i % 5) * 120}ms` };
        return shape === "dot" ? (
          <circle key={i} cx={x} cy={y} r={9} className={`confetti ${FILL[hue]}`} style={delay} />
        ) : (
          <rect key={i} x={x} y={y} width={26} height={14} rx={3} className={`confetti ${FILL[hue]}`} transform={`rotate(${angle} ${x + 13} ${y + 7})`} style={delay} />
        );
      })}
    </svg>
  );
}

type CelebrationProps = {
  readonly result: SessionResult;
  readonly onDone: () => void;
};

/** The end of every Session: Ollie celebrates, then Done goes home. Powers, Coins, and the Streak join in tickets 13 and 14. */
export function Celebration({ result, onDone }: CelebrationProps) {
  const mastered = result.newlyMastered.map((id) => getSkill(id).name);
  return (
    <main className="learner-stage flex flex-col items-center gap-6 px-gutter pt-10 pb-12" data-testid="celebration">
      <Confetti />
      <h1 className="celebrate-in max-w-205 text-center font-display text-display-xl font-semibold text-balance text-ink">
        {SESSION_DONE}
      </h1>
      <div className="flex items-center justify-center gap-12">
        <Ollie pose="celebrate" size={300} />
        <div className="flex w-90 flex-col gap-5">
          <div className="rounded-card bg-paper-2 px-6 py-5 shadow-card">
            <div className="font-text text-caption text-ink-soft">This Session</div>
            <div className="font-display text-display-m font-semibold text-ink">{result.log.entries.length} Problems</div>
          </div>
          {mastered.map((name) => (
            <div key={name} className="rounded-card bg-leaf px-6 py-5 shadow-[0_4px_0_var(--leaf-deep)]" data-testid="mastered">
              <div className="font-text text-caption text-ink">Mastered</div>
              <div className="font-display text-display-s font-semibold text-ink">{MASTERED_LINE(name)}</div>
            </div>
          ))}
        </div>
      </div>
      <BigButton size="xl" onClick={onDone} autoFocus>
        Done
      </BigButton>
    </main>
  );
}
