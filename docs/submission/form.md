# The submission form, field by field

Nerdy AI Hackathon, Prompt 01 (Math). Submissions close **Friday 2026-09-18, 11:59 PM CDT**. The requirements, from `docs/research/k5-math-game/05-nerdy-hackathon-alignment.md`: a working product, a written description of what it does, how it was built, and next steps, a 2 to 3 minute demo video, disclosure of third-party materials and AI usage, and optionally source and a live deployment.

Paste each block below into the matching field. Field names on the form may differ slightly; match by meaning.

---

## Title

```
Ollie — a Grade 1 math game that learns how you learn
```

## One-line description / tagline

```
Most math apps adapt difficulty. Ollie adapts to how the learner is learning: a voiced owl reads every Problem aloud, a deterministic engine owns the math, and an AI Coach forms evidence-backed Hypotheses after every Session and shows the Parent its working.
```

## Prompt

```
Prompt 01 — Math
```

## Live deployment

```
https://ollie.rahatcodes.com
```

## Source code

```
https://github.com/Rahat-ch/ollie
```

Check the repository is public, or that the judges have access, before submitting.

## Demo video

```
<paste the video link here — YouTube, Loom, Drive, or Vimeo, set to anyone-with-the-link>
```

2:50 or under, screen-recorded, the entrant as the Learner, no other identifiable person. See `docs/submission/video-plan.md`.

## Project description (what it does, how it was built, next steps)

Paste the whole of **`docs/submission/write-up.md`** here, as plain text. If the field takes Markdown, paste it as it is. If it does not, three things need attention when the formatting is stripped:

- the architecture image line (`![...](./architecture.svg)`) — delete it and attach `docs/submission/architecture.svg` (or a PNG of it) as a supporting file instead, if the form allows one;
- the two links in the first line — write them out as bare URLs;
- the eval report links — write them out as `docs/evals/2026-09-18T18-12-41Z.json`, `docs/evals/2026-09-18T18-41-44Z.json`, `docs/evals/2026-09-18T19-09-56Z.json` and `docs/evals/convergence.svg` in the repository.

If the field has a hard character limit that the write-up exceeds, cut in this order: "Next steps" to one sentence, then the last three eval bullets, then the "How it was built" paragraph on Stories and the Speech Chain. Never cut "What is generative and what is not", the curriculum sentence, or "What has not run live".

## Third-party materials and AI usage disclosure

Paste the whole of **`THIRD_PARTY.md`** here. It is written to be pasted into this field and covers every API, model, font, image, audio source, open-source dependency with its licence, and the generative-AI assistance used.

If the field is too small for the full dependency table (373 packages), paste everything down to the end of "Generative-AI assistance", then this in place of the table:

```
Open-source dependencies: every npm package in the installed tree — 373 packages including devDependencies and optionalDependencies — is listed with its licence in THIRD_PARTY.md in the repository (https://github.com/Rahat-ch/ollie/blob/main/THIRD_PARTY.md). Licence counts: MIT 319, Apache-2.0 22, ISC 14, BSD-2-Clause 7, MPL-2.0 3, BSD-3-Clause 2, 0BSD 1, BlueOak-1.0.0 1, CC-BY-4.0 1, CC0-1.0 1, Python-2.0 1, Unlicense 1. No GPL, LGPL, AGPL, or SSPL code or assets are present, as the terms require; the three MPL-2.0 packages are unmodified build-time and lint-time tools, recorded as reviewed exceptions and not bundled into shipped code. `pnpm licenses:check` enforces this and exits non-zero otherwise.
```

Re-run `node scripts/third-party.mjs --write` and `pnpm licenses:check` before submitting if anything in the dependency tree has changed since 2026-09-13, and update the counts above from the output.

## Anything else / notes to the judges (if the form offers a field)

```
Two things the write-up says and I would rather say twice. First, the arithmetic is never the model's: the engine owns every Problem's type, numbers, answer, and Hint, and every piece of model output — a Story, a Hypothesis, a Session Plan, a Parent Summary — passes a deterministic validator before anyone sees it. Second, the eval numbers are three live runs of the real models (Opus 5 Coach, Judge and Parent Summary writer, Sonnet 5 Story writer) on identical seeds, on 2026-09-18, and every headline is quoted as the range across those three runs rather than as the best of them — because on six hand-designed Simulated Learners with one planted weakness per split, a single run is one draw. Where the Coach's judgement is what is being scored the spread is wide (each planted weakness was named in 2 of the 3 runs; false positives ran 4 of 39, 7 of 44 and 10 of 45), and the write-up says so, including that the Coach is not faster to Mastery than the fixed Baseline gate. Both facts are stated in the write-up and the README rather than papered over.
```

## Before you press submit

- [ ] The video link plays for a signed-out viewer.
- [ ] The repository link opens for a signed-out viewer (or judges have been granted access).
- [ ] <https://ollie.rahatcodes.com> loads and a Session can be played from a fresh browser.
- [ ] The write-up's eval numbers match the report committed at the time of submitting.
- [ ] The entrant is 18+ and a legal resident of the US, Argentina, Colombia, Costa Rica, or India (terms).
- [ ] Save the confirmation page or email to `docs/submission/` and tick the last box on ticket 16.
