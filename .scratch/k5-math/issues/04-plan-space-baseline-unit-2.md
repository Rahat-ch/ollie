# 04: Plan Space, Baseline planner, and Unit 2

**What to build:** A developer runs ten Baseline Sessions from the CLI and watches a Skill reach Mastery, a Review Problem appear, and Unit 2 unlock. The engine validates every Session Plan against the Plan Space (Skill mix, number ranges within each Skill's standard, allowed structures, review share 0 to 1, length 6 to 10, Hypothesis under test) and rejects anything outside it with a reason. The Baseline rule is 6 Problems from the current Skill plus 2 Review Problems, advancing on the 8-of-10 rule. Skills c (counting on), d (make-a-ten), e (unknown addend) exist with Hints.

**Blocked by:** 03 Loop core

**Status:** ready-for-agent

- [ ] Out-of-space Plans are rejected with a reason: a skipped prerequisite, a range beyond the standard, length 5 or 11, an unknown Skill
- [ ] A valid Plan yields a Session of exactly the requested length and mix
- [ ] Review Problems are drawn only from Mastered Skills; review share 0 yields none
- [ ] Unit 2 unlocks only when Skills a and b are Mastered
- [ ] Skills c, d, e pass the same answer-correctness property test as a and b
- [ ] A CLI command runs N Baseline Sessions for a scripted policy and prints Mastery transitions
