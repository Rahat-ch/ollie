# Spec: Ollie as a harness that holds up under scrutiny

Status: ready-for-agent
Created: 2026-09-28
Inputs: `.scratch/harness/decisions.md` (33 decisions), `docs/research/langchain-harness.md`, `CONTEXT.md`, `docs/adr/0001` to `0005`, `docs/evals/README.md`, the three live reports of 2026-09-18 in `docs/evals/`

Vocabulary in this spec is the glossary in `CONTEXT.md`. Capitalised terms are defined there. The new terms are Polarity, Feature, Minimum-Evidence Rule, Simulator Family, Claim Agreement, Declaration Fidelity, Pre-registration and Arm.

## Problem Statement

Ollie is meant to show an employer that its author can ship an LLM feature that holds up in production, and prove it with evals. Looked at the way a sceptical AI-engineering hiring manager would look at it, today's version has seven faults.

**The live Coach probably never reaches the Learner.**
- A Coach call averages 70 to 73 seconds on Opus 5 at high effort (`telemetry.byOperation.coach` in the three live reports). The browser gives up at 60 (`src/play/coaching.ts:25`).
- A timeout is treated as a rejection, so the device retries once, gives up again, and then uses the Baseline.
- The route never cancels the SDK call, so each abandoned Session is paid for twice.
- The eval calls the adapter without a timeout, so the reports say "0 fallbacks" and hide all of this.

**Model output is not checked where it is trusted.**
- The four model routes return whatever the model wrote. Validation runs only in the browser.
- The routes have no origin check, no rate limit and no spend cap. Anyone who finds the URL can spend the owner's API budget.

**Two numbers are measured but never enforced.**
- Claim Agreement (92 to 95 percent) means a Parent can read "struggles with X" backed by first-try-correct Problems.
- Supported Hypotheses naming a weakness the Learner does not have run at 10 to 22 percent on the tuning split.
- The Coach's confidence and status are numbers it writes and nobody checks.

**The scorers were tuned after seeing the answers.**
- Detection and claim polarity are read by regexes that were widened each time the live Coach phrased something new (`src/evals/hypotheses.ts:22-47`).
- The Judge is the same model family as the writers it grades.
- One person hand-labelled every Calibration Set.

**"The Coach is not faster than the drill" has no fair test.**
- The Simulated Learners cannot learn, so Sessions to Mastery measures how fast a planner confirms what is already true.
- A reviewer's first line is "so your AI is worse than a for-loop?"

**It costs too much to run as a product.** About $0.21 a Session, 80 percent of it output tokens. Prompt caching cannot fix that.

**Nothing runs on a push, and the repo still presents it as a contest entry.**
- There is no CI.
- The README, THIRD_PARTY.md, the ADRs and a folder of submission material still describe it as a contest entry, not a project.

Two more changes arrive with this work:
- The owner wants a LangChain stack in it, but only where it earns its place.
- ElevenLabs released Eleven v4 on 2026-09-28, and Ollie is on v3.

## Solution

One thesis organises the work: **make the model declare what's checkable, let deterministic code check it, and run evals that are allowed to say no.** Any work that does not serve the thesis is out. It runs in three phases, in order, and each phase ends with the evidence for a public post.

**Phase 1, harden.**
- Reproduce the timeout fault with a failing test, then fix it:
  - a deadline on the server;
  - cancel the model call when the browser gives up;
  - no retry on a timeout.
- Validate Coach and Summary output on the server.
- Guard the routes with an origin check, a rate limit and a daily spend cap.
- Move every model call to Claude Sonnet 5.5.
- Add CI.
- Remove the contest framing.
- Redesign Ollie's voice on Eleven v4, keeping it only if it wins a blind A/B.
- Write the first Pre-registration, then compare Sonnet 5.5 with the three stored Opus 5 runs.

**Phase 2, LangGraph and LangSmith.**
- The Coach step becomes a LangGraph graph in the route (ADR 0004), proved identical to the current rule by a parity test.
- LangSmith becomes the eval's comparison view, fed only by Simulated Learners.
- A free labelling page lets a second person label the Calibration Sets. Half of each set is held back.

**Phase 3, eval upgrades.**
- Hypotheses declare a Polarity and a Feature, and the engine enforces Claim Agreement and the Minimum-Evidence Rule (ADR 0005).
- The engine hands the Coach a tally across Sessions.
- Simulated Learners learn, under two Simulator Families.
- Jev (TypeSafe) reads the Coach's prose in the eval, calibrated against hand labels.
- A second Pre-registration governs the final runs, and their results are published whether they pass or fail.

## User Stories

### Learner and Parent

1. As a Learner, I want the next Session to be the one the Coach planned, so that the adaptivity I was promised actually reaches me.
2. As a Learner, I want play never to stop when the Coach is slow, down, or over budget, so that a Session always starts.
3. As a Learner, I want Ollie to sound like one owl everywhere, so that a Hint and a Story never come in two different voices.
4. As a Parent, I want every belief in Ollie's Notebook to be backed by Problems that show what it says, so that "struggles with crossing ten" is never backed only by first-try-correct answers.
5. As a Parent, I want a belief marked supported only when there is enough evidence for it, so that one bad afternoon is not reported as a weakness.
6. As a Parent, I want the privacy promise at onboarding to stay true, so that tracing, evaluation and new vendors never receive my child's Sessions.

### The owner, running a public product

7. As the owner, I want the server to be the place model output is validated, so that nothing a model writes reaches a device without passing the engine's checks.
8. As the owner, I want a Coach call abandoned by the browser to be cancelled on the server, so that I never pay for an answer nobody receives.
9. As the owner, I want the model routes to refuse requests from other origins and throttle one address, so that a script cannot run up my bill.
10. As the owner, I want a daily spend cap after which Sessions use the Baseline Plan and the template Summary, so that the worst day costs a known amount.
11. As the owner, I want every model call on Sonnet 5.5 with the server-side refusal fallback, so that a Session costs about a third of what it did and a false safety decline does not end in the Baseline.
12. As the owner, I want the repo, README and ADRs to describe Ollie as an open-source project, with no sponsor or contest framing, so that what a reviewer reads is the project.

### The eval

13. As the owner, I want a committed Pre-registration before every live Eval Run, so that nobody can say I tuned until it looked good.
14. As the owner, I want each run's cost logged against a $300 budget in the Pre-registration, so that I spend on purpose.
15. As the owner, I want the Sonnet 5.5 Arm compared with the stored Opus 5 runs on the same seeds and the same scorer, so that the model switch is a measured decision and the Opus Arm costs nothing to repeat.
16. As the owner, I want per-call latency in every report, with p50 and p95 and not only totals, so that a timeout problem shows up in the eval.
17. As the owner, I want Simulated Learners who learn, under two Simulator Families built on different assumptions, so that the mastery comparison is fair and does not hold only in a world built on the engine's tracer.
18. As the owner, I want the mastery claim framed as non-inferiority within 0.5 Skills, stated in advance, so that the result means something whichever way it lands.
19. As the owner, I want detection to count only a supported Hypothesis that declares the planted Feature as a difficulty, so that the published number is deterministic.
20. As the owner, I want Jev to read the prose and report Declaration Fidelity, calibrated against hand labels with regex and Jev side by side, so that the part that needs a reader is read by a model from outside the Coach's family.
21. As the owner, I want the Feature list to be every Feature the generators know, and false positives reported on the ones that were not planted, so that detection cannot be passed by picking from a menu.
22. As the owner, I want a second person to label every Calibration Set, human-human kappa reported, and half of each set held back, so that "you labelled your own test" has an answer.
23. As the owner, I want the committed JSON reports to stay the record, with LangSmith as the view, so that anyone can check a result without my account and after LangSmith's 14-day retention.

### The engineering

24. As a reviewer, I want the Coach step drawn as a graph with a parity test proving it is the same rule as before, so that I can see LangGraph was used deliberately.
25. As a reviewer, I want the engine's one retry with every reason to stay the engine's rule, and LangGraph's retry used for transport errors only, so that the graph owns no rule.
26. As a developer, I want the fake to drive the graph in tests, with no network, so that the seam stays at `Generation`.
27. As a developer, I want CI to run typecheck, lint, unit tests, the fake eval and the build on every push, so that evals are regression tests.
28. As the owner, I want a manually triggered live smoke eval in CI, gated on a secret, so that I can check the real models on demand without a nightly bill.
29. As the owner, I want each phase to end with its evidence committed, so that each post links to something a reader can check.
30. As the owner, I want Ollie's voice redesigned on Eleven v4 and kept only if it wins a blind A/B, so that "why v4?" has a measured answer.
31. As a developer, I want the voice manifest to record the model and voice of every line, so that changing either marks the old audio stale instead of silently keeping it.

## Implementation Decisions

### Principles that do not move

- **The math stays in the engine.** ADR 0001 stands. No new check lets a model set a number, choose a Problem, or decide an answer.
- **The Plan Space still bounds the Coach.** ADR 0003 stands. The Minimum-Evidence Rule and Claim Agreement are new validator checks, reported as reasons through the existing retry.
- **`Generation` stays the seam.** The graph calls the existing adapters through `coachGraph(generation)`. No LangChain chat model replaces the Anthropic adapter (ADR 0004).
- **ADR 0002 stands, and is amended:**
  - nothing is sent to LangSmith or TypeSafe from any route;
  - tracing and Jev run in `pnpm eval` only.

### Phase 1

- **Timeout, cancellation and no retry on a timeout.**
  - Before the fix, a test with a slow fake reproduces the fault: two calls paid for, then the Baseline.
  - The route passes the request's abort signal into the SDK call.
  - The server has its own deadline, below the browser's. Proposed: 75 s on the server, 90 s in the browser. The Coach is not on screen's critical path.
  - When the deadline is hit, the server returns the Baseline Plan itself and says so.
  - The device does not retry a timed-out call. It treats the timeout like an unreachable Coach.
  - The chosen model's measured p95 Coach latency must sit under the server deadline. That is a Pre-registration threshold.
- **Per-call telemetry.** The recorder keeps each call's wall time and tokens, not only totals. Every report prints p50 and p95 per operation.
- **Server-side validation.**
  - The Coach route runs the Coach step and returns only a checked output, a retried output, or the Baseline Plan, with the rejection reasons.
  - It rebuilds the known Problem IDs from the body (the evidence IDs plus the IDs the Notes already cite).
  - It rebuilds the Plan Space from the Knowledge Estimates, since unlocks depend only on Mastery.
  - The Summary route runs the Summary validator and its template fallback the same way.
  - The device keeps its own check and fallback unchanged (defence in depth, and play works offline).
- **Abuse guard.**
  - A Next 16 `proxy.ts` on `/api/*` refuses cross-origin requests (403) and applies a per-IP token bucket (429). One container, so memory is enough.
  - A daily spend cap of $5 is summed from the telemetry's per-call cost. Past it, the model routes answer as a Coach or Summary that could not be reached, so the device uses the Baseline Plan and the template. It resets at midnight UTC.
  - A Cloudflare rate-limiting rule at the edge is configured by hand and recorded in the deploy guide.
  - No captcha.
- **Models.**
  - The Coach, the Parent Summary, the Story writer and the eval Judge move to Claude Sonnet 5.5 (`claude-sonnet-5-5`).
  - The Coach runs at effort `high`.
  - Every call sends the server-side refusal fallback: `fallbacks: "default"`, with beta `server-side-fallback-2026-07-01`, on the Claude API.
  - The telemetry's price table gains Sonnet 5.5 at $2 input and $10 output per million tokens.
  - The Judge's calibration gate runs unchanged on every run, so a weaker Judge has its scores withheld automatically.
- **The Sonnet comparison.**
  - Pre-registration 1 is committed first.
  - Three live runs on Sonnet 5.5 at the same seeds, scored by the same scorer as the stored Opus 5 reports, which `pnpm eval:rescore` re-scores. The Opus Arm costs nothing.
  - These runs happen before any Phase 3 change to the Coach prompt, or the Arms stop being comparable.
  - They run live, not on the Batch API, because latency is one of the things measured.
- **CI.**
  - A GitHub Actions workflow on every push and pull request: install, typecheck, lint, unit tests, `pnpm eval --fake`, build.
  - A second workflow, triggered by hand only and gated on an `ANTHROPIC_API_KEY` secret, runs one Simulated Learner for three Sessions live. It asserts Evidence Integrity is 1.00 and no Plan came from the Baseline.
- **Cleanup.**
  - Rewrite without sponsor or contest mentions:
    - the README;
    - the third-party notice, and the script that generates it;
    - config comments;
    - ADR 0002's two mentions.
  - Delete the submission material and the research note on the contest's terms.
  - Edit sponsor mentions out of the rest of the research.
  - Fix the README's stale line that says the voice has not been rendered.
  - Git history is not rewritten.
- **Voice.**
  - The manifest records the model ID and voice ID behind each rendered line. `pnpm voice:lines` treats a line as stale when either differs from the configured model and voice.
  - Voice Design runs again with the "cute cartoon voice for a friendly owl" brief, and a new voice is chosen.
  - About 15 lines (Hints, cheers, a few Problems, a Story) are rendered on the old voice with `eleven_v3` and the new voice with `eleven_v4`.
  - The owner rates them on a small blind listening page. The result is committed.
  - If v4 wins:
    - all 1,291 bundled lines are re-rendered, about 53k characters;
    - the voice model and voice ID are updated in local configuration and in Coolify;
    - the server's cached Story audio is cleared.
  - Before rendering, check two things the docs do not yet say:
    - whether Voice Design has a v4 design model;
    - what v4 costs in credits per character.

### Phase 2

- **The Coach graph (ADR 0004).**
  - `coachGraph(generation)` compiles a LangGraph `StateGraph` with these nodes:
    - build input;
    - call the Coach;
    - validate;
    - accept, retry or Baseline.
  - The nodes wrap `coachInput`, `checkCoachOutput` and `baselinePlan` unchanged.
  - The Coach-call node has a timeout at the server deadline, and a `retryPolicy` for transport errors only (429, 529 and network).
  - The engine's one retry, which carries the rejected output and every reason, is a graph edge, not a `retryPolicy`.
  - The route runs the compiled graph.
  - No graph code is imported by the browser.
  - No checkpointer, no interrupt, no `createAgent`, no `ChatAnthropic`.
- **LangSmith, eval only.**
  - `pnpm eval` traces its calls, through LangSmith's Anthropic wrapper or `traceable`, only when `LANGSMITH_TRACING` is set. It is never set in Coolify.
  - Each Eval Run becomes a LangSmith experiment over a dataset of Simulated Learner Sessions. The existing scorers are wrapped as custom code evaluators.
  - Stored reports can be replayed into experiments at no model cost. The Phase 1 Opus and Sonnet Arms become a comparative experiment.
  - The committed JSON reports stay the record. LangSmith is on the free Developer plan (one seat, 5,000 traces a month, 14-day retention).
- **Labelling.**
  - A small labelling page shows each item with its evidence and saves labels to a JSON file committed to the repo. It is a local page or a private artifact. It covers:
    - the 20 Stories;
    - the 10 Summaries;
    - about 100 Hypothesis claims drawn from the three live Opus reports.
  - A second person labels every set on it.
  - The owner may label through a LangSmith annotation queue.
  - Half of each set is sealed at random before any tuning. It is scored only in the final run.
  - Human-human agreement and kappa are reported beside the Judge's.

### Phase 3

- **Features and the tally.**
  - The engine publishes the Feature list: every property its generators know. Examples:
    - a sum or difference that crosses ten;
    - the larger addend first;
    - doubles;
    - a teen whole;
    - the change unknown;
    - the review position.
  - The list is fixed in Pre-registration 2.
  - The engine computes, from the Profile's history, the first attempts and first-try rate per Skill and Feature across every Session.
  - The tally is added to the Coach's input and is the only input to the Minimum-Evidence Rule.
- **Declared Hypotheses (ADR 0005).**
  - The Hypothesis schema gains a required Skill and Polarity, and an optional Feature from the list.
  - The Notes validator rejects a Hypothesis in either case:
    - the Assistance States of its citations disagree with its Polarity. A contrast must cite both first-try and assisted Problems.
    - it is marked supported but names no Feature, or fails the Minimum-Evidence Rule. The rule is at least 4 first attempts on the Feature, and a 95% Wilson interval on its first-try rate that does not overlap the interval for the rest of the Skill.
  - The Coach prompt says so.
  - Ollie's Notebook is unchanged except that it can show the Feature.
- **Simulator Families.**
  - Family 1 is a BKT forward model. A hidden known or unknown state per Skill learns with probability p(T) after each practice opportunity and answers through guess and slip. Its parameters are drawn from a different distribution than the engine's hand-set tracer.
  - Family 2 is a Performance Factors Analysis logistic model, in which every prior success and failure on a Skill moves the log-odds of the next answer.
  - The planted weaknesses and fatigue apply on top of both.
  - The six Learners, their seeds and the held-out split are kept.
  - Every learning result is reported under both families.
- **The claims the final runs test.**
  - Primary (diagnosis):
    - detection of the planted weaknesses, read from declarations;
    - false positives on every Feature not planted;
    - Sessions to detection.
  - Secondary (mastery): mean Skills Mastered by Session 20, Coach against Baseline. The Coach passes if it is not more than 0.5 Skills behind under each family.
  - The numbers, with Wilson intervals and paired differences across repetitions, go in Pre-registration 2 before the runs.
- **Jev in the eval.**
  - A Jev Choice reads each claim's Polarity. A Jev Noul per Feature reads whether the claim names it as a difficulty.
  - These are compared with the declarations to give Declaration Fidelity.
  - They are also run over the Opus-era reports, which have no declarations, as the prose reader.
  - Calibrated on the labelled claims under the Judge's gate (agreement at least 0.8 and kappa at least 0.6), on the sealed half.
  - Regex and Jev agreement are reported side by side.
  - Needs `TYPESAFE_API_KEY`. The eval without it reports "withheld".
- **Final runs.** Pre-registration 2 is committed, then the final live runs: Sonnet 5.5, both Simulator Families, three repetitions, on the Batch API where latency is not measured. Results go against every threshold, pass or fail.

## Testing Decisions

- A good test checks behaviour through a module's public interface: the Coach step, the routes, the graph, the validators, the scorers. It never checks private helpers or LangGraph internals.
- **Reproduce first.** The timeout fault has a failing test before its fix. It uses a slow fake Coach and asserts the number of calls, the source of the Plan, and that the server call was aborted.
- **Parity.** `src/coach/coach.test.ts`'s cases run against both `coachSession` and the compiled graph, asserting the same Coach step for the same inputs. This covers:
  - accepted;
  - retried with reasons;
  - Baseline after two rejections;
  - Baseline at once when unreachable;
  - Baseline on a timeout.
- **The routes** are tested as the existing `src/app/api/*/route.test.ts` files do: body in, response out. The new cases:
  - a rejected output never leaves the route;
  - over the spend cap, the route answers "unavailable";
  - cross-origin requests get 403;
  - a burst gets 429.
- **The validators** get table tests for each new reason:
  - Polarity against Assistance States;
  - a contrast with one kind of citation;
  - supported with no Feature;
  - too few first attempts;
  - overlapping intervals;
  - every reason reported together, so one retry can fix them all.
- **Simulator Families** are tested for their definition:
  - the same seed reproduces a run byte for byte;
  - a BKT Learner's accuracy on a Skill rises with practice;
  - a PFA Learner's log-odds move with each outcome;
  - a planted weakness lowers accuracy only on matching Problems.
- **Scorers** keep their existing tests. Detection gains tests on declarations. The Jev reader is tested behind a fake with fixed judgments; the real one is exercised only by the eval.
- **The fake eval** (`pnpm eval --fake`) runs in CI on every push, and every seam it crosses must work in it.
- **Browser tests** keep passing in Chromium and the nine WebKit iPad projects. `e2e/coach.spec.ts` gains the case where the route returns the Baseline on its own deadline.
- **Prior art:**
  - `src/coach/coach.test.ts` and `src/generation/fake.ts` for the Coach step;
  - `src/app/api/story/route.test.ts` for a route;
  - `src/evals/*.test.ts` for scorers;
  - `src/loop/bkt.test.ts` for knowledge tracing;
  - `src/evals/learners.test.ts` for Simulated Learners.

## Out of Scope

- A tool-calling Coach, or any Coach Arm other than Sonnet 5.5 at high effort. No effort sweep.
- Production tracing of any kind, redacted or not. Online evaluation.
- Jev, or any model, checking claims at run time in the live app.
- Accounts, a database, or server-side storage of Session evidence. A checkpointer.
- A captcha or an invite key on the model routes.
- The rest of Grade 1, the mobile app, and paid plans.
- Rewriting git history to remove the old contest material.
- Eleven v4 Turbo.

## Further Notes

- **Budget.** $300 of Anthropic spend in all, logged run by run in the Pre-registrations. Phase 1's comparison is three Sonnet runs, estimated at about $10 to $12 each. Phase 3's final runs cover two families and three repetitions, on the Batch API. Jev and ElevenLabs costs are separate; neither vendor's price was on the pages read.
- **Content.** Each phase ends with an evidence ticket. The post that goes with it is the owner's.
- **Unverified at the time of writing.** These are all checked in the ticket that depends on them:
  - Sonnet 5.5's latency on the Coach prompt;
  - whether Voice Design has a v4 model;
  - Eleven v4 and Jev pricing;
  - the full `noul` and `score` signatures in `@typesafe-ai/sdk`;
  - how a LangGraph node timeout surfaces (a throw, or an error handler).
