"use client";

import { unitName } from "@/loop";
import { masteryRows, type MasteryRow } from "@/parent/mastery";
import { powerRows, type PowerRow as PowerRowData } from "@/parent/powers";
import type { Identity } from "@/profile/identity";
import type { Profile } from "@/profile/profile";
import { PillLink } from "@/ui/PillLink";
import { PowerMark } from "@/ui/PowerMark";

const BAR_FILL: Readonly<Record<MasteryRow["state"], string>> = {
  mastered: "bg-leaf",
  "in-progress": "bg-sun",
  "not-started": "bg-paper-3",
};

const STATE_WORD: Readonly<Record<MasteryRow["state"], string>> = {
  mastered: "Mastered",
  "in-progress": "in progress",
  "not-started": "not started",
};

const percent = (estimate: number) => `${Math.round(estimate * 100)}%`;

function SkillRow({ row }: { readonly row: MasteryRow }) {
  return (
    <li className="flex items-center gap-3" data-testid="mastery-row" data-state={row.state} data-estimate={row.estimate ?? ""}>
      <span className="min-w-0 flex-1 font-text text-caption text-ink">{row.name}</span>
      <span className="w-12 text-right font-text text-caption text-ink-soft tabular-nums">{row.estimate === null ? "—" : percent(row.estimate)}</span>
      <span
        className="flex h-3 w-30 shrink-0 overflow-hidden rounded-pill bg-paper-3"
        role="meter"
        aria-label={`${row.name}: ${STATE_WORD[row.state]}`}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={row.estimate ?? 0}
      >
        {row.estimate !== null && <span className={`${BAR_FILL[row.state]} rounded-pill`} style={{ width: percent(row.estimate) }} />}
      </span>
    </li>
  );
}

/** One Power by name: what Ollie does with it, and whether the Learner has taught it yet. */
function PowerRow({ row }: { readonly row: PowerRowData }) {
  return (
    <li className="flex items-start gap-3" data-testid="power-row" data-power={row.id} data-learned={row.learned ? "yes" : "no"}>
      <span className={row.learned ? "" : "opacity-35"}>
        <PowerMark power={row.id} size={32} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-text text-caption font-bold text-ink">{row.name}</span>
        <span className="font-text text-caption text-ink-soft text-pretty">
          {row.learned ? row.does : `Mastering ${row.from} teaches it.`}
        </span>
      </span>
    </li>
  );
}

function Legend() {
  return (
    <ul className="flex gap-4" aria-label="Legend">
      {(["mastered", "in-progress", "not-started"] as const).map((state) => (
        <li key={state} className="flex items-center gap-2">
          <span className={`size-3 rounded-pill ${BAR_FILL[state]}`} aria-hidden="true" />
          <span className="font-text text-caption text-ink-soft">{STATE_WORD[state]}</span>
        </li>
      ))}
    </ul>
  );
}

function Placeholder({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-card bg-paper-2 px-5 py-4 shadow-card" aria-label={title}>
      <h3 className="font-display text-body font-semibold text-teal">{title}</h3>
      <p className="font-text text-caption text-ink text-pretty">{children}</p>
    </section>
  );
}

/**
 * Text-first, on paper, 44px targets. Mastery per Skill and the Powers
 * Ollie has learned are live from the Loop; the Parent Summaries and
 * Ollie's Notebook have their places here and arrive with ticket 12.
 */
export function ParentArea({ profile, identity }: { readonly profile: Profile; readonly identity: Identity }) {
  const rows = masteryRows(profile.progress);
  const powers = powerRows(profile.powers);
  const { nickname } = identity;
  const sessions = profile.progress.sessionsCompleted;
  const units = ([1, 2, 3] as const).map((unit) => ({ unit, rows: rows.filter((r) => r.unit === unit) }));
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col gap-4 px-gutter py-8" data-testid="parent-area">
      <header className="flex items-center justify-between gap-6">
        <h1 className="font-display text-display-m font-semibold text-teal">Parent Area</h1>
        <PillLink href="/" tone="sky">
          Back to Ollie
        </PillLink>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="font-text text-caption text-ink-soft">
            {nickname} · {sessions} {sessions === 1 ? "Session" : "Sessions"} played
          </p>
          <Placeholder title="Parent Summaries">
            After each Session, Ollie will write you a short note: the strategies {nickname} practised, with the evidence
            (first-try, with a Hint, or Revealed), what was Mastered, and one thing to try together. The last seven will be listed
            here.
          </Placeholder>
          <Placeholder title="Ollie's Notebook">
            What Ollie believes about how {nickname} is learning, each belief with the actual Problems it rests on, what changed
            after the last Session, and what Ollie is testing next.
          </Placeholder>
        </div>

        <section className="flex w-full flex-col gap-4 rounded-card bg-paper-2 p-5 shadow-card md:w-88 md:shrink-0" aria-labelledby="mastery">
          <h2 id="mastery" className="font-display text-display-s font-semibold text-teal">
            Mastery
          </h2>
          {units.map(({ unit, rows }) => (
            <div key={unit} className="flex flex-col gap-3">
              <h3 className="font-text text-caption font-bold text-ink-soft">
                Unit {unit} · {unitName(unit)}
              </h3>
              <ul className="flex flex-col gap-3">
                {rows.map((row) => (
                  <SkillRow key={row.name} row={row} />
                ))}
              </ul>
            </div>
          ))}
          <Legend />
          <div className="flex flex-col gap-2">
            <h3 className="font-text text-caption font-bold text-ink-soft">Powers Ollie has learned</h3>
            {powers.every((power) => !power.learned) && (
              <p className="font-text text-caption text-ink text-pretty">
                None yet. Ollie learns a Power when {nickname} Masters the strategy it comes from, and never loses it.
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {powers.map((power) => (
                <PowerRow key={power.id} row={power} />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
