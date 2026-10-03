# Ollie demo: prep and sources

The script to read is `teleprompter.txt`. Everything you need ready before filming, and where every number comes from, is here.

## Before recording

- [ ] **Network.** Wi-Fi off, Ethernet only (`networksetup -getairportpower en1` should say Off).
- [ ] **Coolify.** `ELEVENLABS_MODEL_ID=eleven_v4` is set, so live Stories sound like the rest of Ollie. `LANGSMITH_TRACING` is not set.
- [ ] **Prepped profile.** On ollie.rahatcodes.com, in one browser profile, play 3–4 Sessions a few minutes apart. Nickname "Sam". Miss a couple of crossing-ten Problems on purpose (8 + 5, 9 + 4), so the Notebook has a crossing-ten belief with its Problems. Note what the Notebook actually says before you film.
- [ ] **Git history shot.** `git log --oneline -- docs/evals/preregistration-1.md` shows `eac6b9b Pre-registration 1: approved` *before* `f2a6a17`, the three live Sonnet runs. Or show both commits on GitHub with their timestamps (sign-off 18:56:43Z; first run 19:10:40Z).
- [ ] **Hand labels shot.** `docs/evals/labels/stories.owner.json`, briefly, for "I hand-labelled twenty stories".
- [ ] **Title cards.** Five cards: 1. Check what code can check; 2. Test data with known answers; 3. Grade the grader; 4. Write down pass before you run; 5. When an eval fails, investigate it.
- [ ] **Terminal.** In the repo, with a big font.
- [ ] **Tabs open:** the README Results table; `docs/evals/preregistration-1.md`, scrolled to "Correction, 2026-09-30"; and `docs/evals/latency-probe-v2-2026-09-30T03-41-22-564Z.json`.
- [ ] **Kernel-log screenshot.** Open `docs/evals/latency-kernel-log-2026-09-29.txt` (see the bottom of this file).

## Sources for every number you'll say

| Line | Source |
|---|---|
| About four times cheaper ($0.2083–0.2148 to $0.0499–0.0541 per session) | README Results, row 7; `preregistration-1.md` |
| Zero invented problems in about 35,000 citations (35,189) | `preregistration-1.md` Results, row 1 |
| Found it 6 out of 6; Opus 4 | Row 4a |
| Four failed rows (false positives, mastery on one run, latency, story readability) | Rows 4b/4c, 5, 6, 9c |
| Six fake kids, twenty sessions each, a baseline, two held out | `docs/evals/README.md`; `src/evals/learners.ts` |
| Twenty stories and ten summaries hand-labelled; grader must agree at least 80% and beat chance (kappa at least 0.6) | `src/evals/calibration.ts`, `docs/evals/labels/`; `JUDGE_AGREEMENT_THRESHOLD`, `JUDGE_KAPPA_FLOOR` |
| Lines committed before the runs | commit eac6b9b (18:56:43Z) before the first Sonnet report (19:10:40Z) |
| Average call about 71 s to about 30 s | Six reports, `telemetry.byOperation.coach` (69.9–73.3 s to 29.0–31.4 s) |
| Slow end about 92 s against a 30 s line | Row 6 (p95 92.2–94.0 s) |
| About 1 call in 12, about 70 s longer | Correction; 29 of 365 eval calls plus 1 probe call |
| Request went out 70 s later; API answered in 35 s | Correction (probe v1, call 14: 70.5 s gap, 35.8 s answer) |
| Thirty slow calls, thirty dropped connections | Correction (kernel log) |
| Forty calls, zero stalls, slow end about 35 s | `latency-probe-v2-2026-09-30T03-41-22-564Z.json` (p95 34.9 s) |
| New model's stories score higher under the same grader | `rejudge-2026-09-29T21-50-24Z.txt` (0.500–0.567 against 0.276–0.414) |

**The kernel-log screenshot.** `docs/evals/latency-kernel-log-2026-09-29.txt` is the saved extract; macOS has already rolled the live log over. Show three lines:
- **14:41:14:** the probe's `node:80745` opens a connection.
- **14:46:33.727:** that connection is dropped, `tcp_drop`, `Duration: 319.468 sec`, `so_error: 60`.
- **14:46:34.233:** a new connection opens, 0.5 s later. That's the retry.
