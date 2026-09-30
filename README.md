# Ollie

[![CI](https://github.com/Rahat-ch/ollie/actions/workflows/ci.yml/badge.svg)](https://github.com/Rahat-ch/ollie/actions/workflows/ci.yml) Live at [ollie.rahatcodes.com](https://ollie.rahatcodes.com).

Ollie is a Grade 1 math game that learns how the Learner learns. Ollie the owl reads every Problem aloud, because a Grade 1 Learner may not read yet. A deterministic engine owns the math. After every Session, a Coach (Claude Sonnet 5.5) reads the evidence, writes Hypotheses about the Learner, and plans the next Session. The engine checks everything the Coach writes, and the Parent reads why. The game covers seven Skills in three Units, [aligned to key CCSS 1.OA and 1.NBT concepts](docs/develop.md#curriculum). There are no accounts. The only personal word that leaves the device is the Nickname, so that a Story can be spoken ([what leaves the device](docs/develop.md#what-leaves-the-device)). Free and open source under MIT.

**The AI can personalise the learning path. It cannot make up the math.**

The thesis: make the model declare what's checkable, let deterministic code check it, and run evals that are allowed to say no.

## How it works

![One Session, end to end: Session, engine, evidence, Coach, validator, next Session. The AI can personalise the learning path; it cannot make up the math.](docs/architecture.svg)

- **The engine owns the math.** Every Problem, answer, Hint and Mastery decision is plain code. No model writes or changes one ([ADR 0001](docs/adr/0001-engine-owns-math-model-owns-words.md)).
- **The Coach plans inside the Plan Space.** It gets the Session's evidence and the Learner Notes, never a Problem or an answer. It can only choose from the bounded set of Plans the engine offers ([ADR 0003](docs/adr/0003-coach-plans-within-bounded-space-engine-executes.md)).
- **The engine checks every Hypothesis and Plan.** A Hypothesis that cites a Problem the Coach was not shown is rejected. So is a Plan outside the Plan Space.
- **One retry carries every reason back.** The Coach sees every rejection reason and gets one more try.
- **The Baseline Plan is the fallback, so play never stops.** A second rejection, a missing key or a timeout gives the next Session the Baseline Plan, and Ollie's Notebook tells the Parent.

Generative: the Stories, the Coach's Hypotheses and Plans, the words of the Parent Summary, and Ollie's voice. Deterministic: the arithmetic, the answers, the Hints, every check, Mastery, Powers, Coins and the Streak.

## The evals

`pnpm eval` plays six Simulated Learners for 20 Sessions each, under the Coach and under the Baseline, on the same seeds. It writes a dated JSON report to [docs/evals/](docs/evals/). It measures:

- **Evidence Integrity:** does every Problem a Hypothesis cites exist? This is the fabrication check.
- **Claim Agreement:** do the cited Problems' Assistance States say what the claim says? This is reading, kept apart from fabrication.
- **Detection and false positives:** some Simulated Learners have a planted weakness. Does the Coach find it, and how often does it claim one that is not there?
- **Plan sources:** how many Plans came from the Coach first time, after a retry, or from the Baseline.
- **Sessions to Mastery against the Baseline:** does the Coach reach Mastery as fast as the fixed 8-of-10 gate?
- **Stories and Parent Summaries:** validity is deterministic. The Judge scores readability and faithfulness, but only once it agrees with the hand-labelled Calibration Set on at least 80%, with kappa of at least 0.60. Otherwise the score is withheld.
- **Cost and latency** of every call, from measured tokens and wall time.

The thresholds are pre-registered: committed before the run, with what counts as failing. Results are published whether they pass or fail. Every rate carries a 95% Wilson interval, and two held-out Learners are never used to tune a prompt.

The limits: six hand-designed Simulated Learners who cannot learn from practice, one planted weakness per split, and three runs per Arm.

## Results

[Pre-registration 1](docs/evals/preregistration-1.md) asked one question: is Claude Sonnet 5.5 an acceptable replacement for Opus 5 behind every model call? The comparison Arm is three Opus 5 runs ([1][o1], [2][o2], [3][o3]). The new Arm is three Sonnet 5.5 runs ([1][s1], [2][s2], [3][s3]). Each cell gives the lowest and highest of the three runs.

**Verdicts:**

- **Coach: not acceptable.** Rows 4b, 4c, 5 and 6 fail.
- **Story writer: not acceptable.** Row 9c fails.
- **Parent Summary: acceptable.**
- **Judge: acceptable.** Its gate opened on both Calibration Sets in every run.

| # | Metric | Sonnet 5.5 | Opus 5 | Pass line | Result |
|---|---|---|---|---|---|
| 1 | Evidence Integrity, every split | [1.0000][pr]; 0 invented IDs in [35,189][pr] | [1.0000][pr]; 1 in [95,922][pr] | ≥ 0.999 | **PASS** |
| 2 | Claim Agreement, tuning / held out | [0.956][s3] to [0.985][s1] / [0.930][s2] to [0.996][s1] | [0.923][o1] to [0.940][o3] / [0.931][o1] to [0.951][o3] | ≥ 0.893 / ≥ 0.900 | **PASS** |
| 3a | Coach Plans accepted first time | [355 of 360][pr] | [358 of 360][pr] | ≥ 342 | **PASS** |
| 3b | Baseline fallbacks | [0 of 360][pr] | [0 of 360][pr] | ≤ 3 | **PASS** |
| 4a | Planted weaknesses detected | [6 of 6][pr] | [4 of 6][pr] | ≥ 3 of 6 | **PASS** |
| 4b | False positives, tuning | [0.333][s3] to [0.500][s2] | [0.103][o1] to [0.222][o3] | ≤ 0.222 | **FAIL** |
| 4c | False positives, held out | [0.143][s3] to [0.300][s1] | [0.000][o2] to [0.100][o1] | ≤ 0.100 | **FAIL** |
| 5 | Skills Mastered by Session 20, tuning / held out | [5.00][s2] to [5.50][s1] / [5.50][s1] to [6.00][s3] | [5.75][o1] to [6.50][o3] / [5.00][o3] to [5.50][o1] | ≥ 5.25 / ≥ 4.50 | **FAIL** |
| 6 | p95 Coach latency | [92.2 s][s3] to [94.0 s][s2] | not recorded; mean [69.9 s][o2] to [73.3 s][o1] | < 30 s | **FAIL** |
| 7 | Cost per Session | [$0.0499][s2] to [$0.0541][s3] | [$0.2083][o3] to [$0.2148][o1] | < $0.2083 | **PASS** |
| 8a | Summaries valid first time | [6 of 6][pr], every run | [6 of 6][pr], every run | ≥ 5 of 6 | **PASS** |
| 8b | Summary template fallbacks | [0][pr], every run | [0][pr], every run | 0 | **PASS** |
| 8c | Summary faithfulness (Judge) | [5 of 6][s1] to [6 of 6][s2] | [6 of 6][pr], every run | ≥ 5 of 6 | **PASS** |
| 9a | Stories valid first time | [30 of 30][pr], every run | [26 to 28 of 30][pr] | ≥ 24 | **PASS** |
| 9b | Stories valid within three tries | [30 of 30][pr], every run | [29 to 30 of 30][pr] | ≥ 28 | **PASS** |
| 9c | Story readability (Judge) | [0.467][s1] to [0.533][s3] | [0.655][o3] to [0.724][o2] | ≥ 0.55 | **FAIL** |
| 10 | Judge gate, Stories / Summaries | [17 of 20, kappa 0.71][pr] / [10 of 10, kappa 1.00][pr], every run | [20 of 20][pr] / [9 to 10 of 10][pr] | ≥ 0.80 and kappa ≥ 0.60 | **PASS** |

Row 5 fails on one run's tuning split. The held-out split passes, and the Baseline mastered [6.00][s1] on both. `node scripts/preregistration-1-results.mjs` re-derives every value from the six reports; it calls no model and writes nothing.

**Latency (row 6): faster than Opus 5, and still a FAIL.** The mean Coach call dropped from about 71 s on Opus 5 ([69.9 s][o2] to [73.3 s][o1]) to about 30 s on Sonnet 5.5 ([29.0 s][s3] to [31.4 s][s1]), and cost per Session fell by about 75%. The eval's p95 of [92.2 to 94.0 s][pr] was inflated by a network fault on the eval machine: dead IPv6 connections, detected by TCP keep-alive at 70 s and then retried. It was found by probing every attempt, failed ones included, and reading the kernel log ([the correction][fu]). After the fix, [40 calls][v2] ran with 0 stalls and a p95 of [34.9 s][v2], so row 6 still fails as pre-registered: Coach calls lengthen as the Learner Notes grow.

- **False positives (4b, 4c):** Sonnet 5.5 supported [about half as many Hypotheses][pr] as Opus 5, with a similar count of false ones, so the rate rose.
- **Story readability (9c), exploratory re-judge:** the Sonnet 5.5 Judge had been marking the intended `{{nickname}}` placeholder as a defect. Told about it in its prompt, it cites the placeholder in [0 of 99][rj] fails. Under that same Judge, Sonnet 5.5's Stories score [0.500 to 0.567][rj] and Sonnet 5's score [0.276 to 0.414][rj]. So 9c's drop is a stricter Judge, not a worse writer. This was done after the fact, and 9c's FAIL stands ([details][fu]).

Sonnet 5.5 is still the model behind every call (decision 38 in [decisions.md](.scratch/harness/decisions.md)). It is cheaper and faster on average, and its Coach failures are over-eager claims and a p95 still over the line. The follow-up work is in [.scratch/harness/issues/](.scratch/harness/issues/): the Minimum-Evidence Rule ([ADR 0005](docs/adr/0005-supported-hypotheses-need-engine-evidence.md)) for over-eager claims, and Pre-registration 2 to re-test.

**The hardening, measured:**

- **Cost per Session:** Opus 5 [$0.2083][o3] to [$0.2148][o1], Sonnet 5.5 [$0.0499][s2] to [$0.0541][s3].
- **Abuse guard, on the live site:** a cross-origin POST got [403][t05]. A burst got 429 from the app's own bucket ([69 of 120][t05]) and from the Cloudflare edge rule ([57 of 120][t05]). The commands are in [docs/deploy.md](docs/deploy.md#checking-the-guard-from-outside).
- **Ollie's voice:** the new voice on `eleven_v4` won the blind A/B [15 to 0][ab] against the old one on `eleven_v3`.
- **CI:** the badge at the top. Every push runs typecheck, lint, unit tests, `pnpm eval --fake`, the build and the Docker image.

[pr]: docs/evals/preregistration-1.md#results
[fu]: docs/evals/preregistration-1.md#findings-outside-the-pre-registered-lines
[v2]: docs/evals/latency-probe-v2-2026-09-30T03-41-22-564Z.json
[rj]: docs/evals/rejudge-2026-09-29T21-50-24Z.txt
[t05]: .scratch/harness/issues/05-abuse-guard.md
[ab]: docs/voice/ab-tally.json
[s1]: docs/evals/2026-09-29T19-10-40Z.json
[s2]: docs/evals/2026-09-29T19-24-39Z.json
[s3]: docs/evals/2026-09-29T19-37-11Z.json
[o1]: docs/evals/2026-09-18T18-12-41Z.json
[o2]: docs/evals/2026-09-18T18-41-44Z.json
[o3]: docs/evals/2026-09-18T19-09-56Z.json

## Run it

Node 24 and pnpm 10 (`corepack enable` picks up the pinned version).

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # unit tests
pnpm eval --fake    # the whole eval on the fake Generation: no key, no network
```

With no `ANTHROPIC_API_KEY` the app still plays: the Coach falls back to the Baseline Plan and the Parent Summary to its template. Every command, flag and key is in [docs/develop.md](docs/develop.md).

## Docs

- [docs/evals/README.md](docs/evals/README.md): how the evals work and what each number is made of.
- [docs/evals/preregistration-1.md](docs/evals/preregistration-1.md): the pre-registered lines, the full results and the findings.
- [docs/evals/evidence.md](docs/evals/evidence.md): every claim about the loop, the test that enforces it and the command that shows it.
- [docs/adr/](docs/adr/): the architectural decisions.
- [CONTEXT.md](CONTEXT.md): the glossary. Its terms are used as defined in code, tests and docs.
- [docs/develop.md](docs/develop.md): commands, flags, keys, what leaves the device, and where things are.
- [docs/voice.md](docs/voice.md): Ollie's voice, the blind A/B, and the Speech Chain.
- [docs/powers.md](docs/powers.md): Ollie's Powers.
- [docs/deploy.md](docs/deploy.md): Docker via Coolify on Hetzner, behind Cloudflare.
- [THIRD_PARTY.md](THIRD_PARTY.md): every dependency, model and asset, with its licence.

## License

The code is MIT-licensed, © 2026 Rahat Chowdhury; see [LICENSE](LICENSE). Third-party components, fonts, models and the generative-AI assistance used are listed with their licences in [THIRD_PARTY.md](THIRD_PARTY.md).
