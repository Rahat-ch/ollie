# 12: Coach in the app, Parent Summary, and Ollie's Notebook

**What to build:** After a Session in the browser, the Coach runs through an API route, the Learner Notes and next Session Plan are stored with the Profile, and the next tap on Play builds that Session. The Parent opens the Parent Area and reads the Parent Summary written by Opus 5 from the Session Log and Notes: strategies practiced and Powers earned, evidence by Assistance State, what was Mastered, one bedtime activity, and never a claim about the Learner's thinking. Ollie's Notebook shows each Hypothesis as prose with its evidence as tappable Problems, what changed, and what is being tested next. The last seven Summaries are listed. Summary faithfulness joins the eval command with a Calibration Set of 10 Summaries.

**Blocked by:** 06 Coach in the Loop, 09 Onboarding and Parent Area

**Status:** ready-for-agent

- [ ] Completing a Session triggers exactly one Coach run; if it fails, the next Session uses the Baseline Plan and the Notebook says so
- [ ] Play always builds the next Session from the stored Plan, and the Session's Problems match the Plan's mix and ranges
- [ ] Every Hypothesis in the Notebook shows its evidence as the actual Problems, tappable to see the numbers and Assistance State
- [ ] The Summary distinguishes first-try correct, Hint-assisted, and Revealed, and contains no claim about thinking
- [ ] The eval report includes Summary faithfulness with the Judge gated by the Calibration Set
- [ ] The last seven Summaries are shown newest first and survive reload
