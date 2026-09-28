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

**Status:** ready-for-agent

- [ ] A case-insensitive search of tracked files, `.scratch/` included, for the former sponsor's name and the word for the contest returns nothing, apart from the checkout's own directory name. `.scratch/k5-math/` and the older `.scratch/` folders are scrubbed too, because they are public in the repo
- [ ] The third-party notice regenerates from its script with no contest wording, and the licence check still passes
- [ ] The evidence map and the architecture diagram survive in their new home, with every link resolving
- [ ] README has a License section; typecheck, lint, unit tests and build pass
