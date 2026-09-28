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
import { coachSession, isServerBaseline, type CoachRecord, type CoachRun } from "@/coach";
import { powerFor } from "@/loop";
import type { SessionResult } from "@/loop";
import { parseCoachOutput } from "@/generation/coach-schema";
import { ModelUnavailableError } from "@/lib/errors";
import { parseSummaryOutput } from "@/generation/summary-schema";
import type { CoachInput, CoachOutput, Generation, SummaryInput, SummaryOutput } from "@/generation/types";
import { parentSummary, summaryInput } from "@/summary/summary";
import { writeValidSummary } from "@/summary/write";

/** The two operations that run after a Session. The other two are the Story writer's and the voice's. */
export type Coaching = Pick<Generation, "runCoach" | "writeSummary">;

/**
 * How long the device waits before the Baseline and the template take over.
 * The Coach thinks for a while on Opus 5 (about 71 s a call in the live
 * Eval Runs), so the device waits longer than the route's own deadline
 * (`COACH_SERVER_DEADLINE_MS`, 75 s): the route decides, stops the model
 * call, and says so, and this clock only matters when the route cannot be
 * heard at all. The Summary is shorter.
 */
export const COACH_TIMEOUT_MS = 90_000;
export const SUMMARY_TIMEOUT_MS = 30_000;

/** What `AbortSignal.timeout` rejects a fetch with when its time runs out. */
const isTimeout = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";

/**
 * One POST to a model route. A route that did not answer in time is a model
 * that could not be reached, not a rejected output: nothing came back to
 * fix, and a second wait as long as the first is no likelier to be heard.
 */
async function post(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const detail: unknown = await response.json().catch(() => null);
      const error = detail && typeof detail === "object" && "error" in detail ? String(detail.error) : response.statusText;
      const message = `${path} answered ${response.status}: ${error}`;
      // 503 is the server saying it has no key: there is nothing to try again.
      throw response.status === 503 ? new ModelUnavailableError(message) : new Error(message);
    }
    return await response.json();
  } catch (error) {
    // The time can run out while the answer is still arriving, as well as before it starts.
    if (isTimeout(error)) throw new ModelUnavailableError(`${path} did not answer within ${Math.round(timeoutMs / 1000)} s`);
    throw error;
  }
}

/**
 * The Coach and the Summary as the browser reaches them: one route each,
 * carrying the Session's evidence, the Learner Notes, the Knowledge
 * Estimates, and the Plan Space, and never the Nickname, the Avatar, or the
 * Theme (ADR 0002). A malformed answer throws, which the engine records as
 * a rejection like any other. A route that did not answer in time, and a
 * Coach route that answered with its own Baseline Plan at its deadline,
 * throw as unreachable, so the engine uses the Baseline at once and does not
 * pay for the same wait twice.
 */
export function routeCoaching(): Coaching {
  return {
    async runCoach(input: CoachInput): Promise<CoachOutput> {
      const answer = await post("/api/coach", input, COACH_TIMEOUT_MS);
      // The route stopped a Coach past its deadline and planned the Baseline itself: a Coach that could not be reached.
      if (isServerBaseline(answer)) throw new ModelUnavailableError(`/api/coach used the Baseline Plan: ${answer.reason}`);
      const parsed = parseCoachOutput(answer);
      if (!parsed.ok) throw new Error(`Coach output rejected: ${parsed.reasons.join("; ")}`);
      return parsed.output;
    },
    async writeSummary(input: SummaryInput): Promise<SummaryOutput> {
      const parsed = parseSummaryOutput(await post("/api/summary", input, SUMMARY_TIMEOUT_MS));
      if (!parsed.ok) throw new Error(`Parent Summary rejected: ${parsed.reasons.join("; ")}`);
      return parsed.output;
    },
  };
}

/**
 * One Coach run and one Parent Summary for a completed Session. What comes
 * back is what the run settled, not a whole record: the caller writes it
 * onto the record as it stands at that moment (`applyCoachRun`), so a slow
 * run cannot drop what landed while it was away. `powers` is the Powers the
 * Session earned, by name, which live beside the Session Log rather than in
 * it (`powersEarnedIn`).
 */
export async function runCoaching(
  coaching: Coaching,
  record: CoachRecord,
  result: SessionResult,
  powers: readonly string[],
  at: Date,
): Promise<CoachRun> {
  const step = await coachSession(coaching, result, record.notes);
  const input = summaryInput(result, step.notes, powers);
  const written = await writeValidSummary(coaching, input);
  return { result, step, summary: parentSummary(input, written, at) };
}

/**
 * The Powers a Session taught Ollie, by name, as the Parent Summary names
 * them. They are read from the Session's own result, which is what the
 * record keeps while it waits for its Coach run, so a reload mid-run names
 * the same Powers as the run that was interrupted.
 */
export const powersEarnedIn = (result: SessionResult): string[] => result.powersEarned.map((id) => powerFor(id).name);
