"use client";

import { useState } from "react";
import type { CitedProblem } from "@/coach";
import type { AssistanceState } from "@/loop";
import type { Notebook as NotebookView, NotebookBelief } from "@/parent/notebook";

/** The Assistance State in the Parent's words, on the evidence the belief rests on. */
const ASSISTANCE_WORD: Readonly<Record<AssistanceState, string>> = {
  "first-try-correct": "right first try",
  "hint-assisted-correct": "right after a Hint",
  revealed: "Revealed",
  unresolved: "not answered",
};

const STATUS_WORD = { proposed: "watching", supported: "supported", refuted: "refuted" } as const;

const STATUS_TONE = { proposed: "bg-sun", supported: "bg-leaf", refuted: "bg-paper-3" } as const;

function Evidence({ problem }: { readonly problem: CitedProblem }) {
  return (
    <li className="flex items-baseline gap-3 font-text text-caption text-ink" data-testid="evidence-problem" data-problem={problem.id}>
      <span className="w-10 shrink-0 text-ink-soft tabular-nums">{problem.id}</span>
      <span className="w-24 shrink-0 tabular-nums">{problem.equation}</span>
      <span className="min-w-0 flex-1 text-ink-soft">
        {ASSISTANCE_WORD[problem.assistance]} · Session {problem.sessionNumber}
      </span>
    </li>
  );
}

/** One belief: the claim in prose, then its evidence as the Problems it rests on, which the Parent can open. */
function Belief({ belief }: { readonly belief: NotebookBelief }) {
  const [open, setOpen] = useState(false);
  const cited = belief.evidence.length + belief.missing.length;
  return (
    <li className="flex flex-col gap-2 rounded-card bg-paper-2 px-5 py-4 shadow-card" data-testid="belief" data-status={belief.status}>
      <div className="flex items-baseline gap-3">
        <span className={`rounded-pill px-3 py-1 font-text text-caption text-ink ${STATUS_TONE[belief.status]}`}>
          {STATUS_WORD[belief.status]}
        </span>
        <span className="font-text text-caption text-ink-soft tabular-nums">{Math.round(belief.confidence * 100)}% sure</span>
      </div>
      <p className="font-text text-body text-ink text-pretty">{belief.claim}</p>
      <p className="font-text text-caption text-ink-soft text-pretty">Testing next: {belief.nextTest}</p>
      <button
        type="button"
        className="min-h-11 self-start rounded-pill bg-paper-3 px-4 font-text text-caption text-ink"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        {open ? "Hide" : "Show"} the {cited} {cited === 1 ? "Problem" : "Problems"} this rests on
      </button>
      {open && (
        <ul className="flex flex-col gap-2 rounded-card bg-paper px-4 py-3">
          {belief.evidence.map((problem) => (
            <Evidence key={problem.id} problem={problem} />
          ))}
          {belief.missing.length > 0 && (
            <li className="font-text text-caption text-ink-soft">
              {belief.missing.join(", ")}: this device no longer keeps the Problem.
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/**
 * Ollie's Notebook: what Ollie believes, each belief with the actual
 * Problems it rests on, what changed after the last Session, and what is
 * being tested next. When the Coach could not be reached, it says so and
 * names the reason, because the next Session is the Baseline's.
 */
export function Notebook({ view, nickname }: { readonly view: NotebookView; readonly nickname: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-paper-2 px-5 py-4 shadow-card" aria-labelledby="notebook" data-testid="notebook">
      <h3 id="notebook" className="font-display text-body font-semibold text-teal">
        Ollie&apos;s Notebook
      </h3>
      {view.baseline && (
        <p className="rounded-card bg-paper-3 px-4 py-3 font-text text-caption text-ink text-pretty" data-testid="notebook-baseline">
          Ollie could not think about the last Session, so the next one follows the usual plan: six Problems on the current Skill and
          two to keep an earlier one warm. {view.baseline.reasons[0]}
        </p>
      )}
      {!view.coached && (
        <p className="font-text text-caption text-ink text-pretty">
          Ollie writes in here after every Session. Play one with {nickname} and what Ollie believes will appear.
        </p>
      )}
      {view.beliefs.length > 0 && <ul className="flex flex-col gap-3">{view.beliefs.map((belief) => <Belief key={belief.id} belief={belief} />)}</ul>}
      {view.strengths.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="font-text text-caption font-bold text-ink-soft">Going well</h4>
          <ul className="flex flex-col gap-1">
            {view.strengths.map((strength) => (
              <li key={strength} className="font-text text-caption text-ink text-pretty">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
      {view.changed.length > 0 && (
        <div className="flex flex-col gap-1" data-testid="notebook-changed">
          <h4 className="font-text text-caption font-bold text-ink-soft">What changed after the last Session</h4>
          <ul className="flex flex-col gap-1">
            {view.changed.map((change) => (
              <li key={change} className="font-text text-caption text-ink text-pretty">
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
      {view.testingNext && (
        <div className="flex flex-col gap-1" data-testid="notebook-next">
          <h4 className="font-text text-caption font-bold text-ink-soft">What Ollie is testing next</h4>
          <p className="font-text text-caption text-ink text-pretty">
            {view.testingNext.claim} — {view.testingNext.nextTest}
          </p>
        </div>
      )}
    </section>
  );
}
