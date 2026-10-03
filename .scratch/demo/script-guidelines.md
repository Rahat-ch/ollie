# How to write a video script

Built on 2026-10-02 from 37 transcripts:

- **0xSero's explainers (11).** The main reference.
- **Top AI technical videos from others (10).** Peter Whidden (Pokemon RL, 10M views on 72k subs), Karpathy (Intro to LLMs, the GPT Tokenizer), 3Blue1Brown (Transformers), Welch Labs (scaling laws), Fireship (o1, GPT-4.5), Computerphile, Algorithmic Simplicity (9x its subs) and AI Explained.
- **Contrast explainers (3).** 3Blue1Brown "LLMs explained briefly", Internet of Bugs "Debunking Devin" and Welch Labs "AlexNet".
- **Top "I built X" AI videos (10).** josh (61x), brenpoly's BMO (57x), Codeically (47x), Turing Games (30x), Naz Louis, Green Code, Fireship, Cole Medin, and two by 0xSero.
- **Your own videos (6).** The call-center video is the voice reference.

The rules below are the patterns most of these share. The numbers in brackets are how many of a set did it.

## 1. The script is word for word, for a teleprompter

The owner films from a teleprompter, and a beat sheet takes too long to film from. So a script is:
- **the full spoken text**, written exactly the way he'd say it (section 7), in paragraphs of 2–5 sentences;
- **screen cues in short [BRACKETED CAPS]** on their own lines, so they're easy to skip while reading;
- **nothing else in the prompter file.** The prep checklist and the source of every number go in a separate file.

## 2. Structure: the beat order the best ones share

1. **A cold open that shows the thing working, about 10–20 s.** Your call-center video did this, and it's your strongest move. Top build videos state what was built within 45 s (9/10).
2. **"Hey y'all, this is Rahat", then what you've been doing, then a pointer back at the cold open.**
3. **A hard number within the first minute, set against something.** 0xSero does this in all 11 ("2.53 billion tokens… and I only pay $200"). Every top video anchors its numbers (14/14).
4. **Plant an open loop.** "And at the end, I'll show you the one number that failed, and why it turned out to be me." Every top investigation plants early and pays off late (9/14).
5. **The concrete case before the general idea.** One real example first, then what it means (10/10 top videos).
6. **Receipts before the argument.** Your own dashboard, repo, report or kernel log (0xSero 11/11).
7. **Proof running on screen.** A live demo, a test running, a real report (10/10 builds).
8. **A failure in the middle, around 45–75% of the runtime,** then diagnose, fix and re-run (8/10 builds; Whidden's whole video).
9. **A plain verdict.** What passed, what failed, and what you'd tell someone.
10. **Widen it to the viewer:** "none of this is tied to my app…"
11. **One warm closing line,** with a callback to the hook if you can. No subscribe begging (only 1 of 10 top videos asks).

## 3. The investigation story ("the real cause was…")

This beat sheet is shared by Whidden's Pokemon Center bug, Karpathy's tokenizer bookends, "Debunking Devin", and 0xSero's "exactly 2x doesn't seem right":

1. **The symptom as a number against the line you drew in advance.**
2. **Say the obvious suspect out loud.** "So obviously I thought the model was slow."
3. **Rule it out with something on screen,** not a claim.
4. **The detail that didn't fit.** 0xSero: "exactly 2x slower just doesn't seem right…"
5. **Replay the moment.** One slow request's timeline: where the time went.
6. **The root cause in one plain sentence,** said once. Let it land; a light joke is fine.
7. **What you changed, and the re-run.** Say clearly that you fixed the cause, not the threshold.
8. **What's still unknown,** in one honest sentence.
9. **Generalise in one line.** "This is the whole reason you run evals, right?"

Run this in about 90–150 s for a 10-minute video.

## 4. Showing your own failures

All 10 top videos and 13 of 14 explainers keep failures in. How they keep momentum:
- **Give credit first, then the miss:** what it got right, then what it didn't.
- **Put the condition inside the number:** "the line was 30 seconds, and it came in at 92."
- **Doubt the bad result yourself, before the viewer does.**
- **Own your part.** 0xSero: "that's mainly on me".
- **Make the miss the reason for the next thing.** "So that's why the next thing I'm building is…"
- **One or two sentences, then move on.** Never apologise twice for the same miss.
- **Answer the sceptic before they ask.** AI Explained: "before you ask…". For you: "and no, I didn't just re-run it until it passed."

## 5. Numbers

- **Round and spoken, with "about":** "about 30 seconds", "about a quarter of the cost".
- **Every number gets a comparison:** before and after, against the line, against Opus.
- **No more than one new number per sentence.** Show the rest on screen.
- **Every number you say has to be in a committed file.** Keep the source table at the bottom of the script.

## 6. Explaining technical things

- **Your way:** the scenario first, then what you give it and what it gives back, then an example. No definition up front.
- **Define jargon in half a sentence and keep moving.** 0xSero says "it's like…" 50 times. "So an eval is basically a test, but for the AI's behaviour."
- **Name the main idea with "The key thing is…" and say who decides what:** "the AI only suggests, and the code actually decides."
- **Play down the plumbing:** "honestly, that's just a bunch of if statements."
- **Point at the screen:** "this panel on the right", "these red rows here".

## 7. Your voice (from your own transcripts)

**Do:**
- Open sentences with "So", "And" and "Now". Keep them short, about 12 words. One run-on near the end is fine.
- Ask the question, then answer it. About a quarter of your sentences are questions: "So, what is the Coach?"
- Give lists as quick questions: "Is it slow? Is it retrying? Is it my code?"
- Keep "actually" (your signature), along with "super", "really", "just", "kind of like", "pretty much" and "right?".
- Use casual words: "y'all", "bucks", "cuz", "dude", "freaking".
- Give other tools plain credit: "the voice is ElevenLabs, the model is Claude".
- After a dense part, reassure: "Seems like a lot, but…"
- Recap a demo with "Cool. So, … right?"
- Keep the humour dry and at your own expense.

**Don't:**
- **Colon reveals or fragment punchlines:** "One job: the math." "Four red rows, published."
- **"X, not Y" slogans:** "a test, not a hope."
- **An abstract noun as the subject:** "The commit history is the proof…". Say "I" and "you" instead.
- **Marketing words:** game changer, seamless, robust, powerful, unlock, leverage, dive into.
- **The like/subscribe/bell ask.**

**Lines you actually say** (use them freely):
- "Hey y'all, this is Rahat"
- "Today, we're actually going to be…"
- "So, what is…?"
- "You give it… and what it does is…"
- "The key thing is that…"
- "And honestly, that's just…"
- "Seems like a lot, but…"
- "Cool. So, … right?"
- "So, that's it."
- "And none of this is just tied to my demo."
- "Thanks for watching and stay tuned for more…"

## 8. Pacing and length

- **Pace.** You talk at about 200 words a minute. The best videos run 145–190. Aim for about 180: a little slower, with a breath before the key word.
- **Length.** 10 minutes is about 1,700–1,900 spoken words. If the beat sheet's "say" lines add up to more than about 1,200 words, cut beats, not words.
- **Breath-sized chunks.** Write in pieces of about 10–12 words.
- **Shorter wins.** Top build videos at 30–61x are 6–20 minutes. Cut anything a non-developer wouldn't miss.

## 9. Before you film: check the script

- [ ] Is there a cold open of the thing working in the first 20 s?
- [ ] Is there a hard number with a comparison in the first minute?
- [ ] Is the open loop planted early and paid off late?
- [ ] Is there a failure in the middle, with diagnose, fix and re-run?
- [ ] Does every number have a source in a committed file?
- [ ] Is there no colon reveal, fragment punchline, "X, not Y" or marketing word?
- [ ] Is "actually" in there, and is a quarter of it questions?
- [ ] Are the "say" lines under about 1,200 words?
- [ ] Does it close on "So, that's it", widen to the viewer, then one warm line?
