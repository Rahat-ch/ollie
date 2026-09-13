"use client";

import { SUMMARIES_KEPT } from "@/coach";
import type { SummaryPractice } from "@/generation/types";
import type { ParentSummary } from "@/summary/summary";

const day = (at: string): string => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** The evidence by Assistance State, as the engine counted it: never the model's numbers. */
function Evidence({ row }: { readonly row: SummaryPractice }) {
  const parts = [
    `${row.firstTryCorrect} first try`,
    `${row.hintAssisted} with a Hint`,
    `${row.revealed} Revealed`,
    ...(row.unresolved > 0 ? [`${row.unresolved} not answered`] : []),
  ];
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 font-text text-caption" data-testid="summary-evidence" data-skill={row.skill}>
      <span className="text-ink">{row.name}</span>
      <span className="text-ink-soft tabular-nums">{parts.join(" · ")}</span>
    </li>
  );
}

function Summary({ summary }: { readonly summary: ParentSummary }) {
  return (
    <li
      className="flex flex-col gap-2 rounded-card bg-paper-2 px-5 py-4 shadow-card"
      data-testid="parent-summary"
      data-session={summary.sessionNumber}
      data-source={summary.source}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-body font-semibold text-ink">Session {summary.sessionNumber}</h4>
        <span className="font-text text-caption text-ink-soft">
          {day(summary.at)} · {summary.problems} Problems
        </span>
      </div>
      <p className="font-text text-caption text-ink text-pretty">{summary.practiced}</p>
      <ul className="flex flex-col gap-1">
        {summary.practice.map((row) => (
          <Evidence key={row.skill} row={row} />
        ))}
      </ul>
      {summary.mastered.length > 0 && (
        <p className="font-text text-caption text-ink" data-testid="summary-mastered">
          Mastered: {summary.mastered.join(", ")}
        </p>
      )}
      {summary.powers.length > 0 && (
        <p className="font-text text-caption text-ink" data-testid="summary-powers">
          Ollie learned {summary.powers.join(", ")}
        </p>
      )}
      <p className="rounded-card bg-paper px-4 py-3 font-text text-caption text-ink text-pretty" data-testid="summary-activity">
        Try tonight: {summary.activity}
      </p>
    </li>
  );
}

/**
 * The last seven Parent Summaries, newest first: the words Ollie wrote over
 * the engine's own evidence by Assistance State, what was Mastered, and one
 * thing to do together.
 */
export function Summaries({ summaries, nickname }: { readonly summaries: readonly ParentSummary[]; readonly nickname: string }) {
  // The record keeps seven; a store written by hand might hold more, and a week is what a Parent asked for.
  const shown = summaries.slice(0, SUMMARIES_KEPT);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="summaries" data-testid="summaries">
      <h3 id="summaries" className="font-display text-body font-semibold text-teal">
        Parent Summaries
      </h3>
      {shown.length === 0 ? (
        <p className="rounded-card bg-paper-2 px-5 py-4 font-text text-caption text-ink shadow-card text-pretty">
          After each Session, Ollie writes you a short note: the strategies {nickname} practised, with the evidence (first try, with a
          Hint, or Revealed), what was Mastered, and one thing to try together. The last seven are listed here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((summary) => (
            <Summary key={summary.sessionNumber} summary={summary} />
          ))}
        </ul>
      )}
    </section>
  );
}
