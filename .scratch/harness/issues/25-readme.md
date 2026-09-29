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

**Status:** ready-for-agent

- [ ] The README is at most about 150 lines and has the sections above, in that order
- [ ] Every number in it links to the committed report or file it comes from, and matches it
- [ ] No stale model name, no LangChain, no Opus-era headline presented as current
- [ ] The moved detail is in `docs/`, and every link in the README and those docs resolves
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` pass
