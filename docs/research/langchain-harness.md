# Ollie as an LLM harness: where LangChain, LangGraph and LangSmith fit, and what else to fix

**Researched:** 2026-09-28, against `src/coach/`, `src/generation/`, `src/loop/`, `src/evals/`, `src/play/coaching.ts`, `src/lib/model-route.ts`, `src/app/api/*/route.ts`, `docs/adr/`, `docs/evals/` (the three live reports of 2026-09-18), and primary sources: the shipped `.d.ts`/`.js` of the current LangChain JS packages (read from the npm tarballs, cited at the matching unpkg URL), docs.langchain.com, platform.claude.com, the Next.js 16 docs bundled in `node_modules/next/dist/docs/`, and the papers listed at the end. No code was run against a model for this note; the cost and latency figures are read from the committed reports.

## Summary

Ollie already *is* a harness, and a stricter one than most: a pure engine owns every number, the model's output passes a deterministic validator before anything keeps it, one retry carries every reason, a Baseline fallback means play never stops, and the eval scores rejected attempts against a control arm on identical seeds. LangChain's JS stack should be brought in **where it adds something Ollie does not have — LangSmith's experiment store and comparison views, LangGraph's explicit, inspectable control flow with node-level timeouts — and kept out of the places where Ollie's own code is already better**: the validators, the fake seam, and the Anthropic call itself, where `@langchain/anthropic` would add a second copy of the SDK for no new capability.

The concrete verdicts:

- **Adds real value:** LangSmith datasets + `evaluate()` with `numRepetitions` and pairwise `evaluateComparative` (replaces hand-diffing JSON reports across runs); LangSmith annotation queues for the Calibration Set (replaces one person labelling in a TypeScript file); a small LangGraph `StateGraph` for the Coach step, *run on the server*, because it makes the validate → retry → fallback ladder a visible artifact and gives it a per-node `timeout` the current code lacks; LangChain `tool()` for an *optional* engine-query Coach variant, measured as an arm.
- **Neutral:** `withStructuredOutput` (it does reach Anthropic's native structured outputs with `method: "jsonSchema"`, but so does the direct SDK today); streaming; subgraphs.
- **Ceremony:** checkpointers and interrupts for the Coach (the device already persists the pending run, and there is no human in the loop at run time); the prompt hub (prompts are code, reviewed in PRs, and hashed for reproducibility); `createAgent` + middleware for a one-shot planner.
- **Downgrade if done carelessly:** LangSmith tracing of production routes (ADR 0002: Session evidence and Notes would leave for a third-party US service with 14-day to 400-day retention); regex- or openevals-style judges replacing the calibrated gate; LangGraph's built-in `retryPolicy` replacing the engine's one-retry-with-reasons rule.

The largest improvements are not LangChain at all. **The Coach costs about $0.21 and 71 s per call, 80 % of it output tokens, and its mean latency is longer than the browser's 60 s timeout** — so in the live app a typical Coach call is likely abandoned, retried, abandoned again, and replaced by the Baseline while the server still pays for both calls. Prompt caching cannot fix this (at most ~18 % of the bill is input); effort and model choice can. After that, the strongest employer signals are **engine-enforced claim agreement and a minimum-evidence rule for "supported"** (moving two measured-only numbers into the validator), **learning Simulated Learners** so "Sessions to Mastery" can show learning, **a cross-family judge panel**, and **CI that runs the fake eval on every push**.

---

## 1. What Ollie has today

**The Coach step** (`src/coach/coach.ts:108-126`): build the input from the Session (`coachInput`, `coach.ts:15-33`, which blanks the unknown and never includes the answer); call the model; check the output (`checkCoachOutput`, `coach.ts:44-58`: schema parse, then `validateNotes` against the IDs the Coach was shown, then `validatePlan` against the Plan Space, then the Hypothesis-under-test cross-check); on rejection, retry once with the rejected output and every reason (`coach.ts:118-123`); after a second rejection, the Baseline Plan with the Notes from before the Session (`coach.ts:95-97, 125`); a Coach that could not be reached at all is not retried (`coach.ts:117`). The validators are pure and report every reason so one retry can fix everything (`src/loop/notes.ts:55-69`, `src/loop/plan-space.ts:95-120`).

**The seam** (`src/generation/types.ts:133-139`): four operations, a fake for every test and the CLI (`src/generation/fake.ts`), and the Anthropic adapter (`src/generation/anthropic.ts`). The Coach is Opus 5 at `effort: "high"` with native structured output via `zodOutputFormat` (`anthropic.ts:42-48`), re-parsed by Ollie's own schema (`anthropic.ts:55-59`). Telemetry is injected, never global (`src/generation/telemetry.ts:1-11, 31-45`), so the app's routes record nothing and only the eval CLI installs a recorder.

**Where the ladder runs: the browser.** The routes run one model call each (`src/app/api/coach/route.ts:12-18` through `src/lib/model-route.ts:22-39`); `coachSession` itself runs on the device (`src/play/coaching.ts:75-86`) against a `routeCoaching()` Generation whose `runCoach` is a `fetch` with `AbortSignal.timeout(60_000)` (`coaching.ts:25, 28-43, 52-58`). The route checks the *body* with zod and holds the key, but has no auth, rate limit or origin check, and does not validate what it returns.

**The eval** (`src/evals/`, method in `docs/evals/README.md`): six seeded Simulated Learners with fixed per-Skill ability, planted weaknesses and fatigue (`src/evals/learners.ts:78-139, 151-171`), a Baseline arm on identical seeds, a held-out split, Evidence Integrity and claim agreement over every citation including rejected attempts (`src/evals/hypotheses.ts:159-215`), regex detection (`hypotheses.ts:28-47`) and regex claim polarity (`hypotheses.ts:59-122`), an Opus judge withheld unless it clears ≥ 0.8 agreement and κ ≥ 0.6 against a hand-labelled set (`src/evals/judge.ts:50, 59`; `src/evals/calibration.ts:1-10`), Wilson intervals (`src/evals/stats.ts:22`), and `eval:rescore` to re-score a stored report (`src/evals/rescore.ts:73`). An earlier note compares this harness with OpenAI Evals, Inspect, promptfoo and Braintrust (`docs/research/evals-comparison.md`); this note does not repeat that.

**What the three live reports say** (`docs/evals/2026-09-18T18-12-41Z.json`, `…18-41-44Z.json`, `…19-09-56Z.json`, `telemetry.byOperation.coach`): 120–122 Coach calls per run; **69.9–73.3 s and $0.206–0.215 per call**; ~8,500 input and ~6,500–6,850 output tokens per call; **output is 79–80 % of the Coach's cost**; `cacheReadTokens` and `cacheWriteTokens` 0. Every Plan in the final run came from the Coach on the first try (`hypotheses.learners[*].sources`: `coach: 20, retry: 0, baseline: 0`), claim agreement per Learner is 0.90–0.98, and the tuning split's false positives are 10 of 45 supported Hypotheses in that run (4/39, 7/44, 10/45 across the three, `docs/evals/README.md:28`).

**A gap the reports do not show.** The eval CLI calls the adapter directly, with no timeout. The app goes through `coaching.ts`, which aborts at 60 s (`coaching.ts:25, 33`). A timeout is not a `ModelUnavailableError` (`src/lib/errors.ts:17`), so `coachSession` treats it as a rejection and **retries** (`coach.ts:116-123`) — a second 60 s wait — then falls back to the Baseline. The route does not pass `request.signal` to the SDK (`model-route.ts:35`, `anthropic.ts:42`), so the server call is not cancelled when the browser gives up. With a *mean* of 71 s, a large share of live Coach runs plausibly end as Baseline after two paid calls. The reports record totals, not a latency distribution, so the share is not verified; it is the first thing to measure.

## 2. Concept mapping: LangChain JS against Ollie

| Concept | What it would replace or add in Ollie | Verdict |
| --- | --- | --- |
| LangGraph `StateGraph`, nodes, edges | `coachSession`'s straight-line code (`coach.ts:108-126`) becomes a graph: `buildInput → callCoach → validate → {accept, retry, fallback}`. Pure nodes wrap the existing functions unchanged. | **Adds value** as a legible artifact (a drawable graph, per-node traces) and as the place a server-side ladder lives; the logic itself is no better than the 18 lines it replaces |
| Conditional edges for the ladder | `addConditionalEdges("validate", route, { accept: END, retry: "callCoach", fallback: "baseline" })` encodes exactly `coach.ts:115-125`, including "unreachable → fallback without retry" | **Neutral to positive**: same rule, visible |
| Node `retryPolicy` | Transport retries (429, 529, network) with backoff — which Ollie does not have today | **Adds value for transport errors only.** It must **not** replace the engine's retry: LangGraph re-runs the node with the same input, whereas Ollie's retry feeds back the rejected output and every reason (`coach-prompt.ts:45-58`). Default `retryOn` excludes `TypeError`/`SyntaxError`/`ReferenceError` [L6] |
| Node `timeout` | A per-node deadline on `callCoach`, set below the browser's patience, so the *server* decides to fall back and returns a Baseline instead of the client abandoning a paid call | **Adds real value** (fixes the §1 gap), though an `AbortSignal` on the SDK call does the same without LangGraph |
| Checkpointers (`MemorySaver`, sqlite, postgres) | Persisting graph state across a crash or reload | **Ceremony.** The device already persists the pending run and re-runs it on reload (`src/play/use-coach.ts:1-11`). A server-side checkpointer would also be a server-side store of Session evidence, against ADR 0002. `@langchain/langgraph-checkpoint-sqlite` pulls native `better-sqlite3` [L1] into an Alpine image built without native modules (`Dockerfile`) |
| `interrupt()` / `Command({ resume })` | Human-in-the-loop | **Ceremony at run time** (no human watches a Coach run; the Parent reads the Notebook afterwards). Useful only offline, e.g. a "review a rejected Coach output" tool for the developer; annotation queues do that better |
| Subgraphs | Coach and Summary as subgraphs of an after-Session graph | **Neutral.** Two sequential calls (`coaching.ts:82-84`) do not need composition |
| Streaming (`streamMode: "updates"`) | Stream node transitions to the client ("Coach thinking… checking… retrying") | **Neutral.** Nothing on screen waits for the Coach (`use-coach.ts:7-9`); useful only for a developer console or demo |
| `withStructuredOutput(schema, { method: "jsonSchema" })` | The `messages.parse` + `zodOutputFormat` call (`anthropic.ts:42-48`) | **Neutral.** It maps to native `output_config.format` [L4], same as today. The default method is tool calling, which would be a quiet downgrade; `strict` throws with `jsonSchema` [L4] |
| `ChatAnthropic` | The direct SDK client | **Slight downgrade.** It exposes `outputConfig` (effort) and passes `cache_control` through [L4], so nothing is lost — but it depends on `@anthropic-ai/sdk ^0.122.0`, which for a 0.x version means `<0.123.0` [L1][N1], while Ollie pins `0.125.0` (`package.json`): two SDK copies. Its `usage_metadata.input_tokens` *includes* cached tokens [L4], unlike the raw API, so `telemetry.ts` would need a change to avoid double counting |
| Tool calling (`tool()` from `langchain`) | Let the Coach *query* the engine — `tallyByStructure(skill)`, `estimateFor(skill)`, `problemsCiting(hypothesisId)`, `crossSessionTally(skill, feature)` — instead of reading an 8.5 k-token text dump | **Adds value as an experiment arm, not a default.** Tools are pure engine functions, so ADR 0001 holds (the engine computes, the model asks). It does address the "one Session at a time" limit. But each tool round-trip is another model turn on a 71 s call, so it must win on detection and false positives, measured, before it ships |
| `createAgent` + middleware | A loop, retries, fallbacks, caching middleware | **Ceremony** for a one-shot planner; the engine's rule is the product's rule and should stay in `src/coach` |
| LangSmith `traceable` / `wrapAnthropic` | Nested traces of eval runs: each Coach call, its validation verdict, retry, fallback | **Adds value in the eval CLI only.** In production it would send Session evidence off-device (see below) |
| LangSmith datasets | The six Learners × 20 Sessions become Examples; also a dataset of recorded `CoachInput`s so a prompt change can be scored without replaying the Loop | **Adds value** |
| `evaluate()` experiments | `src/cli/eval.ts` writing JSON to `docs/evals/`; `numRepetitions` for the three-run spread (`docs/evals/README.md:28`) | **Adds value**, as a second sink beside the committed JSON (which stays the reproducible record) |
| Custom code evaluators | Evidence Integrity, claim agreement, plan sources, convergence — the existing pure scorers, wrapped as `({ inputs, outputs }) => ({ key, score })` | **Adds value**: same numbers, now comparable across experiments in a UI |
| LLM-as-judge evaluators (openevals) | The Story/Summary judge | **Downgrade** as a replacement: openevals hard-depends on `@langchain/openai` [L1] and has no calibration gate. Keep Ollie's judge and its gate; report its result as feedback |
| Pairwise / comparative experiments | Coach A vs Coach B (Opus vs Sonnet, effort high vs medium, tools vs dump) on the same Examples | **Adds real value**: `evaluateComparative` with `randomizeOrder` [L5] is the right shape for paired differences [P9] |
| Annotation queues | The Calibration Set (`calibration.ts`), labelled by one person in code | **Adds real value**: a second labeller, a human–human agreement figure, and a held-back half — the gaps `evals-comparison.md` §3 names |
| Online evaluation | Scoring sampled production traces in the UI | **Downgrade/blocked** by ADR 0002: it requires production tracing |
| Prompt hub / versioning | `COACH_SYSTEM_PROMPT` as a constant (`coach-prompt.ts:10-37`) | **Ceremony.** A prompt pulled at runtime breaks the "prompt is reviewed code" property and the fake seam. Record a prompt hash in experiment `metadata` instead |

### Privacy (ADR 0002)

What a LangSmith trace of `/api/coach` would carry is exactly the route's body — Problem IDs, Skills, blanked equations, Assistance States, response times, Learner Notes, Knowledge Estimates — plus the Coach's Notes. No Nickname crosses that route (`coach/route.ts:1-8`), so this is not a name leak, but ADR 0002 lists four routes as "the whole of it" (`docs/adr/0002-…md:10`), and a fifth recipient that retains per-child learning data for 14 to 400 days [L7] changes that sentence. Self-hosting LangSmith is Enterprise-only [L7]. So:

- **Tracing on in `pnpm eval` only**, where every input is a Simulated Learner. `LANGSMITH_TRACING` stays unset in Coolify.
- If production tracing is ever wanted, use `new Client({ hideInputs: true, hideOutputs: true })` [L5] so only timings, token counts and node outcomes leave, amend ADR 0002 to name the recipient, and say so in onboarding. `traceable` also takes `processInputs`/`processOutputs` in the TS source [L5], though the docs page says otherwise.

### The fake seam and testability

LangGraph nodes are plain `(state) => update` functions, so the pure nodes (`buildInput`, `validate`, `baseline`) wrap `coachInput`, `checkCoachOutput` and `baselinePlan` and are tested as today. The one impure node, `callCoach`, should take a `Pick<Generation, "runCoach">` through a factory closure — `coachGraph(generation)` — so `fakeGeneration` drives the graph in vitest with no network and no LangChain model object. `coach.test.ts` then runs twice: once against `coachSession`, once against the compiled graph, asserting the same `CoachStep` for the same inputs. That keeps the seam at `Generation`, not at a LangChain chat model, and means the graph can call the existing adapter rather than `ChatAnthropic`.

### Bundle and runtime in Next.js 16

The `@langchain/langgraph` root entry imports `node:async_hooks` for `AsyncLocalStorage`; a `browser` export (`dist/web.js`) skips it, and in that build `interrupt`/`getConfig` need config passed explicitly [L6]. Ollie's routes run on the Node.js runtime in a standalone Docker image, so the root entry is fine; import the graph lazily inside the route as the adapter already is (`coach/route.ts:15`) and list heavy packages in `serverExternalPackages` if the build complains [N2]. The graph must never be imported by client code. Not verified: whether the Next 16 edge runtime provides `AsyncLocalStorage` — irrelevant while nothing runs on edge.

### Anthropic features

Effort, native structured output and `cache_control` are all reachable through `@langchain/anthropic` 1.5.11 (`outputConfig`, `withStructuredOutput(…, { method: "jsonSchema" })`, content-block passthrough) [L4]; LangSmith's `wrapAnthropic` traces the raw SDK client too [L5]. So the Anthropic call can stay on the direct SDK, traced by `wrapAnthropic` in the eval, without losing any LangSmith feature.

## 3. Current APIs (checked 2026-09-28)

| Package | Version | Note |
| --- | --- | --- |
| `@langchain/langgraph` | 1.4.18 | peer `zod ^3.25.32 \|\| ^4.2.0` — zod 4.6 fine [L1] |
| `@langchain/core` | 1.2.13 | `zod ^3.25.76 \|\| ^4`; ships zod-v4 interop [L1][L2] |
| `langchain` | 1.5.14 | `createAgent`, `tool`, middleware [L1][L8] |
| `@langchain/anthropic` | 1.5.11 | `@anthropic-ai/sdk ^0.122.0` [L1] |
| `langsmith` | 0.10.5 | `langsmith/evaluation`, `langsmith/traceable`, `langsmith/wrappers/anthropic`, `langsmith/vitest` [L5] |

**State.** `StateSchema` is the current API; `Annotation.Root` and zod-registry state still work but the docs call them legacy [L3]. Plain zod fields become last-value channels; `ReducedValue` gives a reducer; `typeof State.Node` types a node [L2].

**Graph.** From `dist/graph/state.d.ts` and `graph.d.ts` [L2]:

```ts
addNode(key, action, options?: { input?, errorHandler?, retryPolicy?: RetryPolicy,
                                  cachePolicy?, timeout?: number | TimeoutPolicy })
addEdge(startKey: typeof START | N | N[], endKey: N | typeof END): this
addConditionalEdges(source: N, path: RunnableLike<State, BranchPathReturnValue>, pathMap?): this
compile({ checkpointer?, store?, cache?, interruptBefore?, interruptAfter?, name? })
interrupt<I, R>(value: I, options?): R           // needs a checkpointer
new Command({ resume?, update?, goto?, graph? })
type StreamMode = "values" | "updates" | "debug" | "messages" | "checkpoints" | "tasks" | "custom" | "tools"
```

**`ChatAnthropic`** fields include `model`, `maxTokens`, `thinking`, `outputConfig` (effort `"low" | "medium" | "high" | "xhigh" | "max"`), `invocationKwargs`, `betas`; `withStructuredOutput(schema, { name?, method?: "functionCalling" | "jsonSchema", includeRaw?, strict? })`, default `functionCalling` [L4].

**LangSmith.** `evaluate(target, { data, evaluators, summaryEvaluators, experimentPrefix, description, metadata, maxConcurrency, numRepetitions, client })`; evaluators receive `{ run, example, inputs, outputs, referenceOutputs }` and return `{ key, score?, value?, comment? }`; `evaluateComparative(experiments, { evaluators, randomizeOrder })`; `Client.createDataset`, `createExamples({ inputs, outputs, metadata, splits, datasetName })`, `createAnnotationQueue`, `addRunsToAnnotationQueue`; no public `client.pullPrompt` (use `pull` from `langchain/hub`) [L5].

### Sketch: the Coach step as a graph

Types follow the shipped declarations; the sketch has not been type-checked against zod 4.6's `StateSchema` handling (flagged in §6).

```ts
// src/coach/graph.ts — server only
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { baselinePlan } from "@/loop";
import { coachInput, checkCoachOutput } from "./coach";   // unchanged, pure
import { isUnavailable, errorMessage } from "@/lib/errors";
import type { Generation } from "@/generation/types";

const State = new StateSchema({
  result: z.custom<SessionResult>(),
  notes: z.custom<LearnerNotes>(),
  input: z.custom<CoachInput>().optional(),
  attempt: z.number().default(0),
  last: z.custom<CoachCall>().optional(),       // { ok, output?, reasons, unavailable? }
  rejections: z.array(z.custom<CoachRejection>()).default([]),
  step: z.custom<CoachStep>().optional(),
});

export function coachGraph(generation: Pick<Generation, "runCoach">) {
  return new StateGraph(State)
    .addNode("buildInput", (s) => ({ input: coachInput(s.result, s.notes) }))
    .addNode("callCoach", async (s) => {                 // the only impure node
      const input = s.attempt === 0 ? s.input! : { ...s.input!, rejected: { output: s.last!.output, reasons: s.last!.reasons } };
      try {
        const output = await generation.runCoach(input);
        const check = checkCoachOutput(output, s.result, s.notes);
        return { attempt: s.attempt + 1, last: check.ok ? check : { ok: false, output, reasons: check.reasons } };
      } catch (e) {
        return { attempt: s.attempt + 1, last: { ok: false, reasons: [errorMessage(e)], unavailable: isUnavailable(e) } };
      }
    }, { timeout: 55_000 })                               // server falls back before the browser gives up
    .addNode("accept", (s) => ({ step: { ...s.last!.output!, source: s.attempt === 1 ? "coach" : "retry", rejections: s.rejections } }))
    .addNode("reject", (s) => ({ rejections: [...s.rejections, rejectionOf(s.attempt, s.last!)] }))
    .addNode("baseline", (s) => ({ step: { notes: s.notes, plan: baselinePlan(s.result.profile), source: "baseline", rejections: s.rejections } }))
    .addEdge(START, "buildInput")
    .addEdge("buildInput", "callCoach")
    .addConditionalEdges("callCoach", (s) => (s.last!.ok ? "accept" : "reject"), { accept: "accept", reject: "reject" })
    .addConditionalEdges("reject", (s) => (s.last!.unavailable || s.attempt >= 2 ? "baseline" : "retry"),
      { baseline: "baseline", retry: "callCoach" })
    .addEdge("accept", END)
    .addEdge("baseline", END)
    .compile();                                           // no checkpointer: the device persists the run
}
```

The rule is `coach.ts:108-126` edge for edge; the engine's retry-with-reasons stays in the node, not in `retryPolicy`. A node-level timeout that throws would need an `errorHandler` routing to `baseline` [L2]; check how `timeout` surfaces before relying on it. The route becomes `modelRoute({ schema: CoachInputSchema, run: … coachGraph(anthropicGeneration({ apiKey })).invoke(…) })`, which moves validation to the server (§4.7).

### Sketch: the eval as a LangSmith experiment

```ts
// src/cli/eval-langsmith.ts — eval only; LANGSMITH_TRACING=true set here, never in Coolify
import { evaluate, evaluateComparative } from "langsmith/evaluation";
import { Client } from "langsmith";
import { SIMULATED_LEARNERS } from "@/evals/learners";
import { runLearner } from "@/evals/run";                  // existing seeded Loop (src/evals/run.ts:55); call adapted
// coachArm(model, effort) and pairwiseFp are helpers to write: a coachPlanner (run.ts:33) over an adapter with that model and effort, and a per-Example comparison of the two false-positive rates
import { scoreHypotheses } from "@/evals/hypotheses";
import { scoreConvergence } from "@/evals/convergence";

const client = new Client();
await client.createExamples({
  datasetName: "ollie-learners-v1",
  inputs: SIMULATED_LEARNERS.map((l) => ({ learner: l.id, sessions: 20 })),
  outputs: SIMULATED_LEARNERS.map((l) => ({ planted: l.weaknesses })),
  splits: SIMULATED_LEARNERS.map((l) => (l.heldOut ? ["held-out"] : ["tuning"])),
});

const integrity = ({ outputs }) => ({ key: "evidence_integrity", score: scoreHypotheses(outputs.run).evidence.integrity });
const agreement = ({ outputs }) => ({ key: "claim_agreement", score: scoreHypotheses(outputs.run).evidence.claimAgreement });
const falsePositives = ({ outputs }) => ({ key: "false_positive_rate", score: scoreHypotheses(outputs.run).falsePositiveRate });
const mastery = ({ outputs }) => ({ key: "skills_mastered", score: Object.keys(scoreConvergence(outputs.run).sessionsToMastery).length });

const opus = await evaluate((inputs) => runLearner(inputs, coachArm("claude-opus-5", "high")), {
  data: "ollie-learners-v1", evaluators: [integrity, agreement, falsePositives, mastery],
  experimentPrefix: "coach-opus5-high", numRepetitions: 3, maxConcurrency: 2,
  metadata: { model: "claude-opus-5", effort: "high", promptSha: COACH_PROMPT_SHA },
});
const sonnet = await evaluate((inputs) => runLearner(inputs, coachArm("claude-sonnet-5", "medium")), { /* same, other arm */ });

await evaluateComparative([opus.experimentName, sonnet.experimentName], {
  evaluators: [({ outputs }) => ({ key: "fewer_false_positives", scores: pairwiseFp(outputs) })],
  randomizeOrder: true,
});
```

The scorers are Ollie's own; LangSmith only stores, repeats and compares. The committed JSON report stays the source of truth, and the judge's calibration gate stays in `judge.ts` — its verdict (`withheld` or not) is written as experiment metadata so a withheld score is never shown as a number.

### Prompt caching, structured outputs and effort in 2026

- Caching: breakpoint at the end of the static prefix; tools → system → messages order; minimum 512 tokens on Opus 5 and 1,024 on Sonnet 5; 5-minute TTL (1.25× write) or 1-hour (2× write); reads 0.1× (0.05× on Opus 5.5); changing `output_config.format` or effort invalidates the messages cache [A1][A3]. Structured outputs are GA via `output_config.format`; the compiled schema grammar is cached 24 h [A2]. Effort (`low`…`max`) scales all output tokens, "a behavioral signal, not a strict token budget" [A3].
- **Applied to the Coach:** the only stable prefix is the ~650-token system prompt (2,616 characters, `coach-prompt.ts:10-37`, estimated at 4 characters a token) plus the injected schema prompt. It clears Opus 5's 512-token minimum, so caching would *work*, but it saves roughly 650 × $5/M × 0.9 ≈ $0.003 of a $0.21 call. Even caching all ~8,500 input tokens would cap savings at ~$0.038 (18 %), because the evidence and Notes change every Session. **Output is the bill** ($0.166 of $0.208 per call in the final run). The levers are effort (`high` → `medium`), model (Sonnet 5 at $2/$10; Opus 5.5 at $4/$20 with default effort `medium` [A4]), and the Batch API's 50 % discount for evals [A5]. Caching is still worth turning on in the eval (free, and it makes `cacheReadTokens` non-zero), but it should be presented honestly as a rounding error.

## 4. Improvements beyond LangChain

Each: what it fixes, how, effort, and what it shows.

**4.1 Runtime enforcement of claim agreement.** *Fixes:* agreement (0.90–0.98) is scored after the fact by regex polarity (`hypotheses.ts:59-122, 167-190`) but never enforced, so a Parent can read a "struggles with X" claim backed by first-try-correct Problems. *How:* add a structured `polarity: "difficulty" | "strength" | "mixed"` field to the Hypothesis schema (`src/generation/coach-schema.ts:10-13`); `validateNotes` checks each citation's Assistance State against the *declared* polarity — a deterministic check of a machine-readable field, not a regex over prose. The regex scorer stays as an eval of whether the prose matches the declared polarity. *Effort:* a day, plus a live run. *Shows:* the ADR 0001 instinct extended — make the model declare the checkable part, let the engine check it.

**4.2 Engine-owned statistics before "supported".** *Fixes:* 10–22 % false positives on the tuning split. *How:* the engine computes per-(Skill, feature) first-try tallies across the Log and cited history — features the generator already knows, like "whole above ten with both parts below" (`learners.ts:50-53` has the predicate) — and `validateNotes` rejects `status: "supported"` unless the cited evidence clears a minimum-evidence rule (say ≥ 4 first attempts on the feature and a Wilson upper bound below the Skill's other-feature rate). The Coach may still *propose* anything. Keep the feature vocabulary broad (every generator feature, not only the two planted weaknesses) or the eval teaches to the test. *Trade-off:* sessions to detection will rise; report both. *Effort:* 2–3 days. *Shows:* statistical guardrails in the validator, and a before/after on false positives with intervals.

**4.3 Simulated Learners that learn.** *Fixes:* ability is fixed (`learners.ts:151-171`), so "Sessions to Mastery" measures diagnosis speed, not learning (`evals-comparison.md` §4). *How:* give each Learner a hidden per-Skill known/unknown state that transitions with probability p(T) after each practice opportunity and emits answers through guess and slip — the generative form of Bayesian Knowledge Tracing [P1] — with the existing weakness penalty and fatigue on top. `src/loop/bkt.ts:8-16` already has the update; the simulator is its forward model. **Draw the simulator's parameters from a different distribution than the engine's hand-set tracer (`src/loop/skills.ts:60`)**, or the tracer is perfectly specified and the eval flatters it; Doroudi, Aleven and Brunskill's review found instructional policies look best on simulators built from the policy's own model, and recommends offline evaluation robust to that assumption [P2]. Report results under two or three simulator families. *Effort:* 2–3 days. *Shows:* knowledge-tracing literacy and awareness of simulator bias.

**4.4 A cross-family judge with structured rubrics.** *Fixes:* Opus judges Opus and Sonnet (`src/evals/judge-anthropic.ts:20`); detection is regex, widened to match the Coach's own phrasings once live output had been seen (`hypotheses.ts:28-47`; `docs/evals/README.md:16`, "The Coach's own words for a crossing are matched with up to two words in the way"). *How:* a panel — one Claude model plus one or two from other families — with majority vote, following Verga et al. [P5]; self-preference is measurable and tied to self-recognition [P4][P3]. Replace regex detection with a rubric judge asked a closed question per Hypothesis ("does this supported claim say the Learner has difficulty with sums that cross ten? yes/no/unclear"), calibrated on its own hand-labelled set under the same ≥ 0.8 / κ ≥ 0.6 gate, with a held-back half and a second labeller via annotation queues. Maurya et al.'s tutor-evaluation taxonomy reports κ = 0.71 between human annotators [P7], a useful ceiling. *Effort:* 3–4 days. *Shows:* judge rigour. Note: a non-Anthropic judge adds a new data recipient — fine for eval-only Simulated Learner data.

**4.5 Sonnet vs Opus Coach, with repetitions.** *Fixes:* a single model/effort choice made without a comparison; cost and latency (§1). *How:* four arms — Opus 5 high (today), Opus 5 medium, Opus 5.5 medium, Sonnet 5 medium — three repetitions each, same seeds, paired by Learner and Session; report cost, p50/p95 latency (add per-call `ms` to the report, not only totals), plan sources, claim agreement, false positives, detection, with paired differences and clustered standard errors [P9]. Use the Batch API for the non-latency arms [A5]. *Effort:* 1–2 days plus ~$100–150 of API. *Shows:* cost/quality trade-off reasoning with error bars — a very strong employer signal.

**4.6 CI.** *Fixes:* no `.github/` at all. *How:* a GitHub Actions workflow running `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm eval --fake` (milliseconds; exercises every seam and the report writer) and `pnpm build`; a nightly or manual job gated on an `ANTHROPIC_API_KEY` secret running a small live smoke eval (one Learner, three Sessions) that asserts Evidence Integrity = 1.00 and no Baseline fallbacks. *Effort:* half a day. *Shows:* evals as regression tests.

**4.7 Server-side validation of Coach and Summary output.** *Fixes:* the routes return unvalidated model output (`coach/route.ts:6-7`). *How:* run `coachSession` (or the graph) in the route. The server can rebuild the known IDs from the body (evidence IDs plus the Notes' citations, `notes.ts:13-18`) and the Plan Space from `estimates`, since unlocks depend only on per-Skill mastery (`src/loop/units.ts:19-21`). Keep the device-side check too (defence in depth, and it is what makes the Baseline fallback offline-proof). *Effort:* 1 day. *Shows:* trust boundaries done properly.

**4.8 Timeout, cancellation and rate limiting on the model routes.** *Fixes:* the §1 timeout/retry/billing gap, and unauthenticated routes that spend the owner's API budget. *How:* pass `request.signal` into the SDK call; give the server a deadline below the browser's, falling back server-side; stop the client retrying on a timeout. Add a Next 16 `proxy.ts` (Middleware renamed, Node.js runtime by default [N3]) with a same-origin check on `/api/*` and a per-IP token bucket (the Next docs suggest code-level limits plus the host's [N4]; an in-memory bucket is fine for one container). At the edge, a Cloudflare rate-limiting rule and Turnstile on first run in front of the proxied origin (`docs/deploy.md:44`) [C1][C2]. *Effort:* 1 day. *Shows:* production hygiene for LLM endpoints.

**4.9 Multi-session memory for the Coach.** *Fixes:* the Coach sees this Session's Log and the Notes only (`coach.ts:15-33`); history reaches it only through what it chose to cite. *How:* the engine computes a compact cross-Session tally per (Skill, feature) from the Profile's history — numbers, not prose — and either adds it to the input or exposes it as a tool (§2). The Notes stay the memory the Parent reads; the tally is the memory the engine vouches for. *Effort:* 1–2 days. *Shows:* memory designed around what can be verified, which LLM-tutor work repeatedly flags: MathDial found LLMs "are good problem solvers, [but] fail at tutoring" [P6], and unguarded GPT-4 help raised practice scores but hurt later unassisted performance [P8].

**Housekeeping:** `README.md:71` ("Still to run with a key…") is stale; update it or cut it when the rest lands.

## 4a. TypeSafe Jev: where a typed judgment beats regex (checked 2026-09-28)

Jev is TypeSafe's System One model: it returns typed judgments with probabilities (Choice, Noul, Score) rather than text ([System One](https://docs.typesafe.ai/concepts/system-one.md), [primitives](https://docs.typesafe.ai/primitives.md)). The JS SDK is `@typesafe-ai/sdk` (Node 20+, `TYPESAFE_API_KEY`, `new TypeSafeClient()`, a `state` object plus a `questions` object answered in parallel) ([JavaScript SDK](https://docs.typesafe.ai/sdk/javascript.md)). Ollie has three places where code currently fakes semantic understanding with word lists, and those are where Jev fits.

1. **The eval's claim reader (best fit).** `src/evals/hypotheses.ts:28-140` reads each Hypothesis with regexes: `WEAKNESS_PHRASES` for detection and false positives, and `DIFFICULTY_WORDS`, `STRENGTH_WORDS`, the negation rules and `CONTRAST_WORDS` for claim polarity. These were extended after reading live Coach output (for example the "up to two words in the way" rule at lines 22-27), which is the post-hoc tuning a reviewer will question. The replacement is one Choice (polarity: difficulty, strength, contrastive, neutral) and one Noul per weakness tag ("does this claim say the Learner has difficulty when a sum or difference has to cross ten?"), asked together over the claim as state. Because it is a different model family from the Coach, it is also the cross-family reader §4 asks for. It must pass the same calibration gate as the Judge (`src/evals/judge.ts:50-59`): hand-label roughly 100 claims taken from the three live reports, then report regex against Jev agreement and kappa on the labels. That comparison is the demo.
2. **Runtime claim-against-evidence check.** This follows the [citation-check cookbook](https://docs.typesafe.ai/cookbooks/citation_check.md): a Choice of supports, contradicts or says_nothing over a claim and a source, auto-accepted at confidence 0.8 or above and escalated below it. The cookbook reports about 2 s per call. In Ollie the source is the engine-rendered table of the cited Problems and their Assistance States. A "contradicts" verdict becomes a rejection reason in `checkCoachOutput` (`src/coach/coach.ts:44-58`), so it feeds the existing retry. A low-confidence verdict does not reject; the Notebook marks the Hypothesis "unconfirmed". This turns the 92-95% claim agreement from a measurement into an enforced rule. It pairs with, and does not replace, the deterministic `polarity` field proposed in §4: the field makes the check exact, and Jev checks that the prose says what the field declares.
3. **The Parent Summary's mind-reading check.** `src/summary/validate.ts:28,142` rejects a Summary when it contains a word from the `MIND_READING` list. That misses paraphrases ("she figured out that...") and flags harmless uses. A per-sentence Noul ("does this sentence claim to know what the child was thinking or feeling?") with the word list kept as a hard pre-filter follows the cookbook's own layering: string checks first, then the model.
4. **A second Judge for Story readability.** A Score with ordered Grade 1 readability levels, run next to the Opus Judge on the Calibration Set, gives a second judge from a different model family. It is useful only as a panel member, because the Opus Judge already scores 20 of 20.

**Not a fit:**
- Deciding whether a Session needs the Coach at all. That is a rule over counts, and it belongs in the engine.
- Anything about the math: ADR 0001 stands.
- Replacing the Coach itself. The Coach generates plans and prose, and Jev does not generate.

**Privacy (ADR 0002):** use cases 2 and 3 add a new processor on the Coach and Summary paths. The data involved is the same non-personal evidence those routes already send (no Nickname, schema-bounded), but the ADR's list of what leaves the device and to whom must be amended before shipping. Use cases 1 and 4 run only in the eval, and the eval uses no real child data.

**Unverified:** pricing, rate limits and data retention were not on the pages read; the SDK page shows `choice()` but not the full `noul`/`score` signatures; per-domain accuracy is unmeasured until the calibration run.

## 5. Recommended plan

**Phase 1 — Harden (≈ 3–4 days).** Measure per-call latency and log it; fix timeout/cancellation/retry-on-timeout (4.8); server-side validation (4.7); origin check, rate limit, Cloudflare rule; CI with `pnpm eval --fake` (4.6); a first effort/model comparison run (4.5) to get the Coach under ~30 s. *Demonstrable:* a green CI badge; a before/after table of cost, p95 latency and live Baseline-fallback share; a `curl` showing a 429 and a 403. *Principles:* validators unchanged, now also on the server; no new data leaves.

**Phase 2 — LangGraph harness + LangSmith evals (≈ 4–5 days).** `coachGraph` behind the route with the fake-driven parity test; `wrapAnthropic`/`traceable` in the eval CLI only; datasets, `evaluate()` with `numRepetitions: 3`, and a pairwise experiment for the Phase 1 arms; the Calibration Set moved into an annotation queue with a second labeller and a held-back half. *Demonstrable:* a rendered graph diagram in the README; a LangSmith comparison view on camera, Opus vs Sonnet side by side per Learner; the parity test proving the graph is the same rule. *Principles:* engine code untouched (nodes wrap it); `Generation` stays the seam; ADR 0002 gets one line saying tracing is eval-only.

**Phase 3 — Eval upgrades (≈ 7–10 days).** Declared polarity enforced (4.1); minimum-evidence rule (4.2); learning Simulated Learners under two simulator families (4.3); cross-family judge panel and rubric detection with its own calibration (4.4); engine-computed cross-Session tally and a tools-based Coach arm (4.9, §2). *Demonstrable:* false positives before/after with intervals; a "Sessions to Mastery" chart that now shows learning; a judge that disagrees with itself less than a single model does. *Principles:* every new check is engine-side and deterministic; the Coach gains nothing it can use to set a number.

**Strongest employer signals, in order:** the Phase 1 cost/latency diagnosis with numbers (it shows reading one's own telemetry and finding a real bug); 4.1 + 4.2 (moving measured metrics into enforced invariants); the LangSmith pairwise experiment with repetitions and paired error bars; the LangGraph graph with a parity test against the fake (it shows LangGraph used deliberately, not as a wrapper). The LangChain pieces are the most recognisable on a CV; the invariants and the diagnosis are what a senior reviewer will remember.

## 6. What could not be verified

- The share of live Coach runs that time out and fall back: the reports hold totals, not a distribution.
- The graph sketch is not type-checked; `StateSchema` defaults with zod 4.6 and how a node `timeout` surfaces (throw vs `errorHandler`) were read from declarations, not run.
- Whether `withStructuredOutput(…, { method: "jsonSchema" })` strips JSON Schema keywords Anthropic rejects (`minimum`, `maximum`, recursive schemas [A2]) the way the SDK's `zodOutputFormat` does.
- The system prompt's token count is a character estimate; the schema prompt Anthropic injects is not counted.
- Opus 5.5's output-token reduction at `medium` for this task is a hypothesis to measure, not a fact.
- LangSmith pricing and retention are from the marketing pricing page.
- Paper details behind paywalls: Corbett & Anderson's exact parameter wording and year (1994/1995), Bastani et al.'s percentages, Landis & Koch's bands.

---

## Sources

- TypeSafe docs index, System One, primitives, confidence, JavaScript SDK, citation-check cookbook: https://docs.typesafe.ai/llms.txt (and the pages linked in §4a)

**Ollie (this repo, `main` @ `79d125d`):** `docs/adr/0001-…`, `0002-…`, `0003-…`; `src/coach/coach.ts`, `src/coach/types.ts`; `src/generation/{types,anthropic,coach-prompt,coach-schema,telemetry,fake}.ts`; `src/loop/{notes,plan-space,units,bkt,skills}.ts`; `src/play/{coaching,use-coach}.ts`; `src/lib/{model-route,errors}.ts`; `src/app/api/{coach,summary}/route.ts`; `src/evals/{learners,hypotheses,judge,judge-anthropic,calibration,stats,rescore}.ts`; `docs/evals/README.md`; `docs/evals/2026-09-18T18-12-41Z.json`, `…18-41-44Z.json`, `…19-09-56Z.json`; `docs/deploy.md`; `Dockerfile`; `package.json`; `README.md`; `docs/research/evals-comparison.md`.

**LangChain JS (primary: shipped package files and official docs):**
- [L1] npm registry: <https://registry.npmjs.org/@langchain/langgraph/latest>, <https://registry.npmjs.org/@langchain/core/latest>, <https://registry.npmjs.org/langchain/latest>, <https://registry.npmjs.org/@langchain/anthropic/latest>, <https://registry.npmjs.org/langsmith/latest>, <https://registry.npmjs.org/@langchain/langgraph-checkpoint-sqlite/latest>, <https://registry.npmjs.org/openevals/latest>
- [L2] <https://unpkg.com/@langchain/langgraph@1.4.18/dist/state/schema.d.ts>, <https://unpkg.com/@langchain/langgraph@1.4.18/dist/graph/state.d.ts>, <https://unpkg.com/@langchain/langgraph@1.4.18/dist/graph/graph.d.ts>, <https://unpkg.com/@langchain/langgraph@1.4.18/dist/pregel/types.d.ts>, <https://unpkg.com/@langchain/core@1.2.13/dist/utils/types/zod.d.ts>
- [L3] <https://docs.langchain.com/oss/javascript/langgraph/use-graph-api>
- [L4] <https://unpkg.com/@langchain/anthropic@1.5.11/dist/chat_models.d.ts> and `dist/chat_models.js` (`withStructuredOutput`), `dist/utils/message_outputs.js` (`buildUsageMetadata`)
- [L5] <https://unpkg.com/langsmith@0.10.5/package.json>, `dist/evaluation/_runner.d.ts`, `dist/evaluation/evaluate_comparative.d.ts`, `dist/wrappers/anthropic.d.ts`, `dist/client.d.ts`, `dist/traceable.d.ts`; <https://docs.langchain.com/langsmith/mask-inputs-outputs>; <https://docs.langchain.com/langsmith/online-evaluations>
- [L6] <https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/use-in-web-environments.ipynb>, <https://github.com/langchain-ai/langgraphjs/issues/879>
- [L7] <https://www.langchain.com/pricing>
- [L8] <https://unpkg.com/langchain@1.5.14/dist/index.d.ts>

**Anthropic:**
- [A1] <https://platform.claude.com/docs/en/build-with-claude/prompt-caching>
- [A2] <https://platform.claude.com/docs/en/build-with-claude/structured-outputs>
- [A3] <https://platform.claude.com/docs/en/build-with-claude/effort>
- [A4] <https://platform.claude.com/docs/en/about-claude/models/overview>
- [A5] <https://platform.claude.com/docs/en/about-claude/pricing>

**Next.js, npm, Cloudflare:**
- [N1] npm semver caret ranges for 0.x versions: <https://docs.npmjs.com/cli/v6/using-npm/semver#caret-ranges-123-025-004>
- [N2] `node_modules/next/dist/docs/01-app/02-guides/package-bundling.md` (`serverExternalPackages`)
- [N3] `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`; `…/03-api-reference/03-file-conventions/proxy.md` ("Proxy defaults to using the Node.js runtime")
- [N4] `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` §Rate limiting
- [C1] <https://developers.cloudflare.com/waf/rate-limiting-rules/> (not fetched for this note; cited as the product's documentation home)
- [C2] <https://developers.cloudflare.com/turnstile/> (not fetched for this note)

**Papers:**
- [P1] Corbett, A. T. & Anderson, J. R. "Knowledge tracing: Modeling the acquisition of procedural knowledge." *User Modeling and User-Adapted Interaction* 4(4):253–278, 1994/1995. <https://doi.org/10.1007/BF01099821>
- [P2] Doroudi, S., Aleven, V. & Brunskill, E. "Where's the Reward? A Review of Reinforcement Learning for Instructional Sequencing." *IJAIED* 29(4):568–620, 2019. <https://doi.org/10.1007/s40593-019-00187-x>
- [P3] Zheng, L. et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." NeurIPS 2023 Datasets & Benchmarks. <https://arxiv.org/abs/2306.05685>
- [P4] Panickssery, A., Bowman, S. R. & Feng, S. "LLM Evaluators Recognize and Favor Their Own Generations." 2024. <https://arxiv.org/abs/2404.13076>
- [P5] Verga, P. et al. "Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models." 2024. <https://arxiv.org/abs/2404.18796>
- [P6] Macina, J. et al. "MathDial: A Dialogue Tutoring Dataset with Rich Pedagogical Properties Grounded in Math Reasoning Problems." Findings of EMNLP 2023. <https://arxiv.org/abs/2305.14536>
- [P7] Maurya, K. K., Srivatsa, KV A., Petukhova, K. & Kochmar, E. "Unifying AI Tutor Evaluation: An Evaluation Taxonomy for Pedagogical Ability Assessment of LLM-Powered AI Tutors." NAACL 2025. <https://aclanthology.org/2025.naacl-long.57/>
- [P8] Bastani, H. et al. "Generative AI without guardrails can harm learning: Evidence from high school mathematics." *PNAS* 122(26), 2025. <https://doi.org/10.1073/pnas.2422633122>
- [P9] Miller, E. "Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations." 2024. <https://arxiv.org/abs/2411.00640>
- Further reading consulted: Jurenka, I. et al. "Towards Responsible Development of Generative AI for Education: An Evaluation-Driven Approach." 2024, <https://arxiv.org/abs/2407.12687>; Wang, R. E. et al. "Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise." 2024, <https://arxiv.org/abs/2410.03017>; Rafferty, A. N. et al. "Faster Teaching via POMDP Planning." *Cognitive Science* 40(6), 2016, <https://doi.org/10.1111/cogs.12290>.
