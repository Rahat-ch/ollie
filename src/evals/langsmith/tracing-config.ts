/**
 * Whether `pnpm eval` traces to LangSmith: only when the person running it
 * sets both `LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY`. Neither is set
 * in production (ADR 0002), and without them the eval command never loads
 * `langsmith` at all. This file imports nothing from it, so the eval can
 * decide before loading anything.
 */

/** The LangSmith project the traces go to unless `LANGSMITH_PROJECT` names another. */
export const DEFAULT_PROJECT = "ollie-eval";

export type TracingDecision =
  | { readonly on: true; readonly project: string }
  /** `reason` is null when nobody asked for tracing, and says what is missing when someone did. */
  | { readonly on: false; readonly reason: string | null };

export function tracingDecision(env: Readonly<Record<string, string | undefined>>): TracingDecision {
  if (env.LANGSMITH_TRACING?.trim().toLowerCase() !== "true") return { on: false, reason: null };
  if (!env.LANGSMITH_API_KEY?.trim()) {
    return { on: false, reason: "LANGSMITH_TRACING is set but LANGSMITH_API_KEY is not, so nothing is traced and no experiment is made." };
  }
  return { on: true, project: env.LANGSMITH_PROJECT?.trim() || DEFAULT_PROJECT };
}
