"use client";

import { getSkill, powerFor } from "@/loop";
import type { Power, SessionResult } from "@/loop";
import { Ollie } from "@/ollie/Ollie";
import { poseFor } from "@/ollie/powers";
import { MASTERED_LINE, milestoneLine, powerLine, SESSION_DONE, streakLine } from "@/play/lines";
import { useSpeech } from "@/play/use-speech";
import type { Award } from "@/rewards/rewards";
import { BigButton } from "@/ui/BigButton";
import { PowerMark } from "@/ui/PowerMark";
import { CoinIcon, StreakIcon } from "@/ui/RewardChips";

const CONFETTI = [
  ["rect", 70, 60, "sun", -24],
  ["tri", 180, 150, "berry", 18],
  ["dot", 130, 260, "leaf", 0],
  ["rect", 240, 40, "sky", 30],
  ["tri", 330, 120, "plum", -40],
  ["dot", 420, 60, "rust", 0],
  ["rect", 600, 50, "leaf", 12],
  ["tri", 700, 130, "sun", -30],
  ["dot", 800, 70, "berry", 0],
  ["rect", 880, 140, "plum", 40],
  ["tri", 950, 60, "sky", -15],
  ["dot", 930, 280, "rust", 0],
  ["rect", 60, 420, "plum", 20],
  ["dot", 110, 560, "sun", 0],
  ["tri", 200, 640, "leaf", -25],
  ["rect", 850, 470, "berry", 35],
  ["dot", 960, 600, "sky", 0],
  ["tri", 780, 680, "rust", -20],
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

/** Flat paper confetti in the six hues — round, cut square, and cut across a corner — drifting once. */
export function Confetti() {
  return (
    <svg viewBox="0 0 1024 768" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {CONFETTI.map(([shape, x, y, hue, angle], i) => {
        const piece = `confetti ${FILL[hue]}`;
        const style = { animationDelay: `${(i % 5) * 120}ms` };
        const spin = `rotate(${angle} ${x + 13} ${y + 7})`;
        if (shape === "dot") return <circle key={i} cx={x} cy={y} r={9} className={piece} style={style} />;
        if (shape === "tri") {
          return (
            <path
              key={i}
              d={`M${x} ${y + 16}L${x + 12} ${y}L${x + 24} ${y + 16}Z`}
              className={piece}
              transform={spin}
              style={style}
            />
          );
        }
        return <rect key={i} x={x} y={y} width={26} height={14} rx={3} className={piece} transform={spin} style={style} />;
      })}
    </svg>
  );
}

/**
 * A Streak milestone: the day count on a plum card beside a paper rosette
 * with the Streak's own flame in it, once each at 3, 7, and 14 days. The
 * rosette is ten petals cut from sun and laid round a leaf disc, so the
 * milestone belongs to the Streak and not to a second thing to collect.
 * One overshoot, then still.
 */
export function Milestone({ days }: { readonly days: number }) {
  return (
    <div
      className="milestone relative flex items-center gap-4 rounded-card bg-plum px-8 py-4 shadow-[0_4px_0_var(--plum-deep)]"
      data-testid="milestone"
      data-days={days}
    >
      <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" className="milestone-rays">
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx="32" cy="14" r="7.5" className="fill-sun" transform={`rotate(${i * 36} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="19" className="fill-sun" />
        <circle cx="32" cy="32" r="14" className="fill-leaf" />
        <g transform="translate(19 19)">
          <StreakIcon size={26} />
        </g>
      </svg>
      <div className="flex flex-col">
        <span className="font-display text-display-m font-semibold text-paper">{milestoneLine(days)}</span>
        <span className="font-text text-caption text-paper">A Freeze for the day you miss.</span>
      </div>
    </div>
  );
}

/**
 * A Power Ollie has just learned: the headline card of the Session that
 * earned it, in plum, with the Power's mark, its name, and what Ollie will
 * do with it from the next matching Problem on.
 */
export function PowerCard({ power }: { readonly power: Power }) {
  return (
    <div
      className="milestone flex items-center gap-4 rounded-card bg-plum px-6 py-5 shadow-[0_4px_0_var(--plum-deep)]"
      data-testid="power-earned"
      data-power={power.id}
    >
      <PowerMark power={power.id} size={56} />
      <div className="flex flex-col">
        <span className="font-text text-caption text-paper">Ollie learned a Power</span>
        <span className="font-display text-display-s font-semibold text-paper">{power.name}</span>
        <span className="font-text text-caption text-paper text-pretty">{power.does}</span>
      </div>
    </div>
  );
}

type CelebrationProps = {
  readonly result: SessionResult;
  readonly award: Award;
  readonly onDone: () => void;
};

/**
 * The end of every Session: Ollie celebrates what was earned, then Done
 * goes home. A Power earned here is the headline — Ollie takes its pose and
 * says the Learner taught it — and the Coins and the Streak are still paid
 * and still shown beside it. Two Powers in one Session is possible; the
 * first is the headline and both get a card.
 */
export function Celebration({ result, award, onDone }: CelebrationProps) {
  const mastered = result.newlyMastered.map((id) => getSkill(id).name);
  const powers = result.powersEarned.map(powerFor);
  const headline = powers.length > 0 ? powerLine(powers[0].name) : SESSION_DONE;
  // The end of a Session and each Power's line are fixed lines, bundled with
  // the app; Ollie is already celebrating, so only the audio is new here.
  const { speaking, source } = useSpeech({ text: headline }, headline);
  const { streak } = award.rewards;
  return (
    <main
      className="learner-stage isolate flex flex-col items-center gap-6 px-gutter pt-10 pb-12"
      data-testid="celebration"
      data-speech-source={source ?? undefined}
      data-power={powers[0]?.id}
    >
      <Confetti />
      <h1 className="celebrate-in max-w-205 text-center font-display text-display-xl font-semibold text-balance text-ink">
        {headline}
      </h1>
      <div className="flex items-center justify-center gap-12">
        <Ollie pose={powers.length > 0 ? poseFor(powers[0].id) : "celebrate"} speaking={speaking} size={300} />
        <div className="flex w-90 flex-col gap-5">
          <div className="rounded-card bg-paper-2 px-6 py-5 shadow-card">
            <div className="font-text text-caption text-ink-soft">This Session</div>
            <div className="font-display text-display-m font-semibold text-ink">{result.log.entries.length} Problems</div>
          </div>
          <div className="flex items-center gap-4 rounded-card bg-sun px-6 py-5 shadow-[0_4px_0_var(--sun-deep)]" data-testid="coins-earned">
            {/* The Coin sits on paper here: a sun disc on a sun card would disappear. */}
            <span className="flex size-14 items-center justify-center rounded-pill bg-paper">
              <CoinIcon size={40} />
            </span>
            <div className="flex flex-col">
              <span className="font-text text-caption text-ink">Coins for finishing</span>
              <span className="font-display text-display-m font-semibold text-ink">+{award.coins}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-card bg-leaf px-6 py-5 shadow-[0_4px_0_var(--leaf-deep)]" data-testid="streak-earned">
            <StreakIcon size={44} />
            <div className="flex flex-col">
              <span className="font-text text-caption text-ink">Days in a row</span>
              <span className="font-display text-display-m font-semibold text-ink">{streakLine(streak)}</span>
            </div>
          </div>
          {powers.map((power) => (
            <PowerCard key={power.id} power={power} />
          ))}
          {mastered.map((name) => (
            <div key={name} className="rounded-card bg-leaf px-6 py-5 shadow-[0_4px_0_var(--leaf-deep)]" data-testid="mastered">
              <div className="font-text text-caption text-ink">Mastered</div>
              <div className="font-display text-display-s font-semibold text-ink">{MASTERED_LINE(name)}</div>
            </div>
          ))}
        </div>
      </div>
      {award.milestone !== null && <Milestone days={award.milestone} />}
      <BigButton size="xl" onClick={onDone} autoFocus>
        Done
      </BigButton>
    </main>
  );
}
