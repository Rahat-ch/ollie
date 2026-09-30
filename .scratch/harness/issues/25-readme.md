# 25: The README is rewritten for a reader arriving from the demo

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/decisions.md` #2, 25, 41, 42; the current `README.md`; `docs/evals/README.md`, `docs/evals/preregistration-1.md` (the Results), `docs/evals/evidence.md`; `docs/adr/`. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Today's README is about 5,300 words, mostly long paragraphs. Some of it is stale: it says the Judge is Opus 5, it still has "what has and has not run live", and it quotes Opus-era headlines. Most of it is implementation detail: voice caching, Power animations, every CLI flag. A reviewer arriving from the demo video cannot find the eval story in it.

Rewrite it to about 120 lines, in plain, short sentences:
- **Ollie:** the CI badge, the live link, a one-paragraph pitch, and the tagline "The AI can personalise the learning path. It cannot make up the math."
- **How it works:** the diagram (`docs/architecture.svg`), then about five bullets:
  - the engine owns the math;
  - the Coach plans inside the Plan Space;
  - the engine checks every Hypothesis and Plan;
  - one retry carries every reason back;
  - the Baseline Plan is the fallback, so play never stops.
  Then one line on what is generative and what is deterministic.
- **The evals:** what is measured and why: Evidence Integrity, Claim Agreement, detection and false positives, Plan sources, Sessions to Mastery against the Baseline, the Judge and its calibration gate, cost and latency. Say that the thresholds are pre-registered and results are published pass or fail.
- **Results:** Pre-registration 1 as a compact table of Sonnet 5.5 against Opus 5, with every row's pass or fail. The failures are listed as prominently as the passes, and each number links to the report or file it comes from. Leave a clearly marked place for ticket 10's before/after latency row and ticket 23's exploratory re-judge. Don't invent numbers for them.
- **Run it:** install, `pnpm dev`, `pnpm test`, `pnpm eval --fake`, about eight lines. Link to the full command list.
- **Docs:** links to the evals methods and results, the evidence map, the ADRs, `CONTEXT.md`, the voice doc, the develop doc and the deploy guide.
- **License.**

Nothing is lost. Detail that leaves the README moves, edited down where it rambles, to:
- `docs/develop.md`: every command and flag, what leaves the device, environment and keys, and the file tour ("Where things are");
- `docs/voice.md`: Ollie's voice, rendering, the A/B, the Speech Chain;
- `docs/powers.md`, or a section of `docs/develop.md`: Ollie's Powers.
Update any links and tests that point at README sections (e.g. `grep -rn "README" src e2e scripts`), and any test that reads the README.

**Blocked by:** 24 (it edits the README)

**Scope (2026-09-29, decision 44):** this ticket now also covers ticket 10's evidence: the Results section is the Phase 1 evidence (cost per Session, the abuse guard's live 403 and 429, the voice A/B, the CI badge), ticket 23's re-judge is written in, and ticket 22's placeholder is replaced by the latency story as found and diagnosed.

**Status:** resolved

- [x] The README is at most about 150 lines and has the sections above, in that order
- [x] Every number in it links to the committed report or file it comes from, and matches it
- [x] No stale model name, no LangChain, no Opus-era headline presented as current
- [x] The moved detail is in `docs/`, and every link in the README and those docs resolves
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` pass

## Comments

**2026-09-29, implementation.**
- **README:** 122 lines, about 1,600 words, down from about 5,000. Sections, in order: Ollie (badge, live link, pitch, tagline, thesis), How it works (the diagram and five bullets, then the generative and deterministic line), The evals, Results, Run it, Docs, License.
- **Results:** the per-role verdicts first, then one row per pre-registered row (1 to 10), each **PASS** or **FAIL** in the same bold. Each run-specific value links to its report; pooled or every-run values link to the Results section of `docs/evals/preregistration-1.md`. Every value was checked against `node scripts/preregistration-1-results.mjs` and, for the Opus Arm's per-run values, against the three Opus reports. One sentence says Sonnet 5.5 stays (decision 38) and points at the follow-up work. Two marked placeholders (an HTML comment and a "pending" line) wait for ticket 22's latency before and after and ticket 23's exploratory re-judge, for ticket 10 to fill in.
- **Moved:** the Develop section, every CLI flag, playing locally, what leaves the device, environment and keys, the curriculum table and "Where things are" to `docs/develop.md`; "Ollie's voice" to `docs/voice.md`; "Ollie's Powers" to `docs/powers.md`. Each is short sections and bullets. The Deploy section is the deploy link in Docs, and `scripts/deploy-wizard.sh` is in `docs/develop.md`.
- **Brought up to date while moving:** `pnpm eval` runs every call on Sonnet 5.5 (the old text said Opus 5 and Sonnet 5); `/api/story` writes on Sonnet 5.5; the voice section names the current voice's A/B win (decision 37); the file tour gains `src/cli/`, `src/lib/`, `src/proxy.ts`, `src/design/` and `e2e/`; the command list gains `eval:rescore`, `label`, `voice:ab`, `brand:images` and the two scripts outside `package.json`. "What has and has not run live" is gone; its lasting facts (the Content Pool's 2,790 keys and 5,520 Stories, the rendered lines) are in `docs/develop.md` and `docs/voice.md`.
- **Decided here:** the curriculum table moved to `docs/develop.md#curriculum`, and the README's pitch keeps the precise claim with a link to it. The README carries the thesis (decision 2) under the tagline. The "How it works" check bullet names only the checks the engine makes today; the Minimum-Evidence Rule (ADR 0005) is named as follow-up work, not as built.
- **Other docs:** `docs/evals/README.md` no longer says the Summary Judge is Opus 5. Nothing in `src`, `e2e`, `scripts` or `.github` pointed at a README section, and no test read the README.
- **Test:** `src/docs-links.test.ts` checks that every relative link, and every `#heading` into a Markdown file, in the README, the three new docs, `docs/deploy.md` and the three evals docs resolves.
- **Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm test` (796) and `pnpm build`.


**2026-09-29, scope change (decision 44).** The owner cut the plan to reach the demo faster, and this ticket took on ticket 10's evidence.
- **Merged main** (04849fa: tickets 23 and 24, and the re-judge of #75). The one conflict, in `docs/evals/README.md`, took main's text plus this ticket's Summary-Judge fix.
- **Ticket 23's placeholder is now content:** a short note under 9c. Told about the placeholder, the Judge cites it in 0 of 99 fails. Under the same Sonnet 5.5 Judge, Sonnet 5.5's Stories score 0.500 to 0.567 and Sonnet 5's 0.276 to 0.414, so 9c's drop is a stricter Judge, not the writer. It is exploratory, and the FAIL stands. The numbers link to `docs/evals/rejudge-2026-09-29T21-50-24Z.txt`.
- **Ticket 22's placeholder is gone.** The latency story leads with the comparison: the mean Coach call dropped from 69.9 to 73.3 s (Opus 5) to 29.0 to 31.4 s (Sonnet 5.5), from `telemetry.byOperation.coach` in each report, and cost per Session fell by about 75%. Then the FAIL: 7 to 11 calls a run stall for about 70 s, so p95 is 92.2 to 94.0 s against the 30 s line; without them it is 36 to 42 s. The probe and the pre-registration's findings are linked, and the fix (ticket 22) is designed, not built. No Opus p95 or median is given, because none was recorded. `docs/evals/README.md` gets the same framing, and its "cause is not established" sentence now gives the probe's finding.
- **Ticket 10 folded in:** "The hardening, measured" lists cost per Session on both Arms, the abuse guard's live 403 and 429 (from ticket 05's live capture, with the commands in `docs/deploy.md`), the voice A/B's 15 to 0 (`docs/voice/ab-tally.json`), and the CI badge. Every number links to its file.
- **Plan files:** decision 44 added; ticket 22 is needs-triage with the hidden-thinking finding in its Comments; ticket 10 is wontfix.
- **README:** 129 lines.

**2026-09-30, latency correction (decision 43).**
- **Merged main** (9e8b61e, PR #77). Main's decision 43 comes first, and this ticket's decision is 44. Decision 44's latency bullet now points at 43 instead of repeating the API-side claim.
- **README:** the latency paragraph leads with the comparison (mean Coach call about 71 s on Opus 5 to about 30 s on Sonnet 5.5, cost down about 75%). It then says the eval's p95 of 92.2 to 94.0 s was inflated by a network fault on the eval machine (dead IPv6 connections, detected by TCP keep-alive at 70 s, then retried). The fault was found by probing every attempt, failed ones included, and reading the kernel log. After the fix, 40 calls ran with 0 stalls and a p95 of 34.9 s, so row 6 still fails as pre-registered. The paragraph links the correction and `latency-probe-v2-2026-09-30T03-41-22-564Z.json`. The "diagnosed but not fixed" bullet and every pointer to ticket 22 as the fix are gone.
- **`docs/evals/README.md`:** the same correction replaces "slow generation on the API side".
- **Ticket 22:** one Comment line says its premise no longer holds.
- **README:** 127 lines.
