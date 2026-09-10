# Nerdy AI Hackathon — Prompt 01 (Math) and Product Alignment

**Researched:** 2026-09-09, from Nerdy's own pages. Every claim links to its source.
**Why this file exists:** the "K–5 Math Game" brief is Prompt 01 of the Nerdy AI Hackathon. That fixes the deadline, the judges, the constraints, and what "aligned with Nerdy" means.

## 1. The hackathon

Source: [hackathon.nerdy.com](https://hackathon.nerdy.com/) and [contest terms](https://hackathon.nerdy.com/terms).

| Item | Detail |
|---|---|
| Opens | Thursday 2026-08-27 |
| **Submissions close** | **Friday 2026-09-18, 11:59 PM CDT** (9 days from research date) |
| Review | 2026-09-21 to 09-23 |
| Demo Day | Friday 2026-09-25 |
| Prizes | Winner $10,000; runner-up $5,000; all finalists get visibility with Nerdy leadership and potential job conversations |
| Judges | Nerdy engineers and leadership, all-human, "sole and absolute discretion", no published weights |
| Judging criteria | "Real learner problems and pedagogical rigor", "Demonstrated AI product engineering skills", "Demo quality and execution" |

**Prompt 01 – Math (verbatim):** "Develop an interactive, gamified math experience tailored for elementary students that makes foundational arithmetic concepts both intuitive and engaging."

Other prompts for context: 02 Language (spaced repetition / daily practice mobile app), 03 Literacy (interactive storytelling or challenge-based gameplay for young readers), 04 Open.

### Submission requirements

- Working product "demonstrating learning assistance"
- Written project description: what it does, how it was built, next steps
- 2–3 minute demo video (YouTube, Loom, Drive, Vimeo, or file upload)
- Disclosure of third-party materials and AI usage
- Optional: source code link, live deployment
- Judges "are not required to install, execute, or test any Entry" — **the video and description carry the entry**

### Terms that constrain the build

- **Individuals only.** "Entries are accepted from individuals only." Entrants must be 18+ and legal residents of the US, Argentina, Colombia, Costa Rica, or India. Nerdy employees and active contractors (except tutors) are excluded.
- **Built during the entry period.** Work must be "created during the Entry Period or … substantially developed during the Entry Period."
- **AI-assisted coding is expressly encouraged.** "Building with generative AI assistance is expressly permitted and encouraged." Must disclose all third-party materials.
- **No copyleft.** GPL, LGPL, AGPL, SSPL are prohibited. (Rules out GCompris code and the GPL Piper engine flagged in report 01; MIT/Apache/BSD/CC0 assets are fine.)
- **No real student data, no under-13 testing without verifiable parental consent.** Entries must not be "developed or tested using real student data and was not tested with data of any person under the age of 13 without verifiable parental consent." Biometric collection and facial recognition are prohibited. **This is a second, independent reason to drop voice input:** a voiceprint is a biometric under the 2025 COPPA amendments (see report 03), and testing with a 6-year-old is testing with an under-13.
- **IP assigns to Nerdy.** "You hereby irrevocably assign, transfer, and convey to Sponsor … all right, title, and interest worldwide in and to your Entry." Entrant keeps a "perpetual, irrevocable, worldwide, royalty-free, non-exclusive, license to use … your Entry for any non-commercial purpose." Nerdy gets five years of marketing rights.

## 2. What Nerdy is, in its own words

Sources: [nerdy.com](https://nerdy.com/), [careers.nerdy.com](https://careers.nerdy.com/), [varsitytutors.com](https://www.varsitytutors.com/), [elementary tutoring page](https://www.varsitytutors.com/elementary-school-tutoring).

- Nerdy is a "Live Learning Platform" powered by Varsity Tutors: "Nerdy brings together AI and live instruction." Page title: "Transforming How People Learn."
- The trademarked frame is **"Live + AI™"**: real-time human experts merged with proprietary AI. "Supplement live tutoring with the power of AI and get to the head of the class faster."
- Scale claims: "3,000+ subjects", "40k+ experts", "4.9/5 session rating", "40+ Live AI superpowers".
- Elementary is a served segment: K–5 subjects including math, "Private 1-on-1 tutoring, weekly live classes for academic support, test prep & enrichment, practice tests and diagnostics", with a claim of "2x Growth in Proficiency". No kids-specific app or gamified product is listed.

### The named AI features ("Live AI superpowers")

| Feature | Nerdy's description |
|---|---|
| **AI Session Summaries** | "concise, time-stamped notes & insights" from tutoring sessions |
| **Adaptive Diagnostics & Practice Problems** | "tailor difficulty and focus to your performance" |
| **AI Tutor** | "your on-demand learning coach for explanations, drills, and flashcard quizzes" |
| **Tutor Copilot** | "proprietary AI that surfaces the perfect example or exercise exactly when you need it" (tutor-facing) |
| **Live Notes and Insights** | session summaries turning "complex ideas into clear moments" |
| **Always-on AI Study Agents** | "mini AIs" for note-taking, quiz generation, tip surfacing |
| **AI Practice Hub** | intelligent practice for various grades and goals |
| **Expert matching** | "AI matches each learner with the right expert using 100+ attributes and millions of data points" |

### Existing free AI tools at ai.varsitytutors.com

Source: [ai.varsitytutors.com](https://ai.varsitytutors.com/). Mostly teacher-facing generators (lesson plans, practice problems, rubrics, IEPs, quizzes, report-card comments, parent communication drafts). The student-facing and K–5-relevant ones:

- **Dynamic Worksheet Builder / A+ Math Worksheets**: "instantly create customizable practice sheets", K–5 capable, adjustable difficulty.
- **Number Cards** ([tool page](https://ai.varsitytutors.com/tools/number-cards)): "combine number and symbol cards to build a valid expression" equal to a target; five difficulty tiers (Beginner to Brutal); teachers "adjust number ranges, cards, and operations to fit every learner". No scoring, streaks, rewards, or audio. Built with **Next.js** (`/_next/image` paths).
- **Crossmath**: "crossword-style puzzle where equations are clues".
- **Homework Help**: photo or typed question, step-by-step solutions.
- **AI Flashcard Maker**, **Text Leveler** (K–5).

Reading: Nerdy already has small, unscored, un-gamified math puzzle tools. It has no K–5 product with a progression, mastery model, reward loop, or a character. Prompt 01 is asking for exactly the layer they lack.

## 3. Engineering culture signals

Source: [careers.nerdy.com](https://careers.nerdy.com/), [jobs](https://careers.nerdy.com/jobs).

- "AI-Native at every level"; "If you're not wielding AI, you're not done."
- "Move at founder speed, prototype in hours, and measure in real user outcomes."
- "Full-stack ownership": engineers design, build, and run their own products.
- Open roles: Product Engineer ("AI Product Engineer who blends the instincts of a product thinker with the execution chops of a strong engineer"), Design Engineer (India), Staff and Senior Software Engineer (AI-Native, India). Hiring regions named on the hackathon page: US, Latin America, India.
- **Tech stack: not published** on any page fetched. The only hard signal is Next.js on the AI tools site. UNVERIFIED beyond that.

## 4. What "aligned with Nerdy" means for the build

Derived from the above; these are inferences, not Nerdy statements.

1. **Live + AI is the thesis. Show AI and a human in the same loop.** A pure solo app is off-brand. The obvious fit for K–5: the child plays; an AI layer diagnoses, adapts, and drills (their "AI Tutor" and "Adaptive Diagnostics" language); and the output is a **session summary for a parent or tutor** in the style of their "AI Session Summaries" and "Tutor Copilot", telling the adult which strategy the child is using and what to do next. Report 01's strongest first-grade evidence (a parent and child doing one problem together at bedtime) and report 04's "show which strategy, not just accuracy" recommendation both land here.
2. **Pedagogical rigor is a stated judging criterion.** Cite the Common Core progression, the WWC practice guides, and the motivation research in the write-up and the video. Reports 01 and 04 already contain the citations. Name the strategies (counting on, make-a-ten) in the product, not just in the docs.
3. **"AI product engineering skills" is a stated criterion.** Use an LLM where it changes the product: generating word problems in the child's chosen theme, producing the adult-facing summary, choosing the next item from a mastery model, explaining a wrong answer with the right strategy hint. Not for the core arithmetic scoring, which must be deterministic.
4. **Demo quality carries the entry.** Judges need not run the code. Budget real time for a 2–3 minute video and a hosted live demo link.
5. **Extend what they have rather than duplicate it.** Their Number Cards and Crossmath show the house style: clean, adjustable difficulty, no fluff. A gamified K–5 layer with a character, a progression, and cosmetic rewards is additive. Next.js is the safe stack bet given the one hard signal.
6. **Drop voice input.** Three reasons stack: the contest bans under-13 testing without parental consent and bans biometrics; report 03 showed child ASR is the weakest link; and the nine-day window cannot absorb the speech experiment report 03 said was required. **Keep voice output.** A pre-rendered character voice costs under $25 and no child audio is collected (report 03, §2). Read-aloud of every instruction is still essential because a 1st grader cannot read the UI (report 04, §B5).

## 5. Sources

- https://hackathon.nerdy.com/
- https://hackathon.nerdy.com/terms
- https://nerdy.com/
- https://careers.nerdy.com/
- https://careers.nerdy.com/jobs
- https://www.varsitytutors.com/
- https://www.varsitytutors.com/elementary-school-tutoring
- https://ai.varsitytutors.com/
- https://ai.varsitytutors.com/tools/number-cards
- Investor relations (not fetched): https://investors.nerdy.com/overview/default.aspx

Pages that returned 404 during this pass: nerdy.com/about, varsitytutors.com/live-learning-platform, varsitytutors.com/learning-membership.
