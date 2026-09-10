# 10: Unit 3 Stories and the Content Pool

**What to build:** A Learner in Unit 3 hears word problems in her Theme with her Nickname in them. Skills f (result or total unknown) and g (change unknown) are template families whose numbers and answer the engine owns; a Sonnet 5 Story adapter writes two sentences under 25 words around them using the Theme vocabulary. A deterministic validator rejects any Story that alters or omits the numbers or answer, exceeds the limits, or leaves the vocabulary; after bounded retries a template sentence is used. A build-time script fills the Content Pool per Theme, Skill, structure, and number range with a Nickname placeholder; at run time the engine fills a Plan from the Pool first, generates misses live and adds them, and falls back to the template. Story validity and Judge readability evals join the eval command with a hand-labelled Calibration Set of 20 Stories.

**Blocked by:** 06 Coach in the Loop, 08 Play a Session

**Status:** ready-for-agent

- [ ] Skills f and g pass the answer-correctness property test
- [ ] The validator rejects each of the hand-written bad Stories and accepts each good one
- [ ] A Session in Unit 3 is filled from the Pool with no live call when variants exist; a missing variant triggers one live call and is added to the Pool
- [ ] When generation fails, the template sentence is used and the Session continues
- [ ] The eval report includes Story validity rate and Judge readability on a sample; the Judge's scores are reported only when agreement with the Calibration Set clears the stated threshold
- [ ] Six Theme vocabularies exist and every pooled Story uses only its Theme's words plus the Nickname
