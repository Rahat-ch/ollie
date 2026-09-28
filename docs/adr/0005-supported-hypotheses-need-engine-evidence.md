---
status: accepted
date: 2026-09-28
---

# A Hypothesis is supported only when the engine's evidence says so

Every Hypothesis declares:
- a Skill;
- a Polarity (difficulty, strength, or contrast);
- optionally, a Feature from the list the engine publishes.

The engine checks that the Assistance States of the cited Problems agree with the declared Polarity.

A Hypothesis may be marked supported only when:
- it names a Feature, and
- it passes the Minimum-Evidence Rule. On the Learner's full history, the Feature needs at least 4 first attempts. Its 95% Wilson interval for first-try rate must also not overlap the interval for the rest of the Skill.

Otherwise the output is rejected, and the rejection reason goes back to the Coach through the existing retry. A proposed Hypothesis may be free prose.

We chose this because two numbers were measured but never enforced:
- **Claim Agreement** was 92 to 95 percent. So a Parent could read "struggles with X" backed by first-try-correct Problems.
- **False positives** were 10 to 22 percent of supported Hypotheses on the tuning split.

The model's own confidence is a number it writes, not a number anyone can check. The engine already knows every Feature of every Problem it generated, so the checkable part of a claim is declared in a field and checked in code. This extends ADR 0001 from the math to the claims about the math.

## Considered options

- **Trust the Coach's confidence and status.** Rejected: that is the source of the false positives.
- **Declare Polarity only.** Rejected: it enforces Claim Agreement but leaves false positives measured only.
- **Have a model check each claim at run time.** Rejected: it adds a second vendor on the Coach's path and a probabilistic check where a deterministic one is possible. A model reader stays in the eval only.

## Consequences

- The Feature list is every Feature the generators know, not only the weaknesses planted in the Simulated Learners. Otherwise detection would reduce to picking from a menu. False positives on the Features that were not planted are reported.
- Detection will come later. The Pre-registration states how much later is acceptable.
- The engine computes a per-Skill, per-Feature tally across Sessions. The tally feeds both the rule and the Coach's input, so the Coach and the validator reason from the same numbers.
