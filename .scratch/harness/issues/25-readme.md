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

