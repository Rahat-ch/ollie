/**
 * Run a Simulated Learner for N Coach Sessions through the pure Loop and
 * print the Learner Notes and the next Session Plan after each, so the Notes
 * can be read evolving. The first Session is the Diagnostic Session; from
 * Session 2 the Plan is the Coach's, or the Baseline Plan when the Coach's
 * output was rejected twice.
 *
 *   pnpm coach                              # crossing-ten-weakness, 5 Sessions, the fake Generation
 *   pnpm coach --learner weak --sessions 3
 *   pnpm coach --real                       # the Anthropic adapter on Opus 5; needs ANTHROPIC_API_KEY
 *   pnpm coach --verbose                    # also the full Session Log for every Session
 *
 * The fake needs no network. --real reads ANTHROPIC_API_KEY from the
 * environment, or from .env.local at the repo root when that file exists.
 * There is no --seed: the Learner's own seed is the seed.
 */
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { coachSession, type CoachStep } from "@/coach";
import { SIMULATED_LEARNERS, simulatedLearner, type SimulatedLearner } from "@/evals/learners";
import { fakeGeneration, type Generation } from "@/generation";
import { readEnv, requireEnv } from "@/lib/env";
import { DIAGNOSTIC_PLAN, emptyNotes, newProfile, runSession } from "@/loop";
import { formatEstimates, formatNotes, formatPlan, formatSessionLine, formatSessionLog } from "@/loop/format";

const { values } = parseArgs({
  options: {
    learner: { type: "string", default: "crossing-ten-weakness" },
    sessions: { type: "string", default: "5" },
    real: { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
  },
});

const sessions = Number(values.sessions);
if (!Number.isInteger(sessions) || sessions < 1) {
  console.error(`--sessions must be a positive integer, got "${values.sessions}"`);
  process.exit(1);
}

const learner = SIMULATED_LEARNERS.find((l) => l.id === values.learner);
if (!learner) {
  const ids = SIMULATED_LEARNERS.map((l) => l.id).join(", ");
  console.error(`--learner must be one of ${ids}, got "${values.learner}"`);
  process.exit(1);
}

const SOURCE_LABEL: Record<CoachStep["source"], string> = {
  coach: "Coach",
  retry: "Coach after one retry",
  baseline: "Baseline Plan: the Coach's output was rejected twice",
};

/** The fake, or the real adapter; the adapter is imported only when asked for, so the fake run never loads the SDK. */
async function chooseGeneration(real: boolean): Promise<Generation> {
  if (!real) {
    console.log("Generation: the fake (no network)");
    return fakeGeneration();
  }
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const apiKey = requireEnv(readEnv(), "anthropicApiKey");
  const { anthropicGeneration, COACH_MODEL } = await import("@/generation/anthropic");
  console.log(`Generation: the Anthropic adapter on ${COACH_MODEL}`);
  return anthropicGeneration({ apiKey });
}

async function main(learner: SimulatedLearner): Promise<void> {
  const generation = await chooseGeneration(values.real);
  console.log(`Learner: ${learner.name} (${learner.id}, seed ${learner.seed}), ${sessions} Sessions\n`);
  let profile = newProfile();
  let notes = emptyNotes();
  let plan = DIAGNOSTIC_PLAN;
  for (let i = 1; i <= sessions; i++) {
    const result = runSession(plan, profile, learner.seed, simulatedLearner(learner));
    console.log(formatSessionLine(result));
    if (values.verbose) console.log(`\n${formatSessionLog(result)}`);
    const step = await coachSession(generation, result, notes);
    console.log(`\nSource: ${SOURCE_LABEL[step.source]}`);
    for (const { attempt, reasons } of step.rejections) {
      console.log([`Attempt ${attempt} rejected:`, ...reasons.map((reason) => `  - ${reason}`)].join("\n"));
    }
    console.log(`\n${formatNotes(step.notes)}\n\nSession Plan for Session ${i + 1}\n${formatPlan(step.plan)}\n`);
    ({ notes, plan } = step);
    profile = result.profile;
  }
  console.log(formatEstimates(profile));
}

main(learner).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
