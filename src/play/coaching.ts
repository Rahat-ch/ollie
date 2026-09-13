/**
 * What happens after a Session in the browser: one Coach run and one Parent
 * Summary, both through API routes, because the model keys live on the
 * server (ADR 0002). The rule itself is the engine's and is not repeated
 * here: `coachSession` calls the Coach, checks the Notes against the Log and
 * the Plan against the Plan Space, retries once, and falls back to the
 * Baseline Plan; `writeValidSummary` checks the Summary and falls back to
 * the template. Either way the record comes back written, so play goes on
 * and the Parent gets a note.
 */
import { addSummary, applyCoachStep, coachSession, type CoachRecord } from "@/coach";
import type { SessionResult } from "@/loop";
import { parseCoachOutput } from "@/generation/coach-schema";
import { parseSummaryOutput } from "@/generation/summary-schema";
import type { CoachInput, CoachOutput, Generation, SummaryInput, SummaryOutput } from "@/generation/types";
import { parentSummary, summaryInput } from "@/summary/summary";
import { writeValidSummary } from "@/summary/write";

/** The two operations that run after a Session. The other two are the Story writer's and the voice's. */
export type Coaching = Pick<Generation, "runCoach" | "writeSummary">;

/** The Coach thinks for a while on Opus 5; the Summary is shorter. Past this the Baseline and the template take over. */
export const COACH_TIMEOUT_MS = 60_000;
export const SUMMARY_TIMEOUT_MS = 30_000;

async function post(path: string, body: unknown, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) {
    const detail: unknown = await response.json().catch(() => null);
    const error = detail && typeof detail === "object" && "error" in detail ? String(detail.error) : response.statusText;
    throw new Error(`${path} answered ${response.status}: ${error}`);
  }
  return response.json();
}

/**
 * The Coach and the Summary as the browser reaches them: one route each,
 * carrying the Session's evidence, the Learner Notes, the Knowledge
 * Estimates, and the Plan Space, and never the Nickname, the Avatar, or the
 * Theme (ADR 0002). A malformed answer throws, which the engine records as
 * a rejection like any other.
 */
export function routeCoaching(signal?: AbortSignal): Coaching {
  return {
    async runCoach(input: CoachInput): Promise<CoachOutput> {
      const parsed = parseCoachOutput(await post("/api/coach", input, COACH_TIMEOUT_MS, signal));
      if (!parsed.ok) throw new Error(`Coach output rejected: ${parsed.reasons.join("; ")}`);
      return parsed.output;
    },
    async writeSummary(input: SummaryInput): Promise<SummaryOutput> {
      const parsed = parseSummaryOutput(await post("/api/summary", input, SUMMARY_TIMEOUT_MS, signal));
      if (!parsed.ok) throw new Error(`Parent Summary rejected: ${parsed.reasons.join("; ")}`);
      return parsed.output;
    },
  };
}

/**
 * One Coach run and one Parent Summary for a completed Session, written onto
 * the record the Profile keeps. `powers` is the Powers the Session earned,
 * which live outside the Session Log (ticket 13; empty until then).
 */
export async function runCoaching(
  coaching: Coaching,
  record: CoachRecord,
  result: SessionResult,
  powers: readonly string[],
  at: Date,
): Promise<CoachRecord> {
  const step = await coachSession(coaching, result, record.notes);
  const coached = applyCoachStep(record, step, result);
  const input = summaryInput(result, coached.notes, powers);
  const written = await writeValidSummary(coaching, input);
  return addSummary(coached, parentSummary(input, written, at));
}
