---
status: accepted
date: 2026-09-10
---

# Engine owns the math, model owns the words

Every Problem's type, numbers, and correct answer are chosen by a deterministic generator keyed to a Common Core Grade 1 Skill. The language model only writes the themed Story around numbers it is handed, and the Parent Summary. It never invents a problem, decides an answer, or writes a Hint.

We chose this because the arithmetic must be correct every time for a six-year-old, template families already yield unlimited on-standard problems for free, and a model-authored answer key would need its own checker anyway. Model output is schema-validated and rejected if the handed numbers or answer are missing or altered.

## Considered options

- Let the model generate whole problems including answers: rejected for correctness risk, cost per problem, and drift off the standard.
- Templates with no model at all: rejected because themed, varied Stories in the Learner's chosen Theme are the visible "generative content" feature and the research shows personalisation helps.

## Consequences

- Adding a Skill means adding a template family and a Hint, not a prompt.
- The "generative" claim rests on Story variety and Theme, and on the Parent Summary, not on the math itself.
