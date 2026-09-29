# 01: Ollie reads as an open-source project

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 1 › Cleanup; `.scratch/harness/decisions.md` #22, 34; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** A reviewer landing on the repo reads about a project, not a contest entry. There are no sponsor or contest mentions left in the tree.
- The README, the domain glossary's intro, the ADRs, the third-party notice and the script that generates it, and every config comment are rewritten neutrally.
- The submission material (write-up, form, slides, script, video plan, the Coach trace used only there) is deleted. So is the research note on the contest's terms.
- The rest of the research keeps its substance with sponsor mentions edited out.
- The README's stale line saying the voice has not been rendered is fixed.
- The README gains a License section pointing at the MIT `LICENSE`.
- Anything the submission material held that still matters moves into the evals methods doc or the README: the claim-to-test evidence map, and the architecture diagram.
Git history is left alone. To find every mention, search tracked files case-insensitively for the former sponsor's name (it is also the checkout's directory name) and the contest word. Expect them in the README, the glossary's intro, ADR 0002, the third-party notice and its generator script, two config comments, `docs/submission/`, `docs/research/`, and every folder under `.scratch/`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A case-insensitive search of tracked files, `.scratch/` included, for the former sponsor's name and the word for the contest returns nothing, apart from the checkout's own directory name. `.scratch/k5-math/` and the older `.scratch/` folders are scrubbed too, because they are public in the repo
- [x] The third-party notice regenerates from its script with no contest wording, and the licence check still passes
- [x] The evidence map and the architecture diagram survive in their new home, with every link resolving
- [x] README has a License section; typecheck, lint, unit tests and build pass

## Comments

**2026-09-28, implementation.** The repo now reads as a free, open-source project. What moved, what was deleted, and what was rewritten:

Moved. The claim-to-test evidence map is `docs/evals/evidence.md` (from the launch folder), its links repointed to the reports beside it and to the ADRs; its first section, which walked through a committed Coach trace, now says how to print one (`pnpm coach --real --sessions 3`) and keeps what the 2026-09-17 run showed. The architecture diagram is `docs/architecture.svg` and is rendered in the README under a new "How it works" section, beside the generative/deterministic split and a short account of the two seams, both taken from the write-up. The write-up's eval results ("What the evals say", the limits paragraph, and the next steps) are a new section of `docs/evals/README.md`, "What the three live runs say", which the README's new Evals section links to by anchor.

Deleted. The rest of the launch folder: the write-up, the form text, the slides, the video script, the video plan, and the Coach trace that only the evidence map used. And the research note on the contest's terms (`docs/research/k5-math-game/05-*.md`). The research index drops its row, and the table now lists report 06, the ElevenLabs terms check, which it never did.

Rewritten. README: the intro, the stale "Still to run with a key" paragraph (all 1,291 lines are rendered and bundled: 125 fixed lines and 1,166 Problem lines in the standard ranges, counted from `src/voice/lines.ts`), the old launch section replaced by Evals, a License section, and the "Where things are" list (every ADR, the `.scratch/` folders, the evidence map, the diagram). THIRD_PARTY.md: the intro, the ElevenLabs licence note, "author" for the old contest word for the builder, and the same stale "not in this commit" line; the generated section was refreshed with `node scripts/third-party.mjs --write` after the reviewed-exceptions sentence in the script was reworded, and only that sentence and the audit date changed. ADR 0002 keeps the COPPA and biometric reasoning and states the consent and no-biometrics rule as the project's own; ADR 0003's "entry" is "project". The two config comments (`next.config.ts`, `pnpm-workspace.yaml`) now cite the project's licence policy, and a comment in `src/evals/judge-anthropic.ts` points at the evals README instead of the deleted write-up. The research index and the ElevenLabs note keep their substance with the sponsor edited out: the voice-input decision is restated from COPPA, report 03 and the nine-day window, and one conclusion that only described the sponsor's tools was cut. `evals-comparison.md` and `pi-evals-comparison.md` point at the evidence map's new path.

The older `.scratch/` folders stay as records, edited: `k5-math` (the spec, the decisions, and tickets 01, 02, 11, 15), `eval-intervals` and `ipad-layout` specs, with the contest's word for the builder now "builder" and the deadline stated as a date. Ticket 16 is renamed `16-launch-package.md`, since nothing linked to its old name; its comments keep the day's record and open with a note saying where its material went.

Checks: the ticket's search over tracked files for the sponsor's name and the contest word returns nothing. A search for the four-letter stem alone matches one line, the `zod` repository URL in the generated dependency table (its author's GitHub handle), which is left as generated. `pnpm licenses:check` passes (373 packages, the three MPL-2.0 reviewed exceptions). Every relative link in the touched Markdown resolves, anchors included. `pnpm typecheck`, `pnpm lint`, `pnpm test` (623) and `pnpm build` pass. No app code or user-visible string changed.
