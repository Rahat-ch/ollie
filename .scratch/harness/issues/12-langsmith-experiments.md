# 12: The eval's runs are LangSmith experiments

**Read first:** `CONTEXT.md` (capitalised terms are defined there); `.scratch/harness/spec.md`, Implementation Decisions › Phase 2 › LangSmith, eval only; `.scratch/harness/decisions.md` #21, 27; ADR 0002 (last consequence); research §2 and §3; `docs/research/langchain-harness.md` for background. Follow `AGENTS.md`. Deliver as one PR into `main`, merged before the next ticket starts. Never mention the former sponsor or the contest in anything you write.

**What to build:** Tracing turns on only when `pnpm eval` sets it. It is never set in production, and no route sends anything to LangSmith, as ADR 0002 records.

Each Eval Run becomes a LangSmith experiment over a dataset of Simulated Learner Sessions. The existing scorers are wrapped as custom evaluators: Evidence Integrity, Claim Agreement, Plan sources, convergence, and Story and Summary validity.

A replay target turns stored reports into experiments at no model cost. The Phase 1 Opus and Sonnet Arms become a comparative experiment.

The committed JSON reports stay the record. LangSmith is the view, on the free Developer plan.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] With no LangSmith key the eval runs exactly as before; with it, an experiment appears per run
- [ ] The three Opus and three Sonnet reports replay into a comparative experiment with no model calls
- [ ] A test proves no route imports the tracing client
- [ ] The evals methods doc explains which is the record and which is the view
