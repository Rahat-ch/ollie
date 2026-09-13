/**
 * The Stories for a Session's Unit 3 Problems, with the Nickname in: from
 * the bundled Content Pool at once, otherwise asked of the server as soon
 * as the Session starts (which fills its own Pool or writes one live), and
 * the template sentence if that fails or takes too long. A Problem with no
 * Story yet is asked with the engine's template line, so nothing waits.
 */
import { useEffect, useState } from "react";
import type { Problem, ProblemId } from "@/loop";
import type { Identity } from "@/profile/identity";
import { BUNDLED_POOL } from "@/story/bundled";
import { withNickname } from "@/story/nickname";
import type { PoolInput } from "@/story/pool";
import { templateStory } from "@/story/template";
import { requestSpeech, storySpeechRequest } from "./speech-pool";
import { pooledStory, storyInputFor, variantFor } from "./stories";

export type StoryLine = {
  readonly text: string;
  readonly source: "pool" | "generated" | "template";
};

/** How long the server gets before the template sentence is used instead. */
export const STORY_TIMEOUT_MS = 8000;

export type StoryLines = ReadonlyMap<ProblemId, StoryLine>;

function fromBundledPool(problems: readonly Problem[], theme: Identity["theme"], nickname: string): Map<ProblemId, StoryLine> {
  const lines = new Map<ProblemId, StoryLine>();
  for (const problem of problems) {
    const text = pooledStory(BUNDLED_POOL, problem, theme);
    if (text !== undefined) lines.set(problem.id, { text: withNickname(text, nickname), source: "pool" });
  }
  return lines;
}

/** Ask the server; the template on any failure, a bad answer, or the timeout. */
async function fetchStory(input: PoolInput, variant: number, nickname: string, signal: AbortSignal): Promise<StoryLine> {
  const fallback: StoryLine = { text: templateStory({ ...input, nickname }), source: "template" };
  const timeout = AbortSignal.timeout(STORY_TIMEOUT_MS);
  try {
    const response = await fetch("/api/story", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, variant }),
      signal: AbortSignal.any([signal, timeout]),
    });
    if (!response.ok) return fallback;
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return fallback;
    const { text, source } = body as { text?: unknown; source?: unknown };
    if (typeof text !== "string" || (source !== "pool" && source !== "generated" && source !== "template")) return fallback;
    return { text: withNickname(text, nickname), source };
  } catch {
    return fallback;
  }
}

export function useStories(problems: readonly Problem[], identity: Identity): StoryLines {
  const { theme, nickname } = identity;
  const [lines, setLines] = useState<StoryLines>(() => fromBundledPool(problems, theme, nickname));

  // Problem IDs are unique across the Profile's history, so a line is never stale.
  useEffect(() => {
    const controller = new AbortController();
    for (const problem of problems) {
      const input = storyInputFor(problem, theme);
      if (!input || pooledStory(BUNDLED_POOL, problem, theme) !== undefined) continue;
      void fetchStory(input, variantFor(problem), nickname, controller.signal).then((line) => {
        if (controller.signal.aborted) return;
        setLines((current) => new Map(current).set(problem.id, line));
      });
    }
    return () => controller.abort();
  }, [problems, theme, nickname]);

  // A Story is voiced with the Nickname in it, which the server renders once
  // and adds to the Pool, so it is asked for the moment the Story is known
  // rather than when the Problem comes up. Nothing waits on the answer: a
  // Problem whose audio has not arrived is spoken by the next step of the chain.
  useEffect(() => {
    for (const problem of problems) {
      const line = lines.get(problem.id);
      const request = line && storySpeechRequest(problem, identity, line.text);
      if (request) void requestSpeech(request);
    }
  }, [lines, problems, identity]);

  return lines;
}
