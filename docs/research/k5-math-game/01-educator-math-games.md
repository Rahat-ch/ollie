# K-5 Math Games Built by Educators / Used in Schools — What They Do, What Works, What We Can Reuse

**Research date:** 2026-09-09
**Primary audience for our build:** US 1st grader, age 6-7 (pre-reader / early reader)
**Scope:** A gamified learning experience (not necessarily a full game). Emphasis on progression, mastery, and reward-economy mechanics.

> Method note: every claim below links to the source that owns it — vendor first-party pages, published papers, government standards/evidence documents, or the actual repo/license file. Listicles were used only to locate primaries. Anything I could not confirm from a primary is marked **UNVERIFIED**.

---

## Summary — the 11 decision-relevant findings

1. **Nothing in this market is open source and nothing has a public API.** All 17 products surveyed are closed; integration is Clever/ClassLink/Google Classroom SSO only. Math Playground's terms explicitly forbid iFrame embedding, killing the "aggregate free web games" strategy ([ToS](https://www.mathplayground.com/terms_of_service.html)). What we *can* reuse is infrastructure — Khan's **Perseus (MIT)**, **ts-fsrs (MIT)**, **Phaser/Excalibur**, **Kenney CC0 art** — plus **Illustrative Mathematics 1st edition content (CC BY 4.0)**. GCompris is a superb design catalogue but **AGPL-3.0**, so read it, don't copy it.
2. **The single best-evidenced mechanic is almost absent from commercial products: the linear number board.** Four 15-minute sessions of a 1-10 linear board where the child *says each number aloud while moving* produced **d = 1.62** vs. an identical color-board control ([Siegler & Ramani 2008](https://doi.org/10.1111/j.1467-7687.2008.00714.x)). Circular boards don't work ([2009 follow-up](https://doi.org/10.1037/a0014239)). It costs almost nothing to build.
3. **WWC gives STRONG evidence to six things, and they read like a product spec**: systematic instruction, mathematical language, concrete/semi-concrete representations, **number lines**, word problems, and **timed fluency activities** — with explicit constraints (1-5 minutes, only on already-taught content, mixed easy/hard items, mandatory self-correction, and "**make sure the graphs are kept private**") ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)).
4. **Nobody publishes a spacing model. This is the open lane.** Prodigy claims "spiral review" and Reflex "the right facts at the right time," with zero parameters. Meanwhile practice testing and distributed practice are the only two **high-utility** techniques of ten in [Dunlosky et al. (2013)](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266), and Duolingo's own scheduler work moved **daily engagement +12%** in an operational study ([Settles & Meeder 2016](https://aclanthology.org/P16-1174.pdf)) — far more than their cosmetic polish (+1.7% D7).
5. **Effect sizes in this category are small, and the more rigorous the design the smaller they get.** DreamBox +0.10 avg; Zearn's preregistered confirmatory outcome **+0.07, not significant**; ST Math **negligible** in its only independent RCT while its vendor-commissioned QED reports +0.13/+0.17. Treat any claim above ~0.3 SD as a prompt to check the funder.
6. **Only DreamBox and Bedtime Math have evidence at our exact grade.** DreamBox's entire WWC record is a **K-1 RCT** (+4 percentile, "potentially positive," **not updated since Dec 2013**) ([WWC 794](https://ies.ed.gov/ncee/wwc/Intervention/794)). Everything else is grades 3-5. Khan Academy Kids is the right age with **no math evidence at all**.
7. **The strongest first-grade result on record involves no software adaptivity whatsoever.** [Berkowitz et al. (2015), *Science*](https://doi.org/10.1126/science.aac7427), N=587 first-grade families: a nightly parent-child word problem, with the biggest gains among children of **math-anxious parents**, persisting to third grade (≈3 extra months of math). Funded by the founder's own family foundation — disclose it — but it argues hard for designing the *parent-child* loop, not just the child-device loop.
8. **Six-year-olds are the maximum-sensitivity group in *both* directions — biggest gamification lift and biggest motivational cost.** Undermining is worse for children (tangible rewards *d* = **−0.39** vs −0.27 for college; Q_b *p* < .04), praise does **not** measurably help them (*d* = +0.11, **ns**), and the worst cell in the literature is a performance-contingent reward where the child visibly gets **less than the maximum**, ***d* = −0.88** — i.e. a 1-of-3-stars screen ([Deci, Koestner & Ryan 1999](https://doi.org/10.1037/0033-2909.125.6.627)). Yet gamification's measured benefit is *larger* for this age too (K-12 ES 0.92 vs college 0.15).
9. **The reward economy is a depreciating asset: 1.57 (days) → 0.39 (weeks) → −0.20 (years).** ([Kim & Castelli 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8037535/)) A year-long product built on novelty can finish *below control*. Plan the fade — which is also what WWC's Strong-rated behaviour guidance instructs ("gradually reduce and then eliminate rewards"). And mechanics differ by need: points/badges/leaderboards buy **competence only**; avatars and narrative buy **relatedness** and **autonomy** ([Sailer et al. 2017](https://doi.org/10.1016/j.chb.2016.12.033); [Birk et al. 2016](https://doi.org/10.1145/2858036.2858062)).
10. **Two opposite philosophies bracket the field, and the defensible design sits between them.** ST Math strips reward and stimulus entirely ("decreasing unnecessary visual and auditory elements increases learning"); Prodigy maximizes it to the point of a **21-organization FTC complaint** alleging 16 membership ads to 4 math problems in 19 minutes and paying members visibly elevated above classmates ([Fairplay, Feb 2021](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf)). **Reflex** is the middle path worth copying: tokens for *effort as well as outcome*, cosmetic-only spend, a daily "Green Light," and consecutive-day unlocks.
11. **Two content traps for a Grade 1 build:** CCSS Grade 1 has **no money standard** (that's Grade 2's `2.MD.8`; Utah and others add it locally), and Grade 1 requires fluency **within 10 only** — automaticity to 20 is `2.OA.2`. Also: COPPA's amended Rule (effective **22 April 2025**) treats persistent identifiers and **voice recordings** as personal information, which constrains any speech-input mechanic.

---

## 1. Educator / school-used products

### 1.0 At-a-glance comparison

| Product | Built by | Core loop | Mastery model | Reward economy | Grade 1 fit | Free tier | Best evidence |
|---|---|---|---|---|---|---|---|
| **Prodigy Math** | Prodigy Education (Waterloo eng. grads Mahimker & Peters) | Wizard RPG; answer a question → cast a spell in battle | Auto placement test per strand; "spiral review"; algorithm undocumented | **Heavy** — L1-100, XP, Magicoin, pets, gear, member-gated rewards | Grades 1-8; text/UI-heavy for a 6-y-o | Free to play; free for teachers | None. No RCT, no WWC, 0 ERIC studies. Self-claimed ESSA Tier 3/4 |
| **DreamBox Math** | DreamBox Learning; now **Discovery Education** (Oct 2023) | Drag virtual manipulatives (number rack, ten-frames, open number line) to *construct* an answer | Adapts on **the strategy used**, within-lesson *and* between-lesson | Essentially none | **Best K-1 fit** — WWC evidence is literally on K-1 | No | **WWC "potentially positive", +4 percentile, K-1 RCT**; Evidence for ESSA Tier 1, avg +0.10 |
| **Zearn Math** | Zearn (501(c)(3) nonprofit) | Fluency warm-up → guided video lesson w/ manipulatives → **quiz requiring 100%** | Mastery gate at 100%; scaffolds *in place* rather than dropping grade level | **None** (by design) | K-8; G1 opens on counting-on → decomposition | **Free forever** for a teacher + 35 students | RAND RCT: confirmatory STAAR **+0.07 SD, not significant**; peer-reviewed LA study +0.03 SD |
| **ST Math** | MIND Education (nonprofit, 1998; Gordon Shaw & Mark Bodner) | Guide **JiJi the penguin** past a visual puzzle; animation plays out *why* a wrong answer failed | Mastery before progression; thresholds unpublished | **None, deliberately** | PreK-8 core + separate PreK/TK "Early Learning" product | No | Independent RCT found **negligible/nonsignificant** effect; vendor-commissioned QEDs +0.13/+0.17 |
| **Khan Academy Kids** | Khan Academy (nonprofit) w/ Stanford GSE | 5 animal guides walk child through books, songs, tap/drag activities | Adaptive "Learning Path" by age + performance; algorithm unpublished | Characters + collection, no currency | **Ages 2-8 — best nominal age fit** | **100% free, no ads, no IAP** | Literacy RCT only (*J. Children and Media* 2021). **No math efficacy study at all** |
| **Reflex** | ExploreLearning (Cambium Learning Group) | Crabby's Fact Fair → Coach Penny instruction → fast-paced fluency games → **Green Light** | Daily Green Light; **consecutive-day streak unlocks games**; fact-family adaptive selection | Tokens for **effort *and* progress** → avatar accessories + Progress Tree | **Grades 2+. Not for grade 1.** | No; $54.95/student/yr at home | 0 ERIC studies, no WWC. Digital Promise Tier 3 only |
| **SplashLearn** | StudyPad, Inc. (Jain brothers + Nath, IIT-KGP) | Themed worlds, short game activities with characters Eddie/Hoppy/Blu | Not published | **Heavy** — coins, unlockable characters | Strong G1 catalogue (219 addition games) | Limited | ESSA Level III, vendor-commissioned correlational |
| **IXL Math** | IXL Learning (Paul Mishkin, 1998 as Quia) | Pick a skill → optional worked example → auto-generated question stream | **SmartScore 0-100** — the most legible mastery model in the market (see §1.7) + IRT **Real-Time Diagnostic** | **Deliberately light** — badges + optional leaderboards, **no currency** | Full G1 skill tree | No | All vendor-authored. No independent peer-reviewed K-5 study found; no WWC entry |
| **Math Playground** | Math Playground, LLC (2002, MA) | Browse and play self-contained free web games | **None at all** | **None at all** | Good G1 game list | Free ad-supported | None |
| **Numberock** | Benjamin Hehn (ex-public-school teacher), NUMBEROCK LLC | Watch a 2-4 min animated math song → worksheet/quiz | None — teacher-directed | None | K-5/K-6, CCSS + TEKS tagged | Free YouTube (~150 videos) | None |
| **Bedtime Math** | Bedtime Math Foundation, 501(c)(3), Laura Overdeck (2012) | One daily story + **tiered questions** (Wee Ones → Little Kids → Big Kids), read with a parent | None — parent picks the tier | None | Ages 3-9; **deliberately not standards-tagged** | **Free** | **The strongest evidence in this whole document** — *Science* 2015 RCT, N=587 first-graders (see §1.12) |
| **Motion Math** | Adauto & Klein, Stanford GSE LDT project (2010) | Tilt/drag to place numbers; feed a fish by composing a target number | Now gated on the **i-Ready Diagnostic** | Unknown post-acquisition | Hungry Guppy / Hungry Fish / Zoom fit G1 | No | *Games and Culture* 2013 RCT, N=122 **4th graders**, +>15% on fractions |
| **Numberblocks** | BBC Children's Productions + Alphablocks Ltd., animated by Blue Zoo | Watch episodes; app adds subitising games + a quiz gate hosted by Numberblock 6 | 5 levels + a genuine **quiz gate** | 20 collectible "playthings" in Hide and Seek | **Excellent** — EYFS through UK Year 1 | Free "Meet the Numberblocks"; World is $7.99/mo | **None found.** NCETM produced support materials, not research |
| **Todo Math** | Enuma (fka Locomotive Labs, 2012; Sooinn Lee & Gunho Lee) | Daily Adventure level path + Free Choice + AI Practice | 8 proficiency levels; details unpublished | Modest | PreK-2nd; **built for learning differences (UDL)** | Free trial | Sibling product **Kitkit School co-won the $15M Global Learning XPRIZE** on a 2,500-tablet Tanzania RCT |
| **Osmo Numbers / Math Wizard** | Tangible Play (Sharma & Scholler, ex-Google, 2013), acquired by BYJU'S 2019 | **Physical tiles on the table**, read by a mirror clipped over the iPad camera | Numbers: **no timers by design**. Math Wizard: difficulty selector + zones | Math Wizard: crystals → pets/food/toys in Sky Castle | Math Wizard is **explicitly ages 6-8, add/sub within 120** | Apps free, hardware is the purchase | **None published anywhere on their site** — parent-survey marketing only |
| **Boddle Learning** | Clarence Tan & Edna Martinson (2018) | 3D avatar game world; placement test disguised as gameplay | Placement test → auto difficulty adjustment | **The most elaborate here** — pets, pet upgrades, Pet Battles, Racers/Grand Prix, avatar, home decoration, Boddle Bucks, Boddle Pass, daily/weekly quests | K-6, CCSS/TEKS/B.E.S.T. aligned | **Substantial free tier; free for teachers and schools** | ESSA Level III, n=83, 3rd grade, correlational |
| **Matific** | Slate Science (Sydney); US via Heinemann | Short "episodes" via Adaptive Adventure / Training Zone / Multiplayer Arena | Algorithm-led "Adventure Island" path | Integrated rewards | K-9 | 7-day trial | Nine studies, **all vendor-hosted**, commissioning undisclosed |
| **Building Blocks** | Clements & Sarama (Univ. of Denver) | Whole-group + small-group + center + **computer** activities on learning trajectories | **Learning trajectories** — the reference implementation | n/a | Pre-K | No | **WWC "Potentially Positive", ESSA Tier 2**, Dec 2023 |

### 1.1 Prodigy Math — the maximal reward economy, and the cautionary tale

**Who.** Founded by Rohan Mahimker and Alex Peters, University of Waterloo mechatronics engineering graduates (class of 2011); **$159M raised as of January 2021** ([Waterloo Engineering news](https://uwaterloo.ca/engineering/news/alumni-company-prodigy-secures-159m-investment)). Prodigy's own `about-us` page currently **returns HTTP 404**, so the founding year and the legal name *SMARTeacher Inc.* are **UNVERIFIED against a primary vendor source**.

**Pedagogy claimed.** Vygotsky's zone of proximal development — the algorithm keeps content "challenging enough to allow them to develop key skills, and intuitive enough to drop them back to prerequisite skills," using "spiral review methodology to continue to assess and review student knowledge as new content is delivered" ([Is Prodigy Math Adaptive? Our Algorithm, Explained](https://www.prodigygame.com/main-en/blog/is-prodigy-math-adaptive)).

**Core loop for a 6-7 year-old.** The child is a wizard; the Puppet Master has attacked Prodigy Island. Walk a zone → get pulled into a battle → **each correct answer grants one spell to cast**, a wrong answer costs the turn → win → XP for character and pet, hearts, loot. Between battles: collect and evolve pets (100+, elementally typed), run quests and bounties, decorate a house, shop in Lamplight Town ([What is Prodigy Math?](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game); [Parents' Guide](https://www.prodigygame.com/main-en/blog/parents-guide-to-prodigy)).

**Progression.** A **placement test runs automatically from the first question**, starts *below* the selected grade, extends one grade above, takes ~3-4 sessions, and places the student **per strand** rather than globally ([Placement Test Guide](https://www.prodigygame.com/main-en/blog/prodigy-placement-test)). Beyond that, adaptivity is described only qualitatively — **no published claim of IRT, knowledge-space theory, or Bayesian knowledge tracing**, and no documented spacing parameters.

**Pricing** ([Buy Math Memberships](https://www.prodigygame.com/Memberships/math/)): Core $9.95/mo or $58.95/yr; Plus $14.95 / $88.95; Ultra $19.95 / $118.95. **Free for teachers** — "No cost to you or your students" ([teachers page](https://www.prodigygame.com/main-en/teachers)). No school license tier is published; parent memberships subsidize free school access.

**Efficacy.** The weakest here. **No RCT, no WWC entry, zero ERIC-indexed efficacy studies.** The [research page](https://webflow.prodigygame.com/main-en/research) lists observational usage-vs-outcome analyses (CA, FL, PA, TX, NJ) — none names an independent evaluator, reports an effect size in SD units, or details a comparison-group design. It displays self-claimed **ESSA Tier 3 and Tier 4** badges — the two weakest tiers.

**The FTC complaint.** On **19 February 2021**, Fairplay (formerly Campaign for a Commercial-Free Childhood) and 21 partner organizations filed a complaint with the FTC ([complaint PDF](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf); [campaign page](https://fairplayforkids.org/pf/prodigy/)). Allegations worth internalizing before we design any paid tier:

- In **19 minutes of play, 16 unique membership advertisements and only 4 math problems**.
- In-classroom social comparison: members "sail around on a cloud, while non-members … literally tromp in the dirt"; sparkly treasure chests are visible but paywalled.
- Members earn higher scores and advance faster for identical work.
- Deceptive "completely free" marketing to schools; different builds shown to schools vs. home players.
- Fairplay cites **Prodigy's own research** as implying a child needs **888 math questions (~12+ focused hours) to raise a standardized test score by one point**.

No FTC resolution is reported. **No public API, no developer docs, not open source.**

### 1.2 DreamBox Math — the best K-1 evidence in the market

**Ownership.** **Discovery Education, backed by Clearlake Capital, completed its acquisition of DreamBox Learning on 12 October 2023** ([Discovery Education press release](https://www.discoveryeducation.com/details/clearlake-capital-backed-discovery-education-completes-acquisition-of-dreambox-learning/)). Founded 2006 in Bellevue WA by Lou Gray and Ben Slivka — **UNVERIFIED** against a primary source, as the original vendor pages are gone.

**Pedagogy — conceptual before procedural, stated explicitly.** DreamBox "encourages students to think conceptually about math ideas, representations, and skills so that they don't come to incorrectly believe that math is simply a series of procedural steps," using "virtual manipulatives that allow students to demonstrate mathematical thinking and reasoning as they develop conceptual understanding" ([DreamBox Math](https://www.discoveryeducation.com/solutions/math/dreambox-math/)).

**Core loop.** The child manipulates on-screen tools — number racks (rekenreks), ten-frames, open number lines, snap cubes — to *construct* an answer rather than select one.

**The distinctive progression claim.** The engine "tracks each student interaction and **evaluates the strategies used to solve problems**," then adjusts "the lesson and the level of difficulty, scaffolding, sequencing, number of hints, and pacing" — operating at **two levels: within a lesson** (responding to the strategy used, not just right/wrong) **and between lessons** ([How Does DreamBox Math Work](https://support.dreambox.com/s/article/How-Does-DreamBox-Work)). **The algorithm class is still not published** — no IRT/BKT/knowledge-space claim appears anywhere. **UNVERIFIED.**

**Platforms.** Web on PC/Mac/Chromebook plus an **iPad app** ([App Store](https://apps.apple.com/us/app/dreambox-math/id675354945)). **Not available on Android tablets, Kindle Fire, or phones** for student play.

**Pricing** ([dreambox.com/family/pricing](https://www.dreambox.com/family/pricing)): 1 month $12.95 individual / $19.95 family; 6 months $59.95 / $99.95; 12 months $99.95 / $149.95; "lifetime" (10 yrs) $250 / $325.

**Efficacy — the strongest formal record here, and it is at our exact grade.**

- **WWC Intervention Report (December 2013):** rating **"potentially positive effects"** on mathematics achievement; **one** study met WWC standards **without reservations**; **improvement index +4 percentile points**; extent of evidence **small**. Grades **K-1**. **Not updated since December 2013** ([WWC Evidence Snapshot 627](https://ies.ed.gov/ncee/wwc/EvidenceSnapshot/627); [full report PDF](https://ies.ed.gov/ncee/wwc/Docs/InterventionReports/wwc_dreambox_121013.pdf); [WWC Intervention page](https://ies.ed.gov/ncee/wwc/Intervention/794)).
- The qualifying study: **Wang, H., & Woodworth, K. (2011)**, *Evaluation of Rocketship Education's use of DreamBox Learning's online mathematics program*, SRI International. RCT, 4:1 assignment, **557 students** across three Rocketship charter schools in San Jose; 81% ELL, 87% Hispanic, 88% FRL; outcome NWEA MAP ([WWC study record 78475](https://ies.ed.gov/ncee/wwc/Study/78475); [ERIC ED528686](https://eric.ed.gov/?id=ED528686)). Commissioned by Rocketship, not DreamBox.
- **Evidence for ESSA: "Strong" (Tier 1)**, 2 RCTs, 13,320 students, **average effect size +0.10** ([entry](https://www.evidenceforessa.org/program/dreambox-learning/)). Component results: Wang & Woodworth K-1 → +0.16 (Measurement & Geometry), +0.11 overall; **Lenard & Rhea 2019** (24 NC schools, 10,000+ students) → **K-2 +0.12 on the Number Knowledge Test but grades 4-5 only +0.03** on the state EOG. *The effect is concentrated in the early grades and essentially vanishes by grade 4.*
- **Foster, M.E. (2024)**, "Evaluating the Impact of Supplemental Computer-Assisted Math Instruction in Elementary School: A Conceptual Replication," *Journal of Research on Educational Effectiveness* — an independent **DreamBox vs Zearn head-to-head at K-1**, 115 students, 11 weeks. DreamBox higher on posttest numeracy and geometry (**Hedges g = 0.32 and 0.14**) but **not statistically significant**; author warns "the true effect may be smaller," and found **Matthew Effects** for numeracy (stronger students benefited more) ([ERIC EJ1408302](https://eric.ed.gov/?id=EJ1408302)).

### 1.3 Zearn Math — mastery gate at 100%, and no reward economy at all

**Who.** A **501(c)(3) nonprofit** reaching "about 1 in 4 elementary students" ([about.zearn.org](https://about.zearn.org/)). Founding year/founders **UNVERIFIED** on a primary Zearn page.

**Pedagogy.** Concrete → Pictorial → Abstract, plus explicit mastery: lessons "introduce math concepts through a Concrete-to-Pictorial-to-Abstract (CPA) progression," and students "apply their learning to new problems and get the support they need until they can **show 100% understanding on their own**." Crucially, lessons adapt "**while keeping them engaged in grade-level content**" ([Zearn's approach](https://about.zearn.org/approach)). **This is the strategic differentiator: Zearn deliberately does not send a struggling child down a grade level — it scaffolds in place.**

**Core loop.** Three parts: (1) **fluency activity** for procedural fluency and automaticity; (2) **guided interactive video lesson** with an on-screen teacher, digital manipulatives, and prompts for both on-screen and **paper-and-pencil** work; (3) a **mastery quiz requiring 100%**, with just-in-time support until the student gets there ([approach page](https://about.zearn.org/approach)). It is the least game-like product here.

**Grade 1 content.** Six "Missions" per year at ~4 lessons/week over ~36 weeks. Grade 1 opens by moving students "from counting all to a more sophisticated strategy, **counting on**," then decomposition/composition connected to addition and subtraction of small numbers ([Grade 1 Course Guide PDF](https://webassets.zearn.org/resources/G1_Course_Guide_Z1.pdf); [Kindergarten Course Guide PDF](https://webassets.zearn.org/resources/GK_Course_Guide_Z1.pdf)).

**Pricing.** **Free forever** for an individual teacher — "up to 35 students and 1 teacher" ([pricing](https://about.zearn.org/math-resources/pricing)). District pricing is quote-only; a historical **$2,500 per school site** figure for 2018-19 appears in [Zearn's own pricing PDF](https://webassets.zearn.org/ZearnMath2018/Pricing.pdf) and a [Louisiana DOE price list](https://doe.louisiana.gov/docs/default-source/curricular-resources/price-list---zearn---zearn-math-grades-1-8.pdf).

**Efficacy — read the fine print.**

- **RAND, independent, IES-funded:** Pane, J.F., Doss, C., Todd, I., & Seaman, D. (2025), *Efficacy of Zearn Math over Two Years in Grades 3 to 5: An Experiment in Texas*, EdWorkingPaper 25-1211. 64 schools randomized, 10,000+ students. **The preregistered confirmatory outcome (Texas STAAR) was +0.07 SD and NOT statistically significant.** Exploratory outcomes were consistently positive, including **+0.11 SD on NWEA MAP** ([EdWorkingPaper AI25-1211](https://edworkingpapers.com/ai25-1211); [ERIC ED674124](https://eric.ed.gov/?id=ED674124); [IES award record](https://ies.ed.gov/use-work/awards/efficacy-zearn-math)).
- **Zearn's own research page leads with the +0.11 SD exploratory figure**, not the null confirmatory result ([Zearn research](https://about.zearn.org/research)). Flag this whenever citing Zearn's efficacy claims.
- **Hashim, S. (2024), *AERA Open*** — peer-reviewed, Louisiana administrative data: grade levels programmatically using Zearn scored about **+0.03 SD** higher, with an ELA placebo test ([ERIC EJ1455259](https://eric.ed.gov/?id=EJ1455259)).
- Several items on Zearn's research page are **self-authored and ERIC-classified "Online Submission"** by Zearn staff using a treatment-on-the-treated usage method ([ED626340](https://eric.ed.gov/?id=ED626340), [ED626399](https://eric.ed.gov/?id=ED626399), [ED628495](https://eric.ed.gov/?id=ED628495)).
- **Evidence for ESSA: Strong (Tier 1)** ([entry](https://www.evidenceforessa.org/program/zearn-math/)). **No WWC intervention report.**

**Openness.** Zearn's Terms confirm the curriculum derives from **OER**: content derived from **Eureka Math / EngageNY** ("©2017-2020 Great Minds, Inc. Some rights reserved"), the 6-8 curriculum from **Open Up Resources under CC BY 4.0**, and further portions under **CC BY-NC-SA 4.0** ([Zearn Terms](https://about.zearn.org/terms)). The *software* is closed, and there is no API.

### 1.4 ST Math — the anti-Prodigy, and a genuine evidence controversy

**Who.** Founded **1998** as the nonprofit MIND Research Institute, now MIND Education, co-founded by **Dr. Gordon Shaw** (UC Irvine neuroscientist, of "Mozart effect" fame) and **Dr. Mark Bodner** ([MIND Education about](https://www.mindeducation.org/about/)).

**Pedagogy — the most distinctive design philosophy in this document.** From [the ST Math program page](https://www.mindeducation.org/programs/st-math/) and [The Science of ST Math](https://play.stmath.com/academy/courses/essentials4/nounit/science/):

- **Spatial-temporal reasoning** — "the natural human ability to understand how things relate, move, and change over time," claimed to be "a strong predictor of success at higher levels of mathematics" and improvable with practice.
- **Concepts before symbols** — puzzles are visual and largely **language-free**, which "reduce[s] language barriers and give[s] more students an entry point."
- **Deliberate cognitive-load minimization** — "decreasing unnecessary visual and auditory elements increases learning," because "our working memory is very limited." **This is the exact opposite of Prodigy's design.**
- **Productive struggle** with **immediate informative feedback** grounded in the perception-action cycle.
- **Mastery before progression.**

**Core loop.** A child guides **JiJi**, a penguin, across the screen. A puzzle blocks JiJi's path; the student manipulates the visual model; **the animation then plays out the consequence of the answer** — a wrong answer visibly fails *in a way that shows why*, then the student retries. No text, no timer, no combat. **This "the animation shows you why you were wrong" feedback is the single most stealable mechanic in the product.**

**Progression.** Puzzles build in complexity with "mastery before progression." **No XP/coins/avatars/pets, no streaks, no speed thresholds.** Exact mastery thresholds are **UNVERIFIED** (help.stmath.com returns 403). MIND has published research on **elective replay after failure** (Zhang & Rutherford, LAK22), on operationalizing **productive struggle from clickstream data** (Krumm, Coulson & Neisler, LAK22), and on ST Math's effect on **math self-beliefs** (Rutherford et al., 2020, *JRTE*) — all at [rp.stmath.com](https://rp.stmath.com/pages/publications.html).

**Grade 1 fit.** Core ST Math is PreK-8; a separate **ST Math Early Learning** targets Pre-K/TK (ages 3-5) with a blended model of digital puzzles + physical manipulatives + story mats ([ST Math Early Learning](https://www.mindeducation.org/programs/st-math-early-learning/)). Grade-1 scope and sequence is not published — **UNVERIFIED**. Pricing is **not published anywhere**; quote/demo only.

**Efficacy — the independent RCT found essentially nothing.**

> **Rutherford, T., Farkas, G., Duncan, G., Burchinal, M., Kibrick, M., Graham, J., Richland, L., Tran, N., Schneider, S., Duran, L., & Martinez, M.E. (2014). "A Randomized Trial of an Elementary School Mathematics Software Intervention: Spatial-Temporal Math." *Journal of Research on Educational Effectiveness*.** 52 low-performing schools randomly assigned. "**Analyses reveal a negligible effect of ST Math on mathematics scores**… **Two years of program treatment produced a nonsignificant effect.**" ([ERIC EJ1041346](https://eric.ed.gov/?id=EJ1041346))

MIND's own research portal reports **the same trial** as an **Internal Report** — Bodner, M. & Coulson, A. (2021), *"Randomized Trial of Elementary School ST Math Software Intervention Reveals Significant Efficacy"* ([portal](https://rp.stmath.com/pages/publications.html), [PDF](https://rp.stmath.com/assets/pdfs/h5ewf116j8.pdf)). Same trial, opposite headline, MIND-authored reanalysis.

The QED evidence MIND markets is **vendor-commissioned**:

- **WestEd (2019) cross-state evaluation**, 474 schools / 16 states / grades 3-5 — the report's copyright page reads "**This report was prepared under contract C-16595 from The MIND Research Institute**" ([PDF](https://rp.stmath.com/assets/pdfs/sxgofjub2d.pdf)).
- **SRI's review of that study** was **also commissioned by MIND**, and concluded **moderate evidence (ESSA Tier 2)**, meeting WWC v4.0 standards **with reservations**, **effect size +0.13 on scale scores / +0.17 on percent proficient** ([SRI publication page](https://www.sri.com/publication/education-learning-pubs/stem-and-computer-science-pubs/st-math-nonregulatory-essa-standards-evidence-review-what-works-clearinghouse-standards-review/)).
- **WestEd (2014) California evaluation** — "**The MIND Research Institute contracted with … WestEd**" ([ERIC ED559645](https://eric.ed.gov/?id=ED559645)).
- **WestEd (2013) LAUSD evaluation** — described *on MIND's own portal* as **"mixed grade-level findings"** with noted design/implementation limitations.

**Two negatives to record:** there is **no WWC intervention report for ST Math**, and **MIND markets "ESSA Tier 1"** on [its program page](https://www.mindeducation.org/programs/st-math/) while its own commissioned SRI review determined **Tier 2 / moderate**. To MIND's credit, its [research portal](https://rp.stmath.com/pages/publications.html) publishes full text of 19 studies including unflattering ones — more transparent than any other vendor here.

### 1.5 Khan Academy Kids — the right age, zero math evidence

Built by Khan Academy (501(c)(3)) "in collaboration with learning experts at **Stanford**" / the Stanford Graduate School of Education ([khanacademy.org/kids](https://www.khanacademy.org/kids)). Curriculum aligns to the **Head Start Early Learning Outcomes Framework** and **Common Core**, with sequencing "based on research on how children develop early literacy and math skills" (same page).

**Core loop.** Five animated guides — **Kodi the Bear, Ollo the Elephant, Reya the Red Panda, Peck the Hummingbird, Sandy the Dingo** — walk the child through short activities mixing books, games, and videos; 5,000+ activities; content partners include National Geographic and Super Simple Songs ([App Store](https://apps.apple.com/us/app/khan-academy-kids/id1378467217)).

**Progression.** A **Learning Path** that "adjusts automatically to each child's age and performance, so a 3-year-old and a 7-year-old have genuinely different experiences" ([Khan Academy blog](https://blog.khanacademy.org/best-early-learning-apps-for-kids/)). **No published algorithm class, no spaced repetition, no fluency timers, no mastery thresholds, no currency.**

**Ages 2-8 (PreK-2nd)** — the best nominal age fit of any product here, and the only one designed *primarily* for this band. Khan does **not** publish a K-1 math scope and sequence (**UNVERIFIED**).

**Platforms:** iOS, Android, Amazon Appstore; **core features work offline**. Student-side is **app-only**.

**Pricing: completely free — no ads, no subscriptions, no IAP**, COPPA-compliant. The sharpest possible contrast with Prodigy.

**Efficacy: literacy only.** Arnold, D.H., et al. (2021), *Journal of Children and Media* — a peer-reviewed RCT with 49 low-income preschoolers over 10 weeks, ~13 min/day; overall emergent literacy rose from the 34th to 47th percentile and phonological awareness from the 23rd to 47th on the TOPEL ([Khan summary](https://blog.khanacademy.org/khan-academy-kids-improves-pre-literacy-skills-in-preschoolers-research-confirms/)). **It measured literacy only. There is no math efficacy study of any design, and no WWC entry.**

**Open source:** Khan maintains 474 public repos ([github.com/Khan](https://github.com/Khan)), mostly MIT — but **nothing for Kids**, and no public API for it.

### 1.6 Reflex (ExploreLearning) — the best-designed fluency loop, but grades 2+

**Who.** ExploreLearning, a **Cambium Learning Group** brand ([about](https://www.explorelearning.com/about)). The foundational design document is **Paul Cholmsky, *ExploreLearning Reflex: From Acquisition to Automaticity*, March 2011** ([white paper PDF](https://reflex.explorelearning.com/user_area/content_media/raw/Reflex-White-Paper.pdf) — authorship/date confirmed from the PDF; body text resists extraction, so its detailed algorithm claims are **UNVERIFIED**).

**Pedagogy — three pillars**, quoted from [The Research Behind Reflex](https://reflex.explorelearning.com/research/research-behind-reflex):

1. **Fact families** — "based on a **fact family approach** that builds on and reinforces important mathematical concepts such as the commutative property and the relationship between the operations… when students understand the conceptual connections between facts, their progress to automaticity is accelerated."
2. **Adaptive individualization** — it "**rewards students for both their effort and progress toward automaticity**." *(Effort as well as outcome. This is the key reward-design idea.)*
3. **Fluency-based games** — rather than quiz games, Reflex "requires students to engage in **increasingly complex and fast-paced decision-making**," so that "once students answer facts fluently *while achieving game objectives*, you can be confident they are ready."

**Core loop per session** ([Explore Reflex](https://reflex.explorelearning.com/about/explore-reflex); [Unlock Reflex Games](https://reflex.explorelearning.com/resources/insights/unlock-reflex-games)):

1. **Crabby's Fact Fair** — carnival warm-up on previously learned facts that also measures current fluency.
2. **Coach Penny** — just-in-time direct instruction on new facts, taught in fact families.
3. **Fluency practice** — student picks from fast-paced games on **Reflex Island**. Two unlocked at launch (*Ninja to the Stars*, *Wind Rider*); eight more unlock over time.
4. **The Green Light** — "Once a student answers a certain number of facts correctly on a given day, a **Green Light illuminates in the upper right corner of the screen**." This is the daily completion signal and the habit core.

**Reward layer.** **Streak → unlock:** "Students can unlock a new Reflex game of their choice after earning the Green Light for a **consecutive number of days**," with an on-screen tracker. **Tokens** earned "for effort and progress" are spent in the Reflex Store on **avatar accessories and Progress Tree decorations** — cosmetic only. A **Progress Tree** persistently visualizes accumulated fluency. Class **Competitions** exist as an opt-in.

**Two important unpublished numbers:** the **Green Light threshold** (facts correct per day) and the **response-time cut-off** that scores a fact as "fluent" are **not published anywhere I could find — UNVERIFIED**, despite automaticity being the whole product thesis.

**Grade 1 fit — the key finding.** Reflex is **"grades 2+"** ([reflex.explorelearning.com](https://reflex.explorelearning.com/)); the home version's own guidance starts at **grades 2-3** for addition/subtraction ([Time4MathFacts](https://www.time4mathfacts.com/reflex/)). **Reflex is not designed for grade 1.** Sibling **Frax is grades 3-5** ([frax.explorelearning.com](https://frax.explorelearning.com/)). For us it is a *reference design for fluency mechanics*, not a competitor.

**Pricing.** Home **$54.95 per student per year** via Time4MathFacts ([link](https://www.time4mathfacts.com/reflex/)); school pricing quote-only.

**Efficacy — weakest tied with Prodigy.** **Zero ERIC-indexed studies** (I queried the federal ERIC API for `"ExploreLearning Reflex"` and for `"math fact fluency" AND "Reflex"` — both returned 0). No WWC entry, no ESSA Tier 1/2 claim for Reflex itself; only a **Digital Promise (Tier 3)** mark. The vendor [impact page](https://reflex.explorelearning.com/research/the-impact-of-reflex-on-student-achievement) lists ~20 mostly correlational vendor studies, most without sample sizes or SD-unit effect sizes.

### 1.7 IXL Math — the most legible mastery model in the market

**Who.** Founded **1998** by **Paul Mishkin** as Quia Web; IXL math launched **2007** (K and Grade 1), full K-5 by 2008 ([IXL Company Milestones PDF](https://www.ixl.com/assets/company/IXL-Company-Milestones.pdf)). Now a serial acquirer: ABCya (2018), Education.com (2019), Vocabulary.com (2020), Rosetta Stone (2021), Wyzant (2021), SpanishDict (2022), Emmersion (2022), Teachers Pay Teachers (2023).

**Pedagogy — the most explicit of any product here.** IXL's own [**Design Principles: Core Features Grounded in Learning Science Research**](https://www.ixl.com/research/IXL_Design_Principles.pdf) (Bashkov, Mattison & Hochstein, March 2021) grounds the product in Bloom's Taxonomy and Webb's Depth of Knowledge for skill sequencing; cardinality/subitizing/**concreteness fading** for early numeracy; **retrieval practice**; **Bandura self-efficacy** and **Dweck growth mindset** for SmartScore; **Vygotsky's ZPD** for teacher analytics; and **Eccles' Expectancy-Value Theory** for rewards. Whether IXL actually delivers on these is a separate question, but as a *design rationale document* it is the best public artifact in the category and worth reading in full.

**SmartScore — exact mechanics**, from IXL's own [SmartScore Guide PDF](https://www.ixl.com/materials/SmartScore_Guide.pdf):

- **0-100 per skill. It is NOT percent-correct** — reaching 100 stays mathematically possible regardless of prior mistakes.
- **Starts at 0** when a skill is begun.
- **0-80 "Learning and Practicing":** large gains for correct answers, **small** penalties for wrong ones — deliberately front-loaded to build early self-efficacy.
- **80 = proficiency.** 80-90 "Achieving Proficiency": questions get harder, gains slow. IXL "often recommends 80 or 90 as a good goal."
- **90 = "Excellence"**, entering the **Challenge Zone (90-100)**: correct answers add only **+1 to +2**; wrong answers cost **−3 to −8**. A student typically needs **as many as 10 correct in a row** to reach 100.
- **100 = mastery.** Most skills require a **minimum of 28 questions** to reach 100.
- **No time-based decay.** Nothing in IXL's materials describes decay from inactivity; a student can "take a brain break."

**Real-Time Diagnostic** ([Design Principles](https://www.ixl.com/research/IXL_Design_Principles.pdf); [National Norms report](https://www.ixl.com/materials/us/research/National_Norms_for_IXL_s_Diagnostic_in_Grades_K-12.pdf)): an adaptive interim assessment built on **Item Response Theory (Lord, 1980)**, drawing on both dedicated diagnostic items and ordinary practice responses — hence "real-time." **~45 minutes per subject** initially, then "just a handful" of questions per week. Outputs an overall grade-level score plus math strand scores on a **0-1300 scale** mapped to grade level (0-50 = Pre-K, 50-100 = Kindergarten, 350 ≈ 50% of 3rd-grade material acquired, up to 1300 = end of 12th), feeding granular "MicroSkill" recommendations.

**Reward layer is deliberately minimal:** virtual awards/badges at proficiency and usage milestones, plus **teacher-configurable leaderboards**. **No avatars, no pets, no currency shop.**

**Pricing** (live from the pricing JSON at [ixl.com/membership/family/subscribe](https://www.ixl.com/membership/family/subscribe)):

| Package | Monthly | Annual |
|---|---|---|
| Single subject | $9.95 | $79 |
| Combo (Math + LA) | $15.95 | $129 |
| All Access (4 subjects) | $19.95 | $159 |
| Spanish add-on | +$5.00 | +$40 |
| Additional child | +$4.00 | +$40 |

**Efficacy — note the caveat.** IXL maintains a large library at `ixl.com/research`, but **every study located is vendor-authored** by IXL-affiliated researchers as internal validation/technical reports, **not peer-reviewed journal articles** — e.g. [*National Norms for the IXL Flex Diagnostic in Grades K-12*](https://www.ixl.com/materials/us/research/National_Norms_for_IXL_s_Diagnostic_in_Grades_K-12.pdf) (Zhao & Mayne, Aug 2025; 734,064 students, 2,690 schools, 48 states) and [predictive-validity studies against state summatives](https://www.ixl.com/research/IXL-Real-Time-Diagnostic-Validation-Studies-Marginalized-Students.pdf). The Design Principles paper cites ~50 external academic sources, but the connective "therefore IXL works" claims are IXL's own. **No independent peer-reviewed K-5 efficacy study of IXL was located; no WWC entry.**

### 1.8 SplashLearn

Built by **StudyPad, Inc.** (Gurgaon + San Francisco); founders per their own [careers page](https://www.splashlearn.com/careers): **Arpit Jain** (CEO), **Umang Jain**, **Mayank Jain**, **Joy Deep Nath**, all IIT Kharagpur alumni. **Founding year is UNVERIFIED on their own site.** Vendor-stated scale: 40-60M learners, 750K+ teachers, 180K+ schools ([efficacy page](https://www.splashlearn.com/efficacy)).

**Pedagogy is notably thin** relative to IXL — positioned as "a highly engaging, and personalized program" that makes learning "feel like play" ([about](https://www.splashlearn.com/about)). Grade-1 pages do name concrete strategies (count-on, count-back, **make-a-10**) and claim design around clearing "common misconceptions" ([Grade 1 games](https://www.splashlearn.com/math-games-for-1st-graders)). **No learning-science white paper exists**; `/how-it-works` and `/approach` both 404.

**Core loop:** themed learning worlds, short drag-and-drop / tap-to-identify / story activities with characters Eddie, Hoppy and Blu; **coins, rewards, and unlockable characters** ([App Store](https://apps.apple.com/us/app/splashlearn-kids-learning-app/id672658828)). **No SmartScore equivalent, no documented fluency timer, no documented spaced review — UNVERIFIED.**

**Grade 1 catalogue** ([source](https://www.splashlearn.com/math-games-for-1st-graders)): Number Sense (78 games), Addition (219), Subtraction (87), Geometry, Data Handling, Measurement, Time, Money, patterns, word problems.

**Pricing** (from Apple's listing): **$7.99-$11.99/month; $69.99-$89.99/year**. Teacher/school pricing **UNVERIFIED** (vendor pricing pages return Cloudflare 403).

**Efficacy:** **ESSA Level III ("Promising")**, from a correlational study by Instructure + the International Centre for EdTech Impact on de-identified K-5 data from a North Carolina district, funded by the Jacobs Foundation ([SplashLearn blog](https://www.splashlearn.com/blog/splashlearn-achieves-essa-level-three-certification/)). **Vendor-commissioned and vendor-published; no journal publication found.**

### 1.9 Math Playground — the pure-play free games site

Run by **Math Playground, LLC** (Massachusetts), launched **2002**, grown out of a physical learning center "filled with number games, math puzzles, and problem-solving challenges" ([About](https://www.mathplayground.com/about.html); [Terms](https://www.mathplayground.com/terms_of_service.html)). **No founder is named anywhere on the site — UNVERIFIED.**

**Pedagogy: "Purposeful Play. Powerful Learning."** Play is the learning mechanism, not the reward: "Visual models, interactive manipulatives, and story-based challenges help children understand *how* math works, not just how to get an answer" ([About](https://www.mathplayground.com/about.html)).

**Progression & mastery: there is none.** No badges, XP, coins, avatars, adaptive difficulty, mastery gates, or spaced review are described anywhere. The About page speaks only of "intrinsic motivation through playful engagement." **The sharpest contrast in the whole set** — and a useful existence proof that a free games site can survive 24 years with zero reward economy.

**Pricing** ([subscribe](https://www.mathplayground.com/subscribe)): free ad-supported tier; Family $7/mo or $42/yr; Focused Family $48/yr; Classroom $10/mo or $60/yr; PLUS $72/yr; school/district custom. Logins are **class-level ("Simple Login," no individual student accounts)** as a privacy measure. kidSAFE-certified, single ad partner (AdMetricsPro), **contextual (non-behavioral) ads only** ([Data Security and Privacy Plan](https://www.mathplayground.com/data_security_and_privacy_plan.html)).

**Licensing — important.** Explicitly **not** licensable or embeddable: "You may not download, copy, reproduce, change, transmit, record, distribute or create derivative works of our content without written permission," and content "may only be shown on domains owned by Math Playground, LLC… either directly or through the use of iFrames" ([ToS](https://www.mathplayground.com/terms_of_service.html)). That same ToS phrase — "our **proprietary and/or licensed** content" — plus its reference to "game licenses" as an ad-funded expense confirms the catalogue is **a mix of in-house and third-party licensed games**. **This rules out the obvious "aggregate free web games" strategy.** No efficacy research, no API, not open source.

### 1.10 Numberock — music as the retrieval hook

Founder **Benjamin Hehn**, a former public-school teacher (7 years, 4 as instructional lead), Master's from UMass, math-education study at Tufts ([About Us](https://numberock.com/about-us/)). Entity NUMBEROCK LLC; appears to be a small/solo operation. **Founding year UNVERIFIED.**

**Pedagogy:** music as the memory hook — "the perfect blend of pure fun and emotional engagement, while never sacrificing the educational merit of the lesson," creating a "multi-sensory learning environment" (same page).

**Core loop:** watch a 2-4 minute animated math song tied to one skill, then (paid tier) work the matching worksheet / lyric fill-in / game / quiz. **No adaptive engine, no XP, no avatars** — it is a teacher-directed worksheet/quiz loop with 55 double-sided worksheets, 55 lyric sheets, 50+ printable anchor charts, and 50 printable games ([example lesson](https://numberock.com/lessons/us-coins/)).

**Standards alignment is explicit** — lesson pages carry both **Common Core** and **Texas TEKS** codes (the Counting Coins lesson tags CCSS **2.MD.8** and TEKS **3.4C**) (same page). The **Grade-1-specific lesson list is UNVERIFIED** (`/lessons/` and grade-filter URLs 403/404 to automated fetch).

**Pricing:** 30-day free trial then **$4.95/month** ([sign-up](https://numberock.com/sign-up/)); school-wide annual **$499.95/year** with district discounts ([district pricing FAQ](https://numberock.com/faq/offer-district-pricing/)) — school figure came via a search snippet, **needs reverification**. Free **YouTube** channel with ~150 K-5 videos, ~670K subscribers, ~238M views ([channel](https://www.youtube.com/channel/UCt9SZgFExNwWTH5T_JnyF-A/videos)). **No efficacy research, no API, not open source.**

### 1.11 Numberblocks — the best-loved early-numeracy content, with no efficacy research

**Provenance, verified:** "Numberblocks is an innovative animated series created by **BBC Children's Productions and Alphablocks Ltd**… Since its launch in **2017**, Numberblocks has become a global phenomenon, airing on CBeebies in the UK and Netflix worldwide" ([Blue Zoo Animation Studio project page](https://www.blue-zoo.co.uk/projects/numberblocks/)). The official [Blocks Universe](https://www.blocksuniverse.tv/numberblocks/home) site is © 2026 Alphablocks Ltd. **BAFTA Children's Award for Best Pre-School Animation (2019)**; Prix Jeunesse and Japan Prize nominations. 90 episodes; still in production.

**The curriculum consultant question.** Blocks Universe states each episode "has been carefully crafted with the help of the **NCETM (National Centre for Excellence in the Teaching of Mathematics)**… to make sure Numberblocks delivers the essential numeracy skills that build good number sense," and notes inclusion among the DfE's recommended home-learning resources ([Blocks Universe](https://www.blocksuniverse.tv/numberblocks/home)). Blue Zoo separately says "Working closely with education experts, we ensured each episode's storyline and visuals aligned with early years mathematics curricula."

**The named individual consultant is Dr. Rebecca Hanson — PARTIALLY VERIFIED.** She is identified as "mathematics consultant for CBeebies @numberblocks" in a LinkedIn post by **Debbie Morgan, NCETM's Director for Primary**, and in [Numeracy Teachers Academy](https://www.numeracyteachersacademy.com/blog/numberblocks). **No first-party BBC or Blue Zoo page names her**; [NCETM's own Numberblocks page](https://www.ncetm.org.uk/classroom-resources/ey-numberblocks-support-materials/) credits the institution, not an individual. Treat as corroborated-but-not-first-party.

NCETM's actual role is producing free classroom **support materials** — Practitioner Notes, "Talk and Discuss Together" slides, "Enabling Environments," and **"Learning Together in Year 1"** slides "designed to be used within the context of whole class teaching for mastery" (same NCETM page). **These are curriculum materials, not efficacy research.**

**Research: none found.** No independent published study or formal evaluation of Numberblocks' learning outcomes exists from BBC, NCETM, Blue Zoo, or Learning Resources. **UNVERIFIED / likely does not exist publicly.** This is remarkable given its reach and is worth noting: *the most beloved early-numeracy media property in the English-speaking world has no published efficacy evidence.*

**Apps** (publisher on all three is **Blue-Zoo Productions Ltd**, *not* Learning Resources, which sells only the physical cubes):

| App | Price | Content |
|---|---|---|
| [Meet the Numberblocks!](https://apps.apple.com/us/app/meet-the-numberblocks/id1445555400) | Free, no IAP | Counting 1-20 by tapping "Numberblobs" |
| [Numberblocks: Hide and Seek](https://apps.apple.com/us/app/numberblocks-hide-and-seek/id1328950963) | $2.99 | Addition, **number bonds to 10**; ramping difficulty; **20 collectible "playthings"** as unlocks |
| [Numberblocks World](https://apps.apple.com/us/app/numberblocks-world/id1520827387) | Free + **$7.99/mo or $29.99/yr** | Full 90-episode library across **5 levels**, 3 **subitising** games, counting game (1s/2s/5s/10s), quiz; "created together with experts from the NCETM"; 5M+ downloads, "Teacher Approved" on [Google Play](https://play.google.com/store/apps/details?id=tv.alphablocks.numberblocksworld&hl=en_US) |

**The one mastery mechanic worth stealing:** Numberblocks World has a **quiz gate hosted by "Numberblock 6"** that tells a child "whether they need to go back over the previous videos or whether they're ready to progress" ([App Store](https://apps.apple.com/us/app/numberblocks-world/id1520827387)) — a mastery gate delivered *in character*, by a friend, rather than as a score.

**Physical tie-in:** Learning Resources **MathLink Cubes** via [hand2mind](https://www.hand2mind.com/numberblocks) — Numberblocks 1-10 Activity Set $27.99; 11-20 $37.99; 21-30 $47.99; Sheep Farm $21.99. **Grade 1 fit is excellent:** Early Years through **UK Year 1** (age 4-7) — counting, number recognition, subitising, number bonds, addition.

### 1.12 Bedtime Math — the strongest evidence in this entire document

**Who.** Founded by **Laura Overdeck** (Princeton astrophysics, Wharton MBA); launched **2012**; legal entity **Bedtime Math Foundation**, a 501(c)(3), EIN 26-2335161 ([Our Team](https://bedtimemath.org/our-team/); [homepage](https://bedtimemath.org/)).

**Conflict of interest — flag it every time.** Laura Overdeck is also co-founder of the **Overdeck Family Foundation** (created 2011 with husband John Overdeck, co-founder of Two Sigma; ~$356M+ disbursed) ([Overdeck Family Foundation bio](https://overdeck.org/about/people/laura-overdeck/)). **That foundation funded the flagship *Science* study of her own nonprofit's app.**

**Pedagogy.** "We help kids love math so they embrace and excel at it," via "wacky word problems" and casual parent-child math talk — explicitly informal, low-pressure, not drill.

**Core loop.** One **Daily Math** post: a short story plus **tiered questions — "Wee Ones" → "Little Kids" → "Big Kids"** (plus "The Sky's the Limit" in the app). Parent and child read together; the parent picks the tier. 1,000+ problems searchable by skill ([App Store](https://apps.apple.com/us/app/bedtime-math/id637910701)). **No adaptive algorithm, no mastery gates, no XP/coins/avatars.** Not standards-tagged — a deliberate choice. Free on iOS, Android and web.

**The study:**

> **Berkowitz, T., Schaeffer, M. W., Maloney, E. A., Peterson, L., Gregor, C., Levine, S. C., & Beilock, S. L. (2015). "Math at home adds up to achievement in school." *Science*, 350(6257), 196-198.** DOI [10.1126/science.aac7427](https://doi.org/10.1126/science.aac7427). Metadata cross-checked via [Crossref](https://api.crossref.org/works/10.1126/science.aac7427) and the [Science page](https://www.science.org/doi/abs/10.1126/science.aac7427).

- **Design:** randomized field experiment, **587 first-grade families** (our exact grade), Chicago-area schools. Treatment families got an iPad with the **Bedtime Math app**; controls got a reading app.
- **Key effect:** math achievement gains over the school year were **most pronounced among children of highly math-anxious parents** — the app effectively neutralized the intergenerational transmission of parental math anxiety ([UChicago News](https://news.uchicago.edu/story/kids-benefit-when-parents-overcome-math-anxiety)).
- **Funding:** an **Overdeck Family Foundation** grant to Levine and Beilock at the University of Chicago. Disclose this whenever citing it.
- **Published pushback:** a Comment ([10.1126/science.aad8008](https://www.science.org/doi/10.1126/science.aad8008)) and an authors' Response ([10.1126/science.aad8555](https://www.science.org/doi/10.1126/science.aad8555)) appeared in *Science*, indicating statistical critique.

**Durability follow-up:**

> **Schaeffer, M. W., Rozek, C. S., Berkowitz, T., Levine, S. C., & Beilock, S. L. (2018). "Disassociating the relation between parents' math anxiety and children's math achievement: Long-term effects of a math app intervention." *Journal of Experimental Psychology: General*, 147(12), 1782-1790.** DOI [10.1037/xge0000490](https://doi.org/10.1037/xge0000490).

Same cohort followed to **third grade**. Gains **persisted ~2 years later despite decreased app usage**, ≈ **"three additional months" of math skill**. The title signals the mediator was children's changed attitudes about their own math ability, not a lasting drop in parental anxiety. Funding disclosure for this second paper **UNVERIFIED**.

**Crazy 8s** after-school kits: **$180 for one kit or $360 for both** ([kit preview PDF](https://crazy8s.bedtimemath.org/Images/Crazy8s-Kit-Preview.pdf); [Crazy 8s Club](https://crazy8sclub.org/how-it-works/)); ~140,000 children across ~10,000 clubs. A Johns Hopkins study reporting reduced math anxiety after 8 weeks (most notably K-2) is cited only in a [Bedtime Math press release](https://www.prnewswire.com/news-releases/bedtime-maths-crazy-8s-club-reduces-kids-math-anxiety-according-to-johns-hopkins-university-300620082.html) — underlying paper **UNVERIFIED**.

**The design lesson is enormous and cheap:** the highest-quality first-grade math intervention on record is *a parent and a child reading one silly word problem together at bedtime*. No adaptivity, no reward economy, no mastery model.

### 1.13 Motion Math — defunct as a brand, absorbed into i-Ready

Founded **August 2010** in San Francisco by **Gabriel Adauto and Jacob Klein**, who built the original fractions game as their culminating project in **Stanford GSE's Learning, Design & Technology** master's program ([Curriculum Associates press release, Nov 2017](https://www.curriculumassociates.com/about/press-releases/2017/11/ca-acquires-motion-math-enhance-engagement-strengthen-conceptual-understanding-k-6-students)). **Acquired by Curriculum Associates on 8 November 2017.**

**The consumer brand is shut down.** CA's own (now-retired) notice: *"Motion Math's games are now available as i-Ready Learning Games… The games are no longer available for purchase by parents or as a standalone game suite"* ([archived CA page, July 2020](https://web.archive.org/web/20200721034945/https://www.curriculumassociates.com/products/i-ready/i-ready-learning/motionmath-shutdown)). Verified today: **motionmathgames.com no longer resolves**; the original Hungry Fish App Store listing returns "page can't be found"; an iTunes Search API query for "motion math games" returns **zero** results. **Wings, Questimate!, and Fractions! were retired entirely.**

**Current form.** [i-Ready Learning Games](https://www.curriculumassociates.com/programs/i-ready-learning/learning-games) still ships **Bounce, Cloud Machine, Cupcake, Hungry Fish, Hungry Guppy, Match, Pizza, Zoom** — embedded only in i-Ready.

**Grade-1-relevant loops:** *Hungry Fish* — combine floating integer bubbles to feed a fish a target number, reinforcing "multiple ways to compose and decompose a number." *Zoom* — pan/zoom an interactive number line to place missing values, with animals marking orders of magnitude. *Hungry Guppy* — identify small quantities, add sets of shapes, recognize numerals to 6 (same page).

**Pedagogy claimed:** **growth mindset**, "500+ adaptive levels" ([2017 release](https://www.curriculumassociates.com/about/press-releases/2017/11/ca-acquires-motion-math-enhance-engagement-strengthen-conceptual-understanding-k-6-students)); "internal motivation while encouraging **productive struggle**," building "**visual mental models**" ([2019 release](https://www.curriculumassociates.com/about/press-releases/2019/08/ca-adds-learning-games-help-students-practice-master-mathematical-concepts)). Adaptive difficulty is now gated on the **i-Ready Diagnostic**; recommended dosage **~20 min/week**. *Pizza* uses "adaptive timing… for appropriately challenging fluency practice."

**Efficacy:**

> **Riconscente, M. M. (2013). "Results From a Controlled Study of the iPad Fractions Game Motion Math." *Games and Culture*, 8(4), 186-214.** DOI [10.1177/1555412013496894](https://doi.org/10.1177/1555412013496894) ([SAGE](https://journals.sagepub.com/doi/10.1177/1555412013496894)).

Experimental repeated-measures crossover, **fourth graders, N = 122**, 20 min/day for 5 consecutive days. Versus control: fractions test scores **+>15%**, fractions **self-efficacy +10%**, **liking of fractions +10%** — all statistically significant. **Note:** the author's affiliation is **USC Rossier and the New York Hall of Science, not Stanford** — Stanford is where the founders trained, not where the study ran. A separate peer-reviewed *Hungry Fish* study **could not be verified — UNVERIFIED**.

### 1.14 Todo Math (Enuma) — built for learning differences, and an XPRIZE winner

Founded **2012 as Locomotive Labs** in Berkeley; **rebranded to Enuma, Inc. in 2015** ([About Us](https://enuma.com/en/aboutUs/)). Founders **Sooinn Lee** (CEO, former game designer) and **Gunho Lee** (Chief Engineer, ex-NCSOFT, UC Berkeley CS PhD). Todo Math launched **2013**; ~120+ employees across California, Seoul, Tokyo, Beijing, Jakarta; App Store version updated within the last few days.

**Mission and pedagogy:** "create the best digital products that enable all children to learn independently, **even if they have a learning difference**," applying "**AI and Universal Design for Learning**" ([About Us](https://enuma.com/en/aboutUs/); [enuma.com](https://enuma.com/en/)). *(The widely-reported founding motivation — the founders' own child with special needs — is **UNVERIFIED on a primary source**.)*

**XPRIZE — verified primary.** Enuma's **Kitkit School co-won the $15M Global Learning XPRIZE in 2019** (with onebillion), and XPRIZE's own page states Kitkit "achieved the highest learning gains in the prize." The prize ran a **randomized controlled trial in rural Tanzania — 2,500 tablets, 141 villages** ([XPRIZE](https://www.xprize.org/prizes/global-learning)). This is the strongest efficacy signal for the Enuma *engine*, though for Kitkit School rather than Todo Math specifically. **No Todo-Math-specific published study was found — UNVERIFIED.**

**Core loop:** structured modes rather than open browse — **Daily Adventure** (a mapped level path), **Free Choice**, **AI Practice**, and a **Logical Thinking / "Brain Power"** mode; **8 proficiency levels** from preschool through basic 3rd grade; 2,000+ activities ([App Store](https://apps.apple.com/us/app/todo-math/id666465255)).

**Accessibility features worth copying wholesale:** left-handed mode, **dyslexic font option**, help button, handwriting recognizer in select activities, 8 languages, **fully playable offline**, **no third-party advertising**, COPPA-compliant ([App Store info panel](https://apps.apple.com/us/app/todo-math/id666465255?platform=ipad)).

**Pricing:** free download + subscription IAP; Apple lists **One Year: $49.99 / $69.99 / $79.99 / $89.99 / $99.99** (regional/promo tiers) and **Two Years: $119.99**. Free trial with "no credit card information collected." A school edition and LMS exist; **school pricing UNVERIFIED**.

### 1.15 Osmo — physical manipulatives read by the tablet camera

**Tangible Play, Inc.**, founded **2013** by **Pramod Sharma** (CEO) and **Jerome Scholler** (CTO), both ex-Google. **Acquired by BYJU'S for $120M, announced 16 January 2019** ([BYJU'S press release](https://www.webwire.com/ViewPressRel.asp?aId=234341)). **Still selling** — [playosmo.com](https://www.playosmo.com/) is live and transacting, though **BYJU'S is not mentioned anywhere on the site**; the footer asserts only Tangible Play trademarks.

**The hardware trick.** The iPad sits in a weighted **Osmo Base** and a **red reflector clips over the front camera**, bending its field of view **downward onto the table**. Osmo "scans the table and your child's creations come alive on the screen" — **physical tiles are the input device** ([FAQ](https://www.playosmo.com/en-US/faq/)). No WiFi or subscription needed to play.

**Pedagogy.** "Learning through play" — experimentation, exploration, creation, collaboration ([why-osmo](https://www.playosmo.com/en-US/why-osmo/)). **Numbers is explicitly designed with no time pressure**: a "stress-free environment" where children "learn through experimentation" with **no fear of wrong answers**, demonstrating that there are "multiple good ways to solve a problem" ([Genius Numbers](https://www.playosmo.com/products/genius-number)). Math Wizard is "research-based and curriculum-based," designed with an in-house advisor holding a master's in early childhood education.

**Core loops.** *Numbers:* lay physical dot/digit tiles to make a target number; correct combinations pop bubbles and release fish; **100+ fish to collect** across real-world regions ([App Store](https://apps.apple.com/us/app/osmo-numbers/id1531762562)). *Math Wizard:* progress through **Mathemagica**, completing quests; earn **crystals** that unlock **pets, foods and toys in Sky Castle** ([App Store](https://apps.apple.com/us/app/osmo-math-wizard/id1470095030)).

**Grade 1 fit — Math Wizard is the strongest hardware fit here.** Explicitly **"Ages 6-8 / 1st & 2nd graders"** ([Math Wizard Series](https://www.playosmo.com/products/math-wizard-series)), covering addition and subtraction **within 120**, place value and counting, measurement (non-standard **and** ruler), geometry and shapes, intro algebraic thinking, multiplication foundations.

**Pricing** (current, from playosmo.com): Osmo Base $39-$49; [Genius Numbers](https://www.playosmo.com/products/genius-number) **$24.99**; [Genius Starter Kit 5-game](https://www.playosmo.com/products/genius-starter-kit) **$57.99**; 7-game **$65.99**; each **Math Wizard** title **$39** ($59 with base) — [Magical Workshop](https://www.playosmo.com/products/math-wizard-magical-workshop) (28 counting cubes, 6 counting rods), [Enchanted World](https://www.playosmo.com/products/math-wizard-and-the-enchanted-world-games) (22 fruit/veg pieces), [Secrets of the Dragons](https://www.playosmo.com/products/math-wizard-and-the-secrets-of-the-dragons) (**2 rulers**, 62 food tokens). **Apps are free; the hardware is the purchase — no subscription.** Bundle discounts 5% for 2 games, 10% for 3+.

**Caveats.** Math Wizard **excludes Fire tablets and iPads after 2022**, and its last app update was **17 October 2024** — a possible sign of reduced investment. **No research or efficacy evidence is published anywhere on playosmo.com** (I checked [schools/research](https://www.playosmo.com/en-US/schools/research/) and [why-osmo](https://www.playosmo.com/en-US/why-osmo/)); the only outcome claims are parent-survey marketing figures with no published methodology.

### 1.16 Boddle Learning and Matific

**Boddle Learning.** Founded **2018** by **Clarence Tan** (game designer) and **Edna Martinson** — a married couple who immigrated from Singapore and Ghana respectively; early funding included **$100K+ from the AT&T Aspire Accelerator (2019)** ([Boddle's own blog](https://www.boddlelearning.com/article/2020-startups-to-watch-boddle)). Pedagogy is thin — three principles of Engagement, Effectiveness, Transformation ([About](https://www.boddlelearning.com/about)). **New students automatically get a placement test "that look[s] like regular gameplay"** ([support](https://www.boddlelearning.com/support-categories/student-classroom)) — a nice pattern: *diagnostic disguised as play*. Its reward economy is the most elaborate in this set (see §5). **Free tier is substantial and it is free for teachers and schools**; Premium **$9.99/month or ~$4.08/month billed annually** ([Premium](https://www.boddlelearning.com/premium)). Efficacy: **ESSA Level III**, from a 2024-25 Instructure study of **83 third-graders** in one Alabama district, correlational, vendor-published ([article](https://www.boddlelearning.com/article/boddle-essa-study-math-confidence), [report PDF](https://drive.google.com/file/d/1JCswNl-TNit1uvnGc-uBoZR8z9qyel6k/view?usp=sharing)).

**Matific.** Operated by **Slate Science Inc** and owned by Slate Science Technologies Pty Ltd (Sydney); US distribution via **Heinemann** ([Terms](https://www.matific.com/us/en-us/home/terms/); [matific.com](https://www.matific.com/us/en-us/home/)). Five stated principles: Conceptual Understanding, Critical Thinking, Meaningful Context, Personalized Learning, **Intrinsic Engagement**. Three modes: **Adaptive Adventure** (an algorithm-led "Adventure Island" path), **Training Zone** (student-chosen topic), **Multiplayer Arena** (competitive play against global peers) ([parents page](https://www.matific.com/us/en-us/home/parents/)). **Matific does not publish dollar figures** — **UNVERIFIED**. Its [Research and Efficacy page](https://www.matific.com/us/en-us/home/why-matific/research-and-efficacy/) lists nine studies, **all hosted as PDFs on Matific's own servers with no disclosure of commissioning or funding** — treat all as vendor-published. Headline claims include +34% test scores (Western Sydney University), "three months of extra learning" (SEG Measurement), and effect sizes **0.33-0.76 SD** in a 2,700-student Uruguay pilot (Education Commission Asia).

> **Reading the "ESSA Tier" badges.** Products in this category advertise ESSA tiers heavily, and the tiers are not equivalent. Per the WWC's own ESSA page, **Tier 1 (Strong)** requires an RCT that "Meets WWC Standards **Without Reservations**" with statistically significant positive effects, **≥350 students and ≥2 sites**; **Tier 2 (Moderate)** accepts a strong quasi-experimental design with baseline-similar comparison groups, or an RCT meeting standards *with* reservations ([WWC ESSA page](https://ies.ed.gov/ncee/wwc/essa)). Tiers 3 (Promising, correlational with statistical controls) and 4 (Demonstrates a Rationale, essentially a logic model plus a plan to evaluate) are **paraphrased here — the WWC page I could fetch covered only Tiers 1-2 — UNVERIFIED**. Independent tier determinations come from bodies like [Evidence for ESSA](https://www.evidenceforessa.org/what-is-essa/), run by the Center for Research and Reform in Education at Johns Hopkins; a **self-claimed** tier badge on a vendor page (Prodigy, ST Math) is not the same thing.

### 1.17 What this survey establishes

1. **Only two products have age-6-7-specific evidence.** DreamBox's entire WWC record rests on a **K-1** RCT, and Foster's 2024 K-1 replication is again K-1. Bedtime Math's *Science* RCT is on **first-grade families**. Everything else — Zearn's RAND trial, ST Math's RCT and QEDs, Reflex, Frax, Motion Math — is grades 3-5. Khan Academy Kids is the right *age* with **no math evidence at all**.
2. **Effect sizes across the category cluster at +0.03 to +0.20 SD, and the most rigorous designs produce the smallest numbers.** DreamBox +0.10 avg; Zearn +0.07 (null) confirmatory and +0.03 peer-reviewed; ST Math negligible in the only independent RCT versus +0.13/+0.17 in the vendor-commissioned QED. **Any product claim above ~0.3 SD in this category deserves scrutiny of who paid for the study.**
3. **Vendor funding is the norm and is often only discoverable inside the PDF.** The WestEd ST Math study discloses "prepared under contract C-16595 from The MIND Research Institute" only on its copyright page; SRI's "independent review" was itself contracted by MIND; Zearn's state studies are ERIC-classified "Online Submission" by Zearn employees; Prodigy, ExploreLearning, Osmo and Matific name no external evaluator at all.
4. **Nobody publishes their algorithm.** Not one product names IRT, BKT, knowledge-space theory, or a spacing model — **except IXL**, which names IRT for its Diagnostic and publishes the full SmartScore rule set. DreamBox comes closest to a differentiated technical claim (adapting on *the strategy used*) but still names no algorithm class.
5. **WWC is nearly empty here.** DreamBox has the only math-product intervention report — "potentially positive," extent of evidence "small," **not updated since December 2013**. ST Math, Zearn, Prodigy, Reflex, Frax and Khan Academy Kids have **none**.
6. **Nothing is open source and nothing has a public API.** All of them. Integration surfaces are Clever / ClassLink / Google Classroom SSO only. Content licensing is closed too — Math Playground's ToS explicitly forbids iFrame embedding, killing the "aggregate free games" strategy.
7. **Two opposite design philosophies bracket the field.** ST Math explicitly *strips* extrinsic reward and stimulus ("decreasing unnecessary visual and auditory elements increases learning"); Prodigy *maximizes* it to the point of a 21-organization FTC complaint. Zearn, DreamBox and Math Playground have essentially no reward economy at all. **Reflex sits in the defensible middle** — tokens for *effort as well as outcome*, cosmetic-only spend, a daily Green Light, and consecutive-day unlocks.

---

## 2. Learning science: what actually works for early numeracy

### 2.1 The actual skill list — Common Core Grade 1 (the spec our content must hit)

The original `corestandards.org` / `thecorestandards.org` pages now 403 or 404 to automated fetch, so the verbatim standards below were extracted from the Oregon Department of Education's official adopted reproduction of CCSSM Grade 1 ([PDF](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm1.pdf)), with Kindergarten ([PDF](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssmk.pdf)) and Grade 2 ([PDF](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm2.pdf)) for the bracketing grades.

**Grade 1's four "critical areas"** ([Oregon CCSSM Grade 1, p. 2](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm1.pdf)):

1. Addition, subtraction, and strategies for add/subtract **within 20**
2. Whole-number relationships and **place value** (grouping in tens and ones)
3. **Linear measurement** as iterating length units
4. Reasoning about **attributes of shapes**, composing/decomposing

Note that #1 and #2 are ~two-thirds of the year. A first-grade math game that only does #1 and #2 well is still a defensible product.

| Code | Standard (abridged) | Game-mechanic implication |
|---|---|---|
| **1.OA.1** | Add/subtract within 20 to solve word problems — add-to, take-from, put-together, take-apart, **compare**, with **unknowns in all positions** | Don't only ask `a + b = ?`. Ask `8 + ? = 11` and `5 = ? − 3`. |
| **1.OA.2** | Word problems adding **three** whole numbers, sum ≤ 20 | Three-addend puzzles |
| **1.OA.3** | Properties as strategies (commutativity; associativity to "make a ten") | Fact-family / "flip it" mechanic |
| **1.OA.4** | Subtraction as an **unknown-addend** problem (10 − 8 = the number that makes 10 with 8) | Missing-part / number-bond mechanic |
| **1.OA.5** | Relate counting to add/subtract (counting on) | Number-line hop mechanic |
| **1.OA.6** | Add/subtract within 20, **fluency within 10**. Named strategies: counting on; **making ten** (8+6 = 8+2+4); decomposing to a ten (13−4 = 13−3−1); using add/subtract relationship; **near-doubles** (6+7 = 6+6+1) | This standard literally names the strategies. Each is a distinct mini-game. |
| **1.OA.7** | Meaning of the **equal sign**; judge equations true/false (`6 = 6`, `7 = 8−1`, `4+1 = 5+2`) | Balance-scale mechanic; true/false swipe |
| **1.OA.8** | Find the unknown in `8 + ? = 11`, `5 = ? − 3`, `6 + 6 = ?` | Missing-number slot |
| **1.NBT.1** | Count to **120** starting from any number; read/write numerals | Number chart / counting sequence |
| **1.NBT.2** | Two digits = tens and ones; 10 as a bundle; **11–19 = a ten and some ones**; 10/20/…/90 = n tens | Base-ten blocks, bundling animation |
| **1.NBT.3** | Compare two 2-digit numbers with `>`, `=`, `<` | Comparison mechanic |
| **1.NBT.4** | Add within 100 (2-digit + 1-digit, 2-digit + multiple of 10) using **concrete models or drawings**, relate to written method | Manipulative-first, then symbol |
| **1.NBT.5** | Mentally find **10 more / 10 less** without counting | Hundred-chart jump |
| **1.NBT.6** | Subtract multiples of 10 from multiples of 10 | |
| **1.MD.1–2** | Order 3 objects by length; indirect comparison; iterate length units with no gaps/overlaps | Measuring mini-game |
| **1.MD.3** | Tell/write time to **hour and half-hour**, analog + digital | Clock mini-game |
| **1.MD.4** | Organize/represent/interpret data, **up to three categories**; "how many more/less" | Simple pictograph |
| **1.G.1** | **Defining vs non-defining attributes** (a triangle is closed and 3-sided; color/orientation/size don't matter) | Sorting mechanic — must include rotated/odd-colored shapes |
| **1.G.2** | Compose 2D/3D shapes into composite shapes | Tangram mechanic |
| **1.G.3** | Partition circles/rectangles into **halves and fourths**; "decomposing into more equal shares creates smaller shares" | Fraction-of-a-pizza mechanic |

**Two important gotchas for content authoring:**

- **CCSS Grade 1 contains NO money standard.** Grade 1 Measurement & Data has exactly four standards — length, time, data ([Grade 1 Overview, p. 3](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm1.pdf)). Coins are a *state* addition; e.g. Utah's Grade 1 core adds `1.MD.5` on pennies/nickels/dimes/quarters ([Utah Core Standards, Mathematics Grade 1](https://www.uen.org/core/core.do?courseNum=5110)). If we ship a "coin shop" as *math* content we're teaching a Grade 2 standard (2.MD.8) in most states.
- **Grade 1 requires fluency only within 10**, not 20. "Know from memory all sums of two one-digit numbers" is **Grade 2** (`2.OA.2`) ([Oregon CCSSM Grade 2, p. 4](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm2.pdf)). Setting a speed gate on sums to 20 in first grade is above grade level.

**Prerequisites we must be able to fall back to (Kindergarten):** counting to 100 by ones and tens (`K.CC.1`); cardinality — the last number said tells how many, regardless of arrangement (`K.CC.4b,c`); **decomposing numbers ≤10 into pairs in more than one way** (`K.OA.3`); **finding the number that makes 10** (`K.OA.4`); fluency within 5 (`K.OA.5`); composing/decomposing 11–19 as ten-and-some-ones (`K.NBT.1`) ([Oregon CCSSM Kindergarten, pp. 4-5](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssmk.pdf)). A real first-grade cohort spans all of these, so the adaptive floor has to reach down into K.

### 2.2 The strongest evidence we have: WWC practice guides

These are the highest-trust syntheses available in US education — federally commissioned, panel-reviewed, with explicit evidence tiers.

#### WWC 2021: *Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades*

Jayanthi, M., Gersten, R., Newman-Gonchar, R., Schumacher, R., Haymond, K., Lyskawa, J., Keating, B., & Morgan, S. (2021). NCEE #2021006. ([landing page](https://ies.ed.gov/ncee/wwc/practiceguide/26), [full PDF](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf))

**All six recommendations carry a STRONG level of evidence** — unusual for WWC:

| # | Recommendation | Supporting studies | Selected meta-analytic effect sizes |
|---|---|---|---|
| 1 | Provide **systematic instruction** to develop understanding of mathematical ideas | 43 | Counting & Cardinality *g* = 0.34; Whole-number computation 0.52; whole-number word problems 0.42; general math achievement 0.31 ([Table C.3](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)) |
| 2 | Teach clear and concise **mathematical language** and support students' use of it | 16 | |
| 3 | Use a well-chosen set of **concrete and semi-concrete representations** | 28 | |
| 4 | Use the **number line** to facilitate learning of concepts and procedures | 14 | Whole-number computation 0.62; general math achievement 0.34 ([Table C.9](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)) |
| 5 | Provide **deliberate instruction on word problems** | 18 | |
| 6 | **Regularly include timed activities** as one way to build fluency | 27 (21 RCTs without reservations) | Whole-number computation 0.64; Counting & Cardinality 0.27; general math achievement 0.35 ([Table C.13](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)) |

The guide's **representation taxonomy** (Rec 3) is exactly the concrete → semi-concrete → abstract ladder: concrete = 3D manipulatives; semi-concrete = 2D depictions (strip diagrams, drawings, arrays, **number lines**); abstract = numerals and equations. It explicitly notes these "are sometimes presented virtually on a computer or tablet screen" and warns that choosing representations "must be intentional and selective," and that place-value representations should be **proportional** (a one is one-tenth of a ten) ([Rec 3](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)).

**Recommendation 6 is the single most directly implementable section for a game.** Verbatim design constraints from the guide:

- Timed activities "last between **1 and 5 minutes** and are not the entire focus of the intervention… one component embedded within a multi-component intervention."
- "**Add timed activities to intervention once students have been working on a concept over many lessons. Do not use timed activities to introduce and teach** mathematics concepts and operations."
- "The panel **does not recommend merely giving students timed worksheets or putting students on a computer-based program without supporting their learning.** Timed activity can engage students by providing feedback in real time, including goals for improvement, and steadily increasing item difficulty."
- Sequencing: start with `n + 1` and doubles, then harder combinations; "**As you move on to harder facts, include easier facts so students are discriminating among problem types and fact sets and families**" — i.e. mixed/interleaved practice, not blocked.
- Motivation: "have students record their scores over time on a chart or graph… Goals to '**meet or beat**' a previously earned fluency score can be set for individuals or as a collective score." And crucially: "**If tracking progress individually, rather than as a group, make sure the graphs are kept private.**"
- Error handling: "**Select computer games that require students to correct their own errors before moving on to the next problem.**" The guide also observes that computer programs typically "reward students with fireworks or cute images when their answer is correct."
- Obstacle noted by the panel: "Some students seem to race through and guess" — accuracy, not speed alone, is the stated goal.

*(Design read: WWC endorses a fluency timer, but only as a 1-5 minute segment, only on already-taught content, only with immediate error correction, and with progress compared to the child's own past score rather than to peers.)*

#### WWC 2013: *Teaching Math to Young Children* (ages 3-6 — our exact band)

What Works Clearinghouse (2013), NCEE 2014-4005; panel chaired by Douglas Frye (Univ. of Pennsylvania), prepared by Mathematica. ([landing page](https://ies.ed.gov/ncee/wwc/practiceguide/18), [full PDF](https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf))

| # | Recommendation | Evidence |
|---|---|---|
| 1 | Teach **number and operations using a developmental progression** | **Moderate** |
| 2 | Teach geometry, patterns, measurement, data analysis using a developmental progression | Minimal |
| 3 | Use **progress monitoring** so instruction builds on what each child knows | Minimal |
| 4 | Teach children to view and describe their world mathematically | Minimal |
| 5 | Dedicate time each day to math; integrate it throughout the day | Minimal |

Recommendation 1's progression (Table 3 of the guide) is the ordered skill ladder an adaptive engine should walk:

1. **Subitizing** — "a child's ability to immediately recognize the total number of items in a collection and label it with an appropriate number word." Start with collections of **one to three items**, ask "How many do you see?" *without* counting. Progress to physically dissimilar items of the same type, then to unrelated items, "to construct a more abstract or general concept of number." Teach **non-examples** too ("That's four toys, not three toys").
2. **One-to-one counting** — one and only one number word per object, plus the **cardinality principle** that the last word said is the total. The guide notes children often "count again or just guess" when asked how many they just counted.
3. Comparing magnitude of collections
4. Using numerals to quantify collections
5. Simple arithmetic problems

Also: "With each step in a developmental progression, children should **first focus on working with small collections of objects (one to three items)** and then move to progressively larger collections… Children may start a new step with small numbers before moving to larger numbers with the previous step" — i.e. the ladder is not strictly linear; a child can be at step 3 for n≤3 and step 2 for n≤10 simultaneously. Our mastery model should be **per-(skill × number-range)**, not per-skill.

The guide even ships a ready-made mechanic, the **Basic Hiding game**: show 1-3 objects for a few seconds, cover them, ask "how many am I hiding?", then uncover so the child can verify by counting. That is a complete, evidence-backed core loop for a subitizing mini-game, including its own progression rule ("Vary the number of objects to determine whether children are ready to use larger sets").

### 2.3 The single best-evidenced *game* mechanic: the linear number board game

Siegler, R. S., & Ramani, G. B. (2008). Playing linear numerical board games promotes low-income children's numerical development. *Developmental Science*, 11(5), 655-661. DOI [10.1111/j.1467-7687.2008.00714.x](https://doi.org/10.1111/j.1467-7687.2008.00714.x). ([full PDF](https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/sieg-ram08.pdf); [ERIC EJ849743](https://eric.ed.gov/?id=EJ849743))

This is worth reading in full because the *design details are the active ingredient*:

- **The board:** "The Great Race" — 50 cm × 30 cm, **11 horizontally arranged, equal-sized colored squares**, leftmost labelled "Start", the other ten numbered **1-10**. Linear, left-to-right, equal spacing.
- **The loop:** child picks a rabbit or bear token, spins a spinner that yields **1 or 2**, moves that many squares, and **says aloud the number of each square passed through** — a child on 3 who spins 2 says "4, 5" while moving. Errors are corrected by the experimenter, who then has the child repeat the numbers while moving.
- **Dosage:** four 15-minute sessions over two weeks, ~30 games total, ≈1 hour of play.
- **Control:** an identical board with **colors substituted for numbers**, same spinner mechanics.

**Result:** number-line estimation linearity for individual children rose from mean *R*²lin = .15 at pretest to **.61** at posttest in the number-board group, versus **no change** (.18 → .18) in the color-board group; between-group posttest difference **d = 1.62**, *t*(34) = 4.85, *p* < .001. Within-group pre-post gain **d = 1.80**. Percent absolute error fell 28% → 20%. Experiment 1 established the gap the intervention closed: middle-income preschoolers' median estimates fit a line at *R*²lin = .94 vs .66 for low-income peers, with individual-level *d* = 1.49.

The paper reports that gains persisted **9 weeks later** and generalized across four tasks (magnitude comparison, number-line estimation, counting, numeral identification), citing the companion [Ramani & Siegler (2008)](https://eric.ed.gov/?id=EJ849743) work.

Two things to steal precisely: **(a) the board must be linear and evenly spaced** — a follow-up found circular boards do *not* produce the effect — Siegler, R. S., & Ramani, G. B. (2009). Playing linear number board games—but not circular ones—improves low-income preschoolers' numerical understanding. *Journal of Educational Psychology*, 101(3), 545-560, DOI [10.1037/a0014239](https://doi.org/10.1037/a0014239) (citation verified via [Crossref](https://api.crossref.org/works/10.1037/a0014239)); and **(b) the child must verbalize the numbers passed through**, not just watch a token slide. In a digital port, (b) means either speech input or forcing a per-square tap with the number spoken by TTS.

*(This is also the cheapest evidence-backed mechanic on this list: it is a spinner, a token, and ten squares.)*

### 2.4 Adaptive difficulty done rigorously, with published design principles — "The Number Race"

Wilson, A. J., Dehaene, S., Pinel, P., Revkin, S. K., Cohen, L., & Cohen, D. (2006). Principles underlying the design of "The Number Race", an adaptive computer game for remediation of dyscalculia. *Behavioral and Brain Functions*, 2:19. DOI [10.1186/1744-9081-2-19](https://doi.org/10.1186/1744-9081-2-19) ([PubMed 16734905](https://pubmed.ncbi.nlm.nih.gov/16734905/)). Companion trial: Wilson, A. J., Revkin, S. K., Cohen, D., Cohen, L., & Dehaene, S. (2006). An open trial assessment of "The Number Race". *Behavioral and Brain Functions*, 2:20, DOI [10.1186/1744-9081-2-20](https://doi.org/10.1186/1744-9081-2-20) ([full text, PMC1523349](https://pmc.ncbi.nlm.nih.gov/articles/PMC1523349/)).

Design highlights (from the abstract and the project's own documentation):

- Built on the hypothesis that dyscalculia stems from a core deficit in **number sense** or in the link between number sense and symbolic representation.
- The adaptive engine uses a **multidimensional "learning space" with three independent difficulty dimensions**: (1) **numerical distance** between the compared quantities, (2) **response deadline**, and (3) **conceptual complexity**, running from non-symbolic numerosity comparison up through increasingly symbolic operations. Difficulty is adjusted per-child on each dimension from live performance.
- Trial dosage: half-hour sessions, four days a week, five weeks; measured counting, transcoding, base-10 comprehension, enumeration, addition, subtraction, and comparison. Reported specific gains on core number-sense tasks (an **open trial**, not an RCT — no control group, so treat the efficacy claim as weak even though the design rationale is strong).

**The three-axis difficulty model is the most reusable idea here** and is more sophisticated than the single "level" most commercial products expose. It separates *how hard is the discrimination*, *how fast must you answer*, and *how abstract is the representation* — so a child can be pushed on speed while held at concrete representations, or vice versa.

And it is **open source**: Java, **GPL v2**, hosted on SourceForge ([project page](https://sourceforge.net/projects/numberrace/), [wiki](https://sourceforge.net/p/numberrace/wiki/Home/)) — SourceForge's own write-up notes it is "open-source and distributed free," unlike most educational software ([SourceForge Project of the Month, Nov 2011](https://sourceforge.net/blog/potm-201111/)). Last update **12 November 2017**, so it is effectively **unmaintained** — read it, don't fork it. GPLv2 also makes lifting code into a proprietary product a licensing problem.

### 2.5 Retrieval practice and spacing

Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving Students' Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology. *Psychological Science in the Public Interest*, 14(1), 4-58. ([APS summary page](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html), [journal](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266), [PubMed 26173288](https://pubmed.ncbi.nlm.nih.gov/26173288/))

Of ten techniques reviewed, exactly two earned a **high-utility** rating: **practice testing** and **distributed practice**, "because they benefit learners of different ages and abilities and have been shown to boost students' performance across many criterion tasks and even in educational contexts." Five techniques — summarization, highlighting, keyword mnemonic, imagery for text, and rereading — were rated **low utility**.

For our purposes this is the license to build the product as *a scheduler of retrieval attempts* rather than as a content-delivery app: the two highest-utility interventions in the literature are "test yourself" and "spread it out," which is precisely a spaced-repetition math-fact engine. This dovetails with WWC Rec 6's instruction to interleave easier facts back in as harder ones are introduced.

### 2.6 Learning trajectories (the pedagogy behind the best-evidenced early-math curriculum)

Clements & Sarama's **Building Blocks** is the reference implementation of the "learning trajectories" idea — goals + a developmental progression + matched instructional activities. WWC's December 2023 intervention report rates it **Potentially Positive** for pre-K mathematics (ESSA **Tier 2**) on 3 of 6 eligible studies meeting standards, and describes it as "intentionally sequenced based on the developmental progression of children's mathematical learning," delivered through whole-group, small-group, center, **and computer activities** ([WWC Intervention Report 733](https://ies.ed.gov/ncee/WWC/InterventionReport/733)).

The authors publish the full birth-to-age-8 trajectory set free at [learningtrajectories.org](https://www.learningtrajectories.org/) (Sarama & Clements, University of Denver Morgridge College of Education; funded by IES, Heising-Simons, and Gates). **Licensing caution:** the site is copyrighted and states that no text, documents, or videos may be copied or distributed separately from the site without express permission — so it is a *reading* resource, not a content source.

### 2.7 Compliance constraint (age 6-7 means COPPA)

Our user is under 13, so the app is "directed to children" under COPPA. The FTC's amended COPPA Rule took effect **April 22, 2025** ([FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)). "Personal information" includes **persistent identifiers**, screen names used as contact info, geolocation to street level, and photos/video/audio containing a child's image or voice — which means a voice-input subitizing game or an ASR-based "say the number" mechanic collects personal information and triggers verifiable parental consent. See also the FTC's [children's privacy hub](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy), which warns that using a third party's SDK in your app does not offload your compliance obligation.

*(Practical read: prefer on-device speech, avoid third-party ad/analytics SDKs, and design the reward economy so it never needs an account with PII.)*

---

## 3. Open-source math games, engines, and content we could actually reuse

Repo facts below were verified against the GitHub REST API and the projects' own license files on **2026-09-09**.

### 3.1 Summary table

| Project | Repo | License | Stack | ★ | Last activity | Maintained | Use to us |
|---|---|---|---|---|---|---|---|
| **GCompris** | [gcompris/GCompris-qt](https://github.com/gcompris/GCompris-qt) (KDE mirror: [invent.kde.org](https://invent.kde.org/education/gcompris)) | **AGPL-3.0-only** app; per-activity files GPL-3.0-or-later | Qt6 / QML | ~260 | push 2026-09-05; v26.1 released 2026-03-11 | **Very** | Pedagogy + interaction-design catalogue. **Do not copy code.** |
| **TuxMath** | [tux4kids/tuxmath](https://github.com/tux4kids/tuxmath) | GPL-3.0 | C + SDL | ~51 | `master` HEAD 2024-06-19; `sdl3-migration` branch 2026-08-19 | Barely (one contributor) | Design idea only (falling-comet drill) |
| **Perseus** | [Khan/perseus](https://github.com/Khan/perseus) | **MIT** | TS / React monorepo | ~1,590 | release 87.1.1 on 2026-09-08 | **Very** | **Best legally-clean code asset here** — exercise renderer, editor, scorer, math keypad |
| **KaTeX** | [KaTeX/KaTeX](https://github.com/KaTeX/KaTeX) | **MIT** | TS | ~20,400 | 2026-09-09 | Yes | Math typesetting — low value at grade 1 |
| Khan `math-input` (standalone) | [Khan/math-input](https://github.com/Khan/math-input) | MIT | JS/React | ~222 | **ARCHIVED** 2022-05-04 | No | Use `packages/math-input` inside Perseus |
| `khan-exercises` | [Khan/khan-exercises](https://github.com/Khan/khan-exercises) | **none declared** | HTML/JS | ~1,672 | **ARCHIVED** 2020-10-21 | Dead | **Avoid** — deprecated *and* unlicensed |
| **Kolibri** | [learningequality/kolibri](https://github.com/learningequality/kolibri) | **MIT** | Python/Django + Vue | ~1,114 | 2026-09-09; v0.20.0-alpha1 2026-08-12 | **Very** | Offline-first content delivery + learner progress model |
| Kolibri Studio | [learningequality/studio](https://github.com/learningequality/studio) | **MIT** | Python/Django | ~189 | 2026-09-09 | Yes | Content authoring/packaging pipeline |
| KA Lite | [learningequality/ka-lite](https://github.com/learningequality/ka-lite) | NOASSERTION | Python | ~457 | 2021-04-19 | Dead | Historical only |
| **The Number Race** | [sourceforge.net/projects/numberrace](https://sourceforge.net/projects/numberrace/) | **GPL-2.0** | Java | — | last update 2017-11-12 | No | Read the adaptive-engine design (§2.4); don't fork |
| Blockly Games | [blockly-games/blockly-games](https://github.com/blockly-games/blockly-games) | **Apache-2.0** | JS | ~1,367 | push 2024-07-19 | Dormant ~2y | Safe to fork; puzzles are logic/CS not math |
| Blockly core | `google/blockly` → now [RaspberryPiFoundation/blockly](https://github.com/RaspberryPiFoundation/blockly) | **Apache-2.0** | JS | ~13,550 | 2026-09-09 | Yes | Note the org transfer |
| **Phaser** | [phaserjs/phaser](https://github.com/phaserjs/phaser) | **MIT** | JS | ~40,300 | 2026-08-21 | Yes | Prime 2D web engine choice |
| PixiJS | [pixijs/pixijs](https://github.com/pixijs/pixijs) | **MIT** | TS | ~48,100 | 2026-09-08 | Yes | Renderer if we own the game loop |
| Excalibur.js | [excaliburjs/Excalibur](https://github.com/excaliburjs/Excalibur) | **BSD-2-Clause** | TS | ~2,342 | 2026-09-09 | Yes | TS-first engine, best DX of the three |
| KAPLAY (ex-Kaboom) | [kaplayjs/kaplay](https://github.com/kaplayjs/kaplay) | **MIT** | TS | ~1,788 | 2026-09-06 | Yes | Fastest prototyping |
| Godot | [godotengine/godot](https://github.com/godotengine/godot) | **MIT** | C++ | ~116,900 | 2026-09-09 | Yes | Only if we want native tablet builds |
| **ts-fsrs** | [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | **MIT** | TS | ~780 | 2026-09-09 | **Very** | **Drop-in spaced-repetition scheduler for math facts** |
| py-fsrs | [open-spaced-repetition/py-fsrs](https://github.com/open-spaced-repetition/py-fsrs) | **MIT** | Python | ~481 | 2026-08-09 | Yes | Server-side scheduling |
| FSRS4Anki | [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) | **MIT** | Jupyter/JS | ~4,061 | 2026-08-14 | Yes | Algorithm docs + optimizer reference |
| MathLive | [arnog/mathlive](https://github.com/arnog/mathlive) | **MIT** | TS | ~2,149 | 2026-09-09 | Yes | Overkill for age 6 |
| Compute Engine | [cortex-js/compute-engine](https://github.com/cortex-js/compute-engine) | **MIT** | TS | ~475 | 2026-09-08 | Yes | Symbolic answer checking |
| mathsteps | [google/mathsteps](https://github.com/google/mathsteps) | Apache-2.0 | JS | ~2,159 | **ARCHIVED** 2023-06-26 | Dead | Algebra-level; irrelevant |
| **PhET sims** | [phetsims/number-play](https://github.com/phetsims/number-play), [phetsims/number-line-operations](https://github.com/phetsims/number-line-operations) | **GPL-3.0** | TS | small | 2026-03-31 | Yes (org-wide) | Real K-2 number-sense sims — but copyleft |
| RUTMath | [przemarbor/RUTMath](https://github.com/przemarbor/RUTMath) | GPL-3.0 | Kotlin/Android | ~20 | 2025-09-25 | Low | Early-school Android math app |
| Mathigon textbooks | [mathigon/textbooks](https://github.com/mathigon/textbooks) | **no LICENSE file** | TS | ~392 | 2025-02-25 | Stalled | **Do not reuse** — no license = all rights reserved |
| Piper TTS (orig.) | [rhasspy/piper](https://github.com/rhasspy/piper) | MIT | C++/Python | ~11,277 | **ARCHIVED** 2025-08-26 | No | Superseded |
| Piper 1 GPL | [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) | **GPL-3.0** ⚠️ relicensed | C++/Python | ~5,517 | 2026-09-09 | Very | Local read-aloud — but GPL now |
| Piper voices | [huggingface.co/rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) | MIT (per model card) | ONNX | — | — | — | Pre-baked voices, MIT even though the engine relicensed |
| Common Voice | [common-voice/common-voice](https://github.com/common-voice/common-voice) | **MPL-2.0** (platform code) | TS | ~3,486 | 2026-09-09 | Yes | Dataset is for training ASR, not game audio |
| **Kenney assets** | [kenney.nl/assets](https://kenney.nl/assets) | **CC0-1.0** ([support page](https://kenney.nl/support)) | art/audio | — | active | Yes | **Best free art/audio, zero attribution burden** |
| OpenGameArt | [opengameart.org](https://opengameart.org/content/faq) | Mixed: CC0, CC-BY, CC-BY-SA, GPL, OGA-BY | — | active | Yes | **Filter to CC0 only** to avoid share-alike contamination |
| Freesound | [freesound.org](https://freesound.org/help/faq/) | Per-sound: CC0, CC-BY, CC-BY-NC | — | active | Yes | Only CC0 and CC-BY are commercially usable |

### 3.2 GCompris — great reference, legally hostile

- **License verified:** `LICENSES/` contains `AGPL-3.0-only.txt`; the README states AGPL v3 for the app with internal code under GPL v3+; individual activity files (e.g. `src/activities/numbers-odd-even/ActivityInfo.qml`) carry `GPL-3.0-or-later` headers.
- **Alive:** commits every 1-2 days; **v26.0 released 2026-02-04** (197 activities, added a GCompris-teachers companion tool), **v26.1 on 2026-03-11**.
- **Activity architecture is unusually clean and worth copying as a *pattern*:** each activity is a self-contained folder `src/activities/<name>/` with `ActivityInfo.qml` (title, objective, difficulty, prerequisites), `<Name>.qml` (the game), `CMakeLists.txt`, an SVG icon, and `resource/`. `learn_additions` is a 1.1 KB info file plus a **299-byte** QML that delegates to a shared base class. A registry of declarative activity manifests + a shared base runtime is a good architecture for us.
- **Directly relevant K-1 activities to study:** `learn_digits`, `learn_quantities`, `learn_additions`, `learn_subtractions`, `numbers-odd-even`, `enumerate`, `comparator`, `adjacent_numbers`, **`graduated_line_read` / `graduated_line_use`** (number line), `magic-hat-plus` / `magic-hat-minus`, `algebra_plus` / `algebra_minus`, `memory-math-add*`, the `smallnumbers` family (subitizing), `gnumch-*` (Number Munchers clones), `guessnumber`, `fractions_create` / `fractions_find`.
- **Verdict:** AGPL-3.0 triggers on network *use*, not just distribution. Porting a QML activity produces a derivative work we'd have to release under AGPL. Use it as a catalogue, not a source.

### 3.3 Khan Academy's Perseus is the prize

[Khan/perseus](https://github.com/Khan/perseus) is **MIT** and actively released (`@khanacademy/perseus@87.1.1`, 2026-09-08). It is a monorepo of 12 packages: `perseus`, `perseus-editor`, `perseus-core`, `perseus-score`, `perseus-linter`, `perseus-utils`, `math-input`, `keypad-context`, `kmath`, `kas`, `pure-markdown`, `simple-markdown`.

Caveat for our audience: Perseus is built for typed/structured math answers and Khan's widget vocabulary. A non-reading 6-year-old mostly needs tap-a-picture, drag-a-counter, and number-line interactions. The parts most worth vendoring are **`perseus-score`** (answer-checking architecture) and **`kas`** (tolerant answer matching). The full renderer is likely heavier than we need. The standalone `Khan/math-input` repo is archived — the live code is `packages/math-input` inside Perseus. `khan-exercises` is archived **and carries no license file at all**, so it is not safe to copy from.

### 3.4 The content-licensing trap

**The open K-5 math content we'd most want is almost all NonCommercial.**

| Source | License | Commercial use? | Where |
|---|---|---|---|
| **Illustrative Mathematics — 1st edition (K-12, 2019-2021)** | **CC BY 4.0** | ✅ Yes, with attribution + license link + "changes made" notice | [terms of use](https://illustrativemathematics.org/terms-of-use/); content at [im.kendallhunt.com/k5](https://im.kendallhunt.com/k5/curriculum.html) |
| **Illustrative Mathematics — 2nd edition (IM TK-12 v.360, 2024)** | **CC BY-NC 4.0** ⚠️ | ❌ "Commercial use … including incorporation into paid products or services … is prohibited without prior written permission" | [accessim.org/k5](https://accessim.org/k5) |
| **Open Up Resources K-5 Math** (authored by IM) | **CC BY-NC 4.0**; assessments excluded from the CC license | ❌ | [access.openupresources.org/curricula/our-k5-math](https://access.openupresources.org/curricula/our-k5-math) — *their FAQ page 403'd; license inferred from the identical IM v.360 upstream. **Partially verified.*** |
| **EngageNY / Eureka Math (K-1 modules)** | **CC BY-NC-SA** — NC *and* ShareAlike | ❌ | engageny.org shut down 2022-07-07; files at the [NYSED archive](https://www.nysed.gov/curriculum-instruction/engageny-mathematics-curriculum-files-archive) and [archive.org](https://archive.org/details/math-gpk-m1-full-module). *NYSED page failed TLS verification — **UNVERIFIED** on exact CC version string.* |
| **OpenStax** | CC BY 4.0 | ✅ but irrelevant | **No K-5 math exists.** Math starts at Prealgebra; K-12 line is Algebra 1/2 and Statistics ([openstax.org/k12/algebra](https://openstax.org/k12/algebra)). Confirmed dead end. |
| **Zearn** | Proprietary platform; portions derivative of Eureka Math licensed *by Great Minds*; portions CC BY-NC-SA 4.0 | ❌ | [about.zearn.org/terms](https://about.zearn.org/terms) — Zearn is a *user* of the EngageNY lineage, not a source of reusable code |
| **Math Learning Center apps** (Number Line, Number Rack/rekenrek, Number Frames) | **Not open source** — no GitHub org, no LICENSE, no CC notice | ❌ | *Site 403'd. **UNVERIFIED but strongly negative.** The `MathLearningCenter` GitHub org is an unrelated Texas A&M tutoring center.* |
| **Toy Theater** | **Proprietary** — "owned by Toy Theater … protected in all forms by intellectual property laws"; personal/non-commercial educational printing only | ❌ | [toytheater.com/terms](https://toytheater.com/terms/) |
| **Didax virtual manipulatives** | **UNVERIFIED** — not checked. Assume proprietary. | — | — |

If we build on IM, we must build on the **1st edition** (CC BY 4.0) and document that provenance carefully. Trademark carve-outs apply everywhere — the IM name and logo are never licensed.

I verified this split directly against IM's own [terms of use](https://illustrativemathematics.org/terms-of-use/), which also supplies the exact attribution strings to use:

- 1st edition, commercial reuse permitted: **"Based on IM® K–12 Math authored by Illustrative Mathematics and licensed under CC BY 4.0."**
- 2nd edition (v.360), non-commercial only: "Based on IM® TK–12 Math v.360 authored by Illustrative Mathematics and licensed under CC BY-NC 4.0." — commercial use "is prohibited without written permission from Illustrative Mathematics."

### 3.5 Recommended stack (all commercially clean)

- **Engine:** Phaser (MIT) or Excalibur (BSD-2) — both actively maintained this week.
- **Exercise/answer layer:** selectively vendor from Perseus (MIT), especially `kas` and `perseus-score`.
- **Mastery scheduling:** `ts-fsrs` (MIT).
- **Art/audio:** Kenney (CC0) + CC0-filtered OpenGameArt + CC0/CC-BY Freesound.
- **Read-aloud:** Piper voices from Hugging Face (MIT models), but note the engine relicensed to **GPL-3.0** under OHF-Voice — call it out-of-process at build time to pre-render audio, or use browser `SpeechSynthesis` at runtime.
- **Content:** Illustrative Mathematics **1st edition** (CC BY 4.0) only.
- **Design reference (look, don't copy):** GCompris activity catalogue, PhET Number Play, The Number Race.

---

## 4. Twelve mechanics worth stealing

Ranked roughly by evidence strength × ease of implementation. "Evidence" column distinguishes **[Strong]** (WWC strong-evidence recommendation or independent RCT), **[Moderate]**, **[Weak]** (vendor-published or correlational only), and **[Design]** (no efficacy evidence; included because the design reasoning is sound).

### M1. The linear number board with spoken counting-on — **[Strong]**

**What:** an evenly spaced, left-to-right board numbered 1..N; the child spins/rolls a 1-or-2, moves that many squares, and **says each number passed through aloud** ("4, 5"), with immediate correction on error.

**Who uses it:** essentially nobody in commercial ed-tech, which is remarkable. Motion Math's *Zoom* is the closest (a pannable number line). GCompris has `graduated_line_read` / `graduated_line_use`.

**Evidence:** Siegler & Ramani (2008), *Developmental Science* — four 15-minute sessions produced **d = 1.62** on number-line linearity vs. an identical color-board control, with gains holding at 9 weeks ([PDF](https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/sieg-ram08.pdf)). The 2009 follow-up showed **circular boards do not work** ([DOI 10.1037/a0014239](https://doi.org/10.1037/a0014239)). Reinforced by WWC Rec 4 (number lines, **strong evidence**, whole-number computation *g* = 0.62) ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)).

**How to port it:** the active ingredient is the **verbalization**, not the token movement. Digitally: require a tap on each intermediate square (with TTS speaking the number) rather than a single "move 2" animation. Keep the board **linear and evenly spaced** — do not make it a winding path around a map, which is the standard ed-tech board-game trope and which the 2009 paper suggests destroys the effect.

**Cost to build:** a spinner, a token, ten squares. This is the highest evidence-to-effort ratio on the entire list.

### M2. Concrete → semi-concrete → abstract, in that order, on the same screen — **[Strong]**

**What:** introduce every concept with a manipulative (counters, ten-frames, rekenrek/number rack, base-ten blocks), then a 2D depiction (dots, tick marks, number line, strip diagram), and only then the numeral/equation. Keep place-value representations **proportional** (a one is one-tenth of a ten).

**Who uses it:** **DreamBox** is the exemplar — the child *constructs* an answer with a number rack or open number line rather than selecting one ([Discovery Education](https://www.discoveryeducation.com/solutions/math/dreambox-math/)). **Zearn** names CPA explicitly ([approach](https://about.zearn.org/approach)). **ST Math** goes further and makes the whole puzzle wordless. **Numberblocks** is arguably the purest expression of it — the number *is* the manipulative. **IXL** names concreteness fading in its [Design Principles](https://www.ixl.com/research/IXL_Design_Principles.pdf).

**Evidence:** WWC 2021 Rec 3 (**strong**, 28 studies) plus the explicit warning that choosing representations "must be intentional and selective" ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)).

### M3. Timed fluency bursts of 1-5 minutes, gated behind prior teaching — **[Strong]**

**What:** a short, fast, mixed-fact drill that appears **only after** a concept has been taught over several sessions; never as the introduction.

**Who uses it:** **Reflex** is the reference implementation (Crabby's Fact Fair → Coach Penny → fast games → Green Light) ([Explore Reflex](https://reflex.explorelearning.com/about/explore-reflex)). **Zearn** opens every lesson with a fluency activity. **Motion Math's** *Pizza* uses "adaptive timing."

**Evidence:** WWC 2021 Rec 6, **strong**, 27 studies (21 RCTs without reservations), whole-number computation *g* = **0.64**. The guide's own constraints are the design spec: 1-5 minutes; on already-taught content only; item difficulty steadily increasing; **easier facts mixed back in as harder ones are added**; students must **correct their own errors before moving on**; and "the panel does not recommend… putting students on a computer-based program without supporting their learning" ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)).

**Grade-1 constraint:** CCSS Grade 1 requires fluency **within 10** only; "know from memory all sums of two one-digit numbers" is Grade 2 (`2.OA.2`). Do not put a speed gate on sums to 20 in first grade.

### M4. "Meet or beat your own previous score," never a peer comparison — **[Strong]**

**What:** the fluency score a child races against is *their own last score*, charted over days. Group goals are allowed; individual charts are kept private.

**Who uses it:** **Reflex's** Progress Tree is the closest commercial analogue. **IXL's SmartScore** is per-child but IXL also ships **teacher-configurable leaderboards**, which cuts against this.

**Evidence:** WWC 2021 Rec 6, step 4, verbatim: "Goals to '**meet or beat**' a previously earned fluency score can be set for individuals or as a collective score… Working toward a goal as a group can reduce the pressure on individual students. **If tracking progress individually, rather than as a group, make sure the graphs are kept private.**" ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf))

**Direct implication for us:** ship no public leaderboard for 6-7 year-olds. This is also exactly what Fairplay attacked Prodigy for — visible in-class status differences between paying and non-paying children ([complaint](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf)).

### M5. Error-first feedback: the animation shows you *why* you were wrong — **[Moderate]**

**What:** on a wrong answer, don't buzz and re-ask. Play out the consequence visually so the child can *see* the error, then let them retry the same item.

**Who uses it:** **ST Math** is the whole product — JiJi the penguin visibly fails to cross the gap in a way that reveals the mistake ([ST Math](https://www.mindeducation.org/programs/st-math/)). MIND has published on **elective replay after failure** and on operationalizing **productive struggle** from clickstream data ([rp.stmath.com](https://rp.stmath.com/pages/publications.html)).

**Evidence:** the mechanism sits under WWC Rec 6's requirement to "**select computer games that require students to correct their own errors before moving on**" ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)) — **strong** at that level of generality. But note ST Math's *product-level* independent RCT found a **negligible** effect ([ERIC EJ1041346](https://eric.ed.gov/?id=EJ1041346)). The mechanic is well-motivated; the product built on it did not beat control.

### M6. Spaced retrieval scheduling for math facts — **[Strong for the principle, Weak for any product]**

**What:** treat each fact (or fact family) as a card in a spaced-repetition scheduler; surface it when the model predicts recall is about to lapse.

**Who uses it:** **nobody in this survey publishes one.** Prodigy claims "spiral review methodology" with no parameters ([Prodigy blog](https://www.prodigygame.com/main-en/blog/is-prodigy-math-adaptive)); Reflex claims "the right facts at the right time" with no intervals. **Not one product names a spacing model.** This is a genuine open lane.

**Evidence:** Dunlosky et al. (2013) rated **practice testing** and **distributed practice** as the only two **high-utility** techniques of ten reviewed ([*Psychological Science in the Public Interest*, 14(1), 4-58](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266)). WWC Rec 6 independently instructs mixing easier facts back in as harder ones arrive.

**How to build it:** `ts-fsrs` (MIT, actively maintained, [repo](https://github.com/open-spaced-repetition/ts-fsrs)) gives us a modern FSRS scheduler for free. Schedule **per (skill × number-range)** rather than per-skill, because the WWC early-math guide notes a child can be at a later step for small numbers and an earlier step for larger ones ([WWC 2013](https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf)).

### M7. Three independent difficulty axes instead of one "level" — **[Design, strong rationale]**

**What:** separate (a) **discrimination difficulty** (numerical distance / problem size), (b) **response deadline**, and (c) **representational abstractness** (non-symbolic quantity → dots → numeral → equation). Adapt each independently.

**Who uses it:** **The Number Race**, whose adaptive engine is a multidimensional "learning space" on exactly these three dimensions ([Wilson, Dehaene et al., 2006, *Behavioral and Brain Functions* 2:19](https://doi.org/10.1186/1744-9081-2-19)). No commercial product exposes anything this articulated.

**Why it matters for us:** it lets us push a confident child on speed while holding them at concrete representations, or advance a child to numerals while keeping the deadline generous — instead of one blunt level that couples all three. **Caveat:** the Number Race trial was an **open trial with no control group**, so the design rationale is far stronger than its efficacy evidence.

### M8. A mastery gate that a character delivers, not a score — **[Design]**

**What:** end a unit with a short check; a character tells the child in-fiction whether to go back and rewatch/replay or move on.

**Who uses it:** **Numberblocks World** — the gate is hosted by "Numberblock 6," who tells the child "whether they need to go back over the previous videos or whether they're ready to progress" ([App Store](https://apps.apple.com/us/app/numberblocks-world/id1520827387)). **Zearn** gates at **100% on the closing quiz** but presents it as a score ([approach](https://about.zearn.org/approach)). **IXL** exposes a raw number.

**Why the in-character framing matters at 6-7:** a pre-reader cannot interpret "SmartScore 72." A friend saying "let's watch that one again" is legible. There is no efficacy evidence separating these framings — **UNVERIFIED** — but the readability constraint is real.

### M9. Asymmetric scoring: generous early, brutal at the top — **[Design]**

**What:** IXL's SmartScore rule set, which is worth copying almost verbatim because it is the only published one in the market ([SmartScore Guide](https://www.ixl.com/materials/SmartScore_Guide.pdf)):

- 0-80: **large gains for correct, small penalties for wrong** — deliberately builds early self-efficacy.
- 80 = proficiency; 80-90 questions get harder and gains slow.
- 90-100 "Challenge Zone": correct **+1 to +2**, wrong **−3 to −8** — typically **10 correct in a row** to reach 100.
- **Minimum 28 questions** to reach 100 on most skills.
- **No decay from inactivity** — a child can take a break without punishment.

IXL grounds this in **Bandura self-efficacy** and **Dweck growth mindset** ([Design Principles](https://www.ixl.com/research/IXL_Design_Principles.pdf)) — a vendor rationale, not evidence. But the shape is defensible: the expensive part of mastery is at the end, where it should be, and nothing punishes a child for going on holiday.

### M10. Diagnostic disguised as gameplay — **[Design]**

**What:** never show a 6-year-old a test. Run placement inside the first minutes of ordinary play.

**Who uses it:** **Boddle** — new students get "a series of assessment items that **look like regular gameplay**" ([support](https://www.boddlelearning.com/support-categories/student-classroom)). **Prodigy** runs its placement test from the very first question, starting *below* the selected grade and placing **per strand**, over ~3-4 sessions ([Placement Test Guide](https://www.prodigygame.com/main-en/blog/prodigy-placement-test)). **IXL** blends dedicated diagnostic items with ordinary practice responses so the diagnostic is "real-time" ([Design Principles](https://www.ixl.com/research/IXL_Design_Principles.pdf)).

**Steal specifically:** per-strand placement (not one global level), starting below grade, spread across several short sessions rather than one long one, and reaching down into Kindergarten standards because a real Grade 1 cohort spans them.

### M11. Adapt on the *strategy*, not just right/wrong — **[Design, differentiating]**

**What:** instrument *how* the child got the answer — did they count all, count on, or make a ten? — and branch on that.

**Who uses it:** **DreamBox** is the only product claiming it: the engine "evaluates the **strategies used** to solve problems," adapting **within a lesson as well as between lessons** ([Discovery Education](https://www.discoveryeducation.com/solutions/math/dreambox-math/)).

**Why it's tractable for us:** `1.OA.6` literally enumerates the target strategies (counting on, making ten, decomposing to a ten, using the add/subtract relationship, near-doubles). If the manipulative UI logs which one the child used — how many single-counter taps vs. one "make ten" action — the strategy signal falls out of the interaction log for free. Zearn's Grade 1 sequence is explicitly about moving a child "from counting all to a more sophisticated strategy, **counting on**" ([Grade 1 Course Guide](https://webassets.zearn.org/resources/G1_Course_Guide_Z1.pdf)) — that transition is the single most valuable thing to detect and drive.

### M12. Scaffold in place rather than dropping a grade level — **[Design, contested]**

**What:** when a child struggles, add support to the grade-level task instead of demoting them to easier content.

**Who uses it:** **Zearn**, explicitly and as its stated differentiator: lessons adapt "**while keeping them engaged in grade-level content**" ([approach](https://about.zearn.org/approach)). Prodigy, DreamBox and ST Math all do the opposite and drop to prerequisites.

**Status:** genuinely contested. Zearn's own RCT evidence is weak (confirmatory **+0.07 SD, not significant**), and Foster's K-1 head-to-head found Zearn behind DreamBox on point estimates ([ERIC EJ1408302](https://eric.ed.gov/?id=EJ1408302)). Meanwhile Foster also found **Matthew Effects** in DreamBox — stronger students benefited more — which is the failure mode Zearn's approach is designed to avoid. **Treat this as an open design question, not a settled one.**

### Honourable mentions (mechanics we should *not* copy)

| Mechanic | Who | Why not |
|---|---|---|
| **Global/absolute leaderboards** | IXL (teacher-configurable), Matific Multiplayer Arena, Mathletics Hall of Fame, Prodigy PvP | Contradicts WWC Rec 6's "keep the graphs private" ([WWC 2021006](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)), and an absolute leaderboard was shown to **open a top-vs-bottom motivation gap over 10 weeks that a nearest-neighbour leaderboard did not** ([Bai et al. 2021](https://doi.org/10.1016/j.compedu.2021.104297)). If any ranking ships, make it a neighbour window — see §5.3 |
| **Visibly partial rewards (1 of 3 stars)** | Ubiquitous in the category | The single worst effect in the motivation literature: performance-contingent reward where the child receives **less than the maximum**, ***d* = −0.88** ([Deci et al. 1999](https://doi.org/10.1037/0033-2909.125.6.627)) |
| **Paywalled in-game status visible to classmates** | Prodigy (members on clouds, non-members "in the dirt") | The core of the 2021 Fairplay/FTC complaint ([PDF](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf)) |
| **Ad density over content density** | Prodigy (16 membership ads / 4 math problems in 19 minutes, per Fairplay) | Same complaint |
| **Money content in Grade 1** | SplashLearn, Numberock (2.MD.8), Utah's 1.MD.5 | **CCSS Grade 1 has no money standard** — it's Grade 2 in most states |
| **Speed gates on sums to 20 in Grade 1** | — | `1.OA.6` requires fluency **within 10** only; automaticity to 20 is `2.OA.2` |
| **Heavy text UI** | Prodigy (quest dialogue, shops, battle menus) | Our user is a pre-reader. ST Math's wordless design and Osmo Numbers' tile input are the right models |

---

## 5. Reward economies — currencies, streaks, badges, and avatar customization

*(Priority section. Our build is a gamified learning experience, so the reward layer is a first-class design decision, not decoration.)*

### 5.1 The loops, product by product

| Product | Earned currency / points | How earned | Spent on | Streak / daily goal | Notes |
|---|---|---|---|---|---|
| **Prodigy Math** | XP, hearts, **Magicoin** (monthly cap; a *higher cap is a paid benefit*) | Winning battles by answering correctly | 100+ elementally-typed **pets**, **gear**, house decoration, Lamplight Town shop | Quests and bounties | Character **levels 1-100**; a **treasure track with 2×/3× reward multipliers for members**; member-locked gear, "Mythical Epics" pets, and a members-only 100-floor Dark Tower ([What is Prodigy Math](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game); [Memberships](https://www.prodigygame.com/Memberships/math/)) |
| **Boddle Learning** | **Five separate currencies** — Knowledge Points, Gold, Battle Points, Pet Points, **Boddle Bucks** (premium: 1,200/month) | Questions, **Prize Wheel**, Arcade, Pet Battles, Racers, Quests, Prize Boxes. XP +25% in adventure mode for premium | Arcade access, shop cosmetics, **home furniture**, pet **shards / seeds / XP books** | Deep pet system: rotating daily Pet Shop, "plant **10 seeds** to grow a brand new pet," or **50 shards** to unlock, with rarity up to **Mythic** | **Daily & weekly Quests** with milestone bonuses at quests 1/3/5/7; free daily check-in; **Battle Points day-capped at 150 free / 450 premium** | **The most elaborate economy in the survey, and the closest to gacha.** ([currencies](https://intercom.help/boddle/en/articles/7792630-knowledge-points-gold-battle-points-pet-points-and-boddle-bucks); [getting pets](https://intercom.help/boddle/en/articles/8201941-getting-new-pets); [quests](https://intercom.help/boddle/en/articles/7846677-quests); [shop](https://intercom.help/boddle/en/articles/8201956-shop); [Premium](https://www.boddlelearning.com/premium)) |
| **Reflex** (ExploreLearning) | **Tokens**, awarded "for **effort and progress** toward automaticity" | Fluency practice | **Avatar accessories** and **Progress Tree decorations** — cosmetic only | **The Green Light** — earned once a threshold of facts is answered correctly in a day; **consecutive Green-Light days unlock a new game of the student's choice** (2 unlocked at launch, 8 more over time) | The most defensible economy here: cosmetic-only spend, effort *and* outcome rewarded, no pay-gated status ([Explore Reflex](https://reflex.explorelearning.com/about/explore-reflex); [Unlock Reflex Games](https://reflex.explorelearning.com/resources/insights/unlock-reflex-games); [Research Behind Reflex](https://reflex.explorelearning.com/research/research-behind-reflex)) |
| **SplashLearn** | **Coins** | Game activities | **Unlockable characters** | Not documented | ([App Store](https://apps.apple.com/us/app/splashlearn-kids-learning-app/id672658828)) |
| **Osmo Math Wizard** | **Crystals** | Completing quests in Mathemagica | **Pets, foods and toys in Sky Castle** | None | Osmo *Numbers* by contrast is deliberately reward-light and **explicitly has no timers** — a "stress-free environment" with "no fear of wrong answers" ([Math Wizard](https://apps.apple.com/us/app/osmo-math-wizard/id1470095030); [Genius Numbers](https://www.playosmo.com/products/genius-number)) |
| **Reading Eggs** (Blake eLearning / **3P Learning**; ages 2-13) | **Golden eggs** — the homepage runs a live counter at **9,469,390,904 banked** | Progress through lessons; "after every five or so lessons each child earns enough golden eggs to go to the Games section" | Reward games, avatar items, and **house and garden** furniture | Collectible **critters** added to a "zoo"; certificate at the end of each map | ([why it works](https://readingeggs.com/about/why-it-works/); [FAQ](https://readingeggs.com/info/faqs/); [readingeggs.com](https://readingeggs.com/)) |
| **Mathseeds** (same publisher) | **Golden acorns** — *not* eggs | "Every lesson and activity" | Avatar items and **treehouse** items | **Pets hatch from an acorn** into a collection; certificate every 5 lessons | ([why it works](https://mathseeds.com/about/why-it-works/); [mathseeds.com](https://mathseeds.com/)) |
| **Numberblocks: Hide and Seek** | — | Correct answers as difficulty ramps | **20 collectible "playthings"** | None | Pure collection, no currency ([App Store](https://apps.apple.com/us/app/numberblocks-hide-and-seek/id1328950963)) |
| **IXL** | **None — deliberately no currency** | — | Virtual **awards/badges** at proficiency and usage milestones; a prize/sticker book | No streak; **SmartScore explicitly does not decay** with inactivity | Also ships **teacher-configurable leaderboards**. IXL grounds its minimal reward layer in **Eccles' Expectancy-Value Theory** ([Design Principles](https://www.ixl.com/research/IXL_Design_Principles.pdf); [SmartScore Guide](https://www.ixl.com/materials/SmartScore_Guide.pdf)) |
| **Khan Academy Kids** | **No currency and no streak — confirmed** | Prizes awarded "**intermittently based on lesson completion and accuracy**"; progress shows as colour-coded checkmarks, not points | Five guides (**Kodi** the Bear, **Ollo** the Elephant, Reya, Peck, Sandy). **Avatars are swapped freely by a parent in "Grown-Ups Only" with no unlock mechanic** | **None** — no streak article exists anywhere in the help center | ([khanacademy.org/kids](https://www.khanacademy.org/kids); [progress](https://khankids.zendesk.com/hc/en-us/articles/360041615571-How-does-the-learning-level-adjust-and-how-do-I-view-my-child-s-progress); [avatars](https://khankids.zendesk.com/hc/en-us/articles/360007053871-How-do-I-change-the-avatar-for-a-user)). **A citable existence proof that a top-tier early-elementary app can ship with essentially zero reward economy** |
| **Zearn** | **None — confirmed, and deliberately** | — | — | — | Zearn's own **"Math Motivation Hub" is a library of *printable, physical* materials** — "ready-to-use, printable kits," "printable Zearn certificates and tags." The stickers and certificates it advertises are things a **teacher prints and hands out**, not digital objects rendered to the child ([Math Motivation Supplies](https://about.zearn.org/math-resources/math-motivation-supplies); [How Zearn Math Works](https://about.zearn.org/how-zearn-math-works)). Its "three lessons a week, 90 a year" target is **teacher-facing cadence, not a student-facing streak** |
| **ST Math** | **None, deliberately** | — | — | — | "Decreasing unnecessary visual and auditory elements increases learning" ([The Science of ST Math](https://play.stmath.com/academy/courses/essentials4/nounit/science/)) |
| **DreamBox, Math Playground, Numberock, Bedtime Math, Motion Math (in i-Ready)** | **None** | — | — | — | See §1 |
| **ClassDojo** | **Dojo Points**, teacher-awarded against teacher-authored "skills" tagged **Positive** or **Needs Work** | Classroom behaviour, not academic work | **"Redeem points" zeroes the visible bubble in exchange for an *offline* prize the teacher decides — there is no in-app catalogue.** "Reset points" zeroes the bubble but preserves history in Reports | **Monster avatar is freely customizable and NOT point-gated** | ([Customize skills/points](https://help.classdojo.com/hc/en-us/articles/202027539-Customize-Add-and-Edit-Skills-Points); [How to redeem](https://help.classdojo.com/hc/en-us/articles/205647205-How-to-Redeem-Class-Points); [Reset bubbles](https://help.classdojo.com/hc/en-us/articles/34014542792973-Reset-Student-Point-Bubbles); [Customize your monster](https://help.classdojo.com/hc/en-us/articles/202739645-Customize-Your-Monster)) |
| **Dojo Islands** | **Shells** — a currency entirely separate from Dojo Points; plus a paid **Adventure Pass** | In-world play | Block Shop building blocks; Adventure Pass buys pets, costumes, rocket boots | Class Islands (teacher-controlled) vs Home Islands (parent-controlled) | Positive classroom points (**max 5/day counted**) advance a monthly cosmetic **rewards track**, but ClassDojo states outright that "**Dojo Islands Rewards don't spend or subtract any points … this is completely separate from the Redeem Points feature**" ([Classroom Rewards](https://help.classdojo.com/hc/en-us/articles/48066863473677-Classroom-Rewards-for-Dojo-Islands); [Home FAQ](https://help.classdojo.com/hc/en-us/articles/25040486728973-Dojo-Islands-for-Home-FAQ)). **The paid Adventure Pass is home-only and never visible in the classroom** — an architectural answer to exactly the have/have-not problem Fairplay alleged against Prodigy |
| **Khan Academy** — *legacy* | **Energy points — literally unspendable** | Videos, practice, challenges | **Nothing. There is no store.** The only functional gate found is 5,000 points to vote on comments | Badges **Meteorite → Moon → Earth → Sun → Black Hole** + Challenge Patches; avatars unlock by points and "many avatars have **evolutions**" | ([energy points/badges/avatars](https://support.khanacademy.org/hc/en-us/articles/202487710-What-are-energy-points-badges-and-avatars); [comment voting](https://support.khanacademy.org/hc/en-us/articles/202263024-Why-can-t-I-vote-on-a-comment)). Per-tier point thresholds are **deliberately unpublished — UNVERIFIED** |
| **Khan Academy** — *Reimagined* | **Gems**, with a published earn schedule: **10** per skill to Proficient, **+5** Proficient→Mastered, **+10** per unit, **+1** per Daily Mission, **+5** per Weekly Mission, **0** for videos/articles; gems are never lost | Mastery progress, not time-on-task | **50 gems = one *random* Khanmigo accessory** (hat or glasses) | Khanmigo cosmetics. **Badges, legacy avatars and LearnStorm are discontinued** | **The streak is weekly, not daily** — ≥1 skill to Proficient in a Mon–Sun Pacific window ([earning gems](https://support.khanacademy.org/hc/en-us/articles/38505636598413-How-do-I-earn-gems-in-the-reimagined-Khan-Academy-experience); [accessories](https://support.khanacademy.org/hc/en-us/articles/42456912953997-How-can-I-customize-Khanmigo-and-unlock-new-Khanmigo-accessories); [streak](https://support.khanacademy.org/hc/en-us/articles/46962453239437-What-is-a-streak-and-how-do-I-keep-it-going-in-the-reimagined-Khan-Academy-experience); [what's changing](https://support.khanacademy.org/hc/en-us/articles/46056261189773-What-s-changing-for-students-on-the-reimagined-Khan-Academy)) |
| **Epic!** | Points, XP, level | Books finished; XP for first audiobook completion | **Nothing — no store exists anywhere in the help center** | Badges unlock **avatars and avatar frames**; Quiz Trophies | **Three sticker types: Books Finished, Daily Goal, and Reading Streak.** Audiobook time earns XP but counts toward **none** of the three ([reading activity](https://support.getepic.com/hc/en-us/articles/115000867666-How-can-I-view-my-child-s-reading-activity); [badges](https://support.getepic.com/hc/en-us/articles/205626365-How-do-achievements-and-badges-work); [audiobooks and goals](https://support.getepic.com/hc/en-us/articles/45797785703565-How-do-Audiobooks-and-Read-to-Me-Books-count-toward-reading-goals-on-Epic)) |
| **Mathletics** (3P Learning) | Points → **M Coins**, 1:1 | 1 pt per correct Live answer, 10 per Skill Quest, 20 per test, ≤100 per Challenge — **capped at 300 pts/week from any single activity** | Avatar Store | Ladder: Bronze → Silver → Gold → Platinum → Emerald → Diamond → Epic → **Legend**; certificate at **1,000 points in a single week** | Weekly reset; Live Mathletics head-to-head; a **Hall of Fame** with School / Country / World rankings ([earning points](https://knowledgebase.mathletics.com/en_US/rewards-and-recognition/how-can-students-earn-points-in-mathletics); [certificates](https://knowledgebase.mathletics.com/celebrate-learning/1-mathletics-certificates); [features](https://www.mathletics.com/us/features/)) |
| **Duolingo** (not math, but the reference implementation) | **XP**, **gems/lingots**, **hearts** (energy) | Lessons | Streak freezes, outfits, and other shop items | **The streak** + a user-set **daily goal**; **leagues/leaderboards** | See §5.2 — the only company here publishing real numbers |

### 5.2 Duolingo is the only operator publishing quantitative results

Duolingo explains the streak explicitly in terms of habit formation and **loss aversion**: early on, "going from 2 to 3 days [is] a 50% increase in its length, whereas going from 200 to 201 days is merely an increase of 0.5%," so the motivational driver shifts over time from visible progress to reluctance to lose accumulated progress ([Duolingo blog: how the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)).

Two published figures from that post:

- **"Duolingo learners who reach a streak of just 7 days are 3.6 times more likely to complete their course."** *(This is correlational — a 7-day streak is a proxy for the kind of learner who finishes. Do not read it as causal.)*
- New animations on streak extensions increased **7-day retention of brand-new learners by +1.7%**. *(This one reads as an A/B test result, so it is a genuine causal estimate — and note how small it is.)*

Duolingo also deliberately builds **slack** into the streak: the **streak freeze** exists because "offering people a little 'slack' as they pursue their goals can actually be more motivating than having a rigid set of rules," and they **doubled the maximum equipped freezes from one to two** (same post). This is the single most important streak-design detail for a 6-year-old, who does not control whether the family has a busy Tuesday.

Separately, and more relevant to us than any cosmetic mechanic:

> **Settles, B., & Meeder, B. (2016). "A Trainable Spaced Repetition Model for Language Learning." *Proceedings of ACL 2016*, 1848-1858.** DOI [10.18653/v1/P16-1174](https://doi.org/10.18653/v1/P16-1174) ([PDF](https://aclanthology.org/P16-1174.pdf))

Their **half-life regression (HLR)** model reduced recall-prediction error by **45%+** versus baselines, and — the headline for us — **"HLR was able to improve Duolingo daily student engagement by 12% in an operational user study."** A *scheduling* improvement moved daily engagement more than any of the cosmetic mechanics they report. That is a strong argument for putting our engineering effort into M6 (spaced retrieval) rather than into a pet shop.

Duolingo's broader research corpus is at [research.duolingo.com](https://research.duolingo.com/).

### 5.3 What the motivation literature actually says

**The core finding, and it is not comfortable for reward economies:**

> **Deci, E. L., Koestner, R., & Ryan, R. M. (1999). "A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation." *Psychological Bulletin*, 125(6), 627-668.** DOI [10.1037/0033-2909.125.6.627](https://doi.org/10.1037/0033-2909.125.6.627) ([PubMed 10589297](https://pubmed.ncbi.nlm.nih.gov/10589297/))

Free-choice behaviour results, read from the [full text](https://pdodds.w3.uvm.edu/files/papers/others/1999/deci1999a.pdf), Figure 1, p. 647 — **note the age-stratified rows, which are the ones that matter for us**:

| Reward type | k | d | 95% CI |
|---|---|---|---|
| All rewards | 101 | **−0.24\*** | (−0.29, −0.19) |
| Verbal rewards (praise) | 21 | **+0.33\*** | (0.18, 0.43) |
| → verbal, **children** | 7 | **+0.11 (ns)** | (−0.11, 0.34) |
| → verbal, college | 14 | **+0.43\*** | (0.27, 0.58) |
| All tangible | 92 | **−0.34\*** | (−0.39, −0.28) |
| Unexpected tangible | 9 | +0.01 (ns) | (−0.20, 0.22) |
| **Expected tangible** | 92 | **−0.36\*** | (−0.42, −0.30) |
| Engagement-contingent | 55 | **−0.40\*** | (−0.48, −0.32) |
| → **children** | 39 | **−0.43\*** | (−0.53, −0.34) |
| → college | 12 | **−0.21\*** | (−0.37, −0.05) |
| Completion-contingent | 19 | **−0.44\*** | (−0.59, −0.30) |
| Performance-contingent | 32 | **−0.28\*** | (−0.38, −0.18) |
| → **…when the child receives *less than the maximum* reward** | 6 | **−0.88\*** | (−1.12, −0.65) |

Three things follow, and the first is a **correction to the common reading of this paper**:

1. **Praise does not measurably help children.** The oft-quoted *d* = 0.33 for verbal reward is the *pooled* figure. Split by age it is **+0.43 for college students but +0.11, non-significant, for children** (Q_b(1) = 5.14, *p* < .02). Do not justify a praise-heavy design by citing the pooled number.
2. **The harm is larger for children on every tangible measure.** For the 57 tangible-reward free-choice studies with children, composite *d* = **−0.39** (CI −0.47, −0.32) vs **−0.27** for college students (Q_b(1) = 4.18, *p* < .04); for engagement-contingent rewards the gap is wider still (−0.43 vs −0.21, Q_b(1) = 6.76, *p* < .01). The Method section (p. 638) states "most of the children were **preschool or elementary students**" — **the "children" cell literally is our users.**
3. **The single most design-actionable number in this document is *d* = −0.88** — performance-contingent reward where the child **visibly receives less than the maximum available**. A three-star rating that hands back one or two stars is structurally that condition.

The meta-analysis was contested. See the published Comment — Lepper, Henderlong & Gingras (1999), *Psychological Bulletin*, 125(6), 669-676, DOI [10.1037/0033-2909.125.6.669](https://doi.org/10.1037/0033-2909.125.6.669) — and the pro-reward line of work: **Cameron & Pierce (1994)**, *Review of Educational Research*, 64(3), 363-423, DOI [10.3102/00346543064003363](https://doi.org/10.3102/00346543064003363) (96 experiments; reward overall does *not* decrease intrinsic motivation; the sole negative is expected tangible reward for task completion), and **Cameron, Banko & Pierce (2001)**, *The Behavior Analyst*, 24(1), 1-44, open access at [PMC2731358](https://pmc.ncbi.nlm.nih.gov/articles/PMC2731358/) — rewards on **low-interest** tasks "enhance free-choice intrinsic motivation," and negatives appear only when rewards are "**tangible, expected (offered beforehand), and loosely tied to level of performance**." Deci, Koestner & Ryan replied in *RER* 71(1), 1-27, DOI [10.3102/00346543071001001](https://doi.org/10.3102/00346543071001001). *(The PMC copy of Cameron et al. 2001 is a scan with no text layer, so their specific d values are **UNVERIFIED**.)*

**The asymmetry that decides this for us:** Deci et al. note (p. 639) that "**none of the previous meta-analyses analyzed for age effects**." The reassuring pro-reward literature is *not age-stratified*. For a product aimed at 6-7 year-olds, that materially weakens it as a defence.

The modern SDT synthesis is **Ryan, R. M., & Deci, E. L. (2020). "Intrinsic and extrinsic motivation from a self-determination theory perspective: Definitions, theory, practices, and future directions." *Contemporary Educational Psychology*, 61, 101860.** DOI [10.1016/j.cedpsych.2020.101860](https://doi.org/10.1016/j.cedpsych.2020.101860). Its position is more nuanced than "rewards bad": **both intrinsic motivation and "well-internalized (and thus autonomous) forms of extrinsic motivation predict an array of positive outcomes"**, and both "are enhanced by supports for students' basic psychological needs for **autonomy, competence, and relatedness**."

**That is the actionable frame.** A reward is not harmful because it is a reward; it is harmful when it is *controlling*. The design test is whether each mechanic feeds autonomy (I chose this), competence (I can see myself getting better), or relatedness (someone is with me) — or whether it substitutes for them.

**Does gamification work at all?** Two meta-analyses, both positive but modest:

> **Sailer, M., & Homner, L. (2020). "The Gamification of Learning: a Meta-analysis." *Educational Psychology Review*, 32(1), 77-112.** DOI [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w)

Random-effects results: **cognitive** learning outcomes *g* = **0.49** (95% CI [0.30, 0.69], k=19, N=1,686); **motivational** *g* = **0.36** ([0.18, 0.54], k=16, N=2,246); **behavioral** *g* = **0.25** ([0.04, 0.46], k=9, N=951). Critically, "**Whereas the effect of gamification on cognitive learning outcomes was stable in a subsplit analysis of studies employing high methodological rigor, effects on motivational and behavioral outcomes were less stable.**" Moderator findings: **inclusion of game fiction** and **combining competition with collaboration** were the elements that mattered for behavioral outcomes — *not* points or badges per se.

> **Bai, S., Hew, K. F., & Huang, B. (2020). "Does gamification improve student learning outcome? Evidence from a meta-analysis and synthesis of qualitative data in educational contexts." *Educational Research Review*, 30, 100322.** DOI [10.1016/j.edurev.2020.100322](https://doi.org/10.1016/j.edurev.2020.100322)

30 independent interventions, 3,202 participants: **overall Hedges' g = 0.504** in favour of gamification. The authors open by noting gamification "has attracted considerable controversy ('gamification is bullshit') and some derogatory labels such as 'exploitationware'."

**Two further meta-analyses do break out by age, and they change the picture substantially:**

> **Kim, J., & Castelli, D. M. (2021).** *International Journal of Environmental Research and Public Health*, 18(7), 3550 — full text at [PMC8037535](https://pmc.ncbi.nlm.nih.gov/articles/PMC8037535/). Overall **d = 0.48** [0.33, 0.62], 32 effect sizes from 18 studies.

| Moderator | Effect size | Q_b |
|---|---|---|
| **K-12** | **0.92** [0.29, 1.55] | Q_b = 26.27, *p* < .01 |
| College | 0.15 [−0.04, 0.35] | |
| **Duration: days / < 1 week** | **1.57** [1.25, 1.90] | Q_b = 67.20, *p* < .01 |
| **Duration: weeks (2-16)** | **0.39** [0.21, 0.57] | |
| **Duration: years (1-2)** | **−0.20** [−0.47, 0.09] | |

> **Frontiers in Psychology (2023), 14:1253549** — [full text](https://www.frontiersin.org/articles/10.3389/fpsyg.2023.1253549/full). Overall **g = 0.822** [0.567, 1.078], 41 studies, 5,071 participants. **Elementary g = 1.293 (k = 12)**; secondary 0.869 (k = 29); higher ed 0.014 (k = 8). **Mechanics-only (points/badges/rewards alone) g = 0.533** vs. mechanics + dynamics + aesthetics g = 1.285.

**Two through-lines, and they are the most consequential findings in this section:**

1. **Gamification works *better* on young children than on undergraduates** — replicated across both. Combined with §5.3's age-stratified undermining data, the honest synthesis is that **6-year-olds are the maximum-sensitivity population in *both* directions**: the biggest engagement lift *and* the biggest intrinsic-motivation cost. There is no "it's fine, they're kids" reading of this literature.
2. **The benefit is front-loaded and decays to zero or below.** Kim & Castelli's duration gradient — **1.57 → 0.39 → −0.20** — is a textbook novelty-effect signature, and **a product used across a full school year lives in that negative tail.** For a year-long first-grade math product this is the single most important number in the document: whatever we build has to survive the point at which it stops being new. Design the *fade*, and design what carries the second semester.

*Caveats:* Kim & Castelli's per-cell **n** column looks internally inconsistent (K-12 n=146 vs adults n=12,455) — the effect sizes and CIs are solid but re-check the n's against PMC before quoting them externally. The Frontiers elementary figure rests on only **k = 12** studies — small, heterogeneous, and publication-bias-prone. Sailer & Homner's own education-level moderator table could not be retrieved (Springer blocks automated fetch of the CC-BY PDF) — **UNVERIFIED**.

**Which mechanic buys which psychological need — the cleanest experimental answer:**

> **Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017).** "How gamification motivates: An experimental study of the effects of specific game design elements on psychological need satisfaction." *Computers in Human Behavior*, 69, 371-380. DOI [10.1016/j.chb.2016.12.033](https://doi.org/10.1016/j.chb.2016.12.033) (OA at [nbn-resolving.org](https://nbn-resolving.org/urn:nbn:de:bvb:384-opus4-1090595))

An RCT varying which elements were present: **badges, leaderboards and progress graphs raise *competence* need-satisfaction and task meaningfulness; avatars, narrative and teammates raise *relatedness*; *autonomy* was not affected by any of them.** The authors' conclusion — "gamification proves effective through specific design mechanisms rather than generically" — is the sentence to hold onto.

Corroborating that points buy quantity rather than quality: **Mekler, E. D., et al. (2017)**, *Computers in Human Behavior*, 71, 525-534, DOI [10.1016/j.chb.2015.08.048](https://doi.org/10.1016/j.chb.2015.08.048) — points, levels and leaderboards "functioned as **extrinsic incentives, effective only for promoting performance *quantity***." Exact statistics **UNVERIFIED** (publisher elided the abstract).

**Leaderboards: the *design* of the ranking changes the outcome.** This is the most directly implementable finding in this section:

> **Bai, S., Hew, K. F., Sailer, M., & Jia, C. (2021).** "From top to bottom: How positions on different types of leaderboard may affect fully online student learning performance, intrinsic motivation, and course engagement." *Computers & Education*, 173, 104297. DOI [10.1016/j.compedu.2021.104297](https://doi.org/10.1016/j.compedu.2021.104297) ([OA PDF](https://opus.bibliothek.uni-augsburg.de/opus4/files/109038/109038.pdf))

Two 10-week quasi-experiments:

- **Absolute leaderboard** (everyone ranked, N=24): no motivation difference at pre-test (F(2,18)=0.85, *p*=.45) or mid-term (F(2,15)=1.71, *p*=.21), but a **significant effect by post-intervention, H(2)=6.55, *p*=.038**, driven by top third > bottom third (U=11, *p*=.028). Means moved from 5.20 / 4.67 / 4.67 at pre-test to **5.71 / 5.29 / 4.70** at post-test — **the gap opened up over the semester.** Learning performance did not differ (H(2)=0.64, *p*=.727).
- **Relative leaderboard** (five nearest neighbours only, N=26): **no significant differences at any timepoint** (post F=0.53, *p*=.59), and descriptively the *bottom-ranked* students were the most motivated and most engaged.

A global ranking demotivates the bottom third over time; a neighbour-window ranking does not. **Caveats: N=24 and N=26, postgraduate students, quasi-experimental, single institution — do not present this as established for 6-year-olds.** Corroborating with a much larger sample: **Pickal et al. (2025)**, *Learning and Individual Differences*, 126, 102836, DOI [10.1016/j.lindif.2025.102836](https://doi.org/10.1016/j.lindif.2025.102836) — **N=427** randomized to five leaderboard conditions with *fictitious* rank feedback (ruling out ability confounds): motivation was "highest for higher position with upward trend feedback," and "**negative feedback appears more detrimental than no feedback at all**."

Two frequently-cited counter-cases that I could **not** verify and that should not be quoted with numbers: **Hanus & Fox (2015)**, *Computers & Education*, 80, 152-161, DOI [10.1016/j.compedu.2014.08.019](https://doi.org/10.1016/j.compedu.2014.08.019) — no open-access copy exists anywhere; only the *direction* is confirmed (gamified-course students showed less motivation, satisfaction and empowerment over time). **Every specific statistic from it is UNVERIFIED.** And **Christy & Fox (2014)**, *Computers & Education*, 78, 66-77, DOI [10.1016/j.compedu.2014.05.005](https://doi.org/10.1016/j.compedu.2014.05.005) — women shown a male-topped leaderboard performed worse on a subsequent math test; exact means/N **UNVERIFIED**.

**On surveillance-flavoured point systems:** ClassDojo's behaviour-point model has a substantial critical literature —

> **Manolev, J., Sullivan, A., & Slee, R. (2019). "The datafication of discipline: ClassDojo, surveillance and a performative classroom culture." *Learning, Media and Technology*, 44(1), 36-51.** DOI [10.1080/17439884.2018.1558237](https://doi.org/10.1080/17439884.2018.1558237)

The authors argue ClassDojo's "datafying system of school discipline **intensifies and normalises the surveillance of students**," creating "a culture of performativity" that "serves as a mechanism for behaviour control." Whatever one makes of the critique, it is the reputational risk attached to publicly visible, teacher-awarded point systems for young children.

**Token economies and the federal guidance — the two literatures converge more than they look.**

Single-case meta-analysis: **Soares, D. A., Harrison, J. R., Vannest, K. J., & McClelland, S. S. (2016).** *School Psychology Review*, 45(4), 379-399, DOI [10.17105/spr45-4.379-399](https://doi.org/10.17105/spr45-4.379-399) — 88 AB phase contrasts from 28 studies (1980-2014), 90 participants, **weighted mean effect size 0.82** (SE .03, 95% CI [0.77, 0.88]); token economies were "**slightly more effective for youth ages 6-15 than ages 3-5** when used with **behavioral versus academic goals**." *(This is a Tau-U-family single-case effect size and is **not** comparable to Cohen's d. Note the "behavioral vs academic" qualifier — the evidence is strongest for what tokens do to conduct, not to learning.)* Directly opposed on quality: **Maggin, D. M., Chafouleas, S. M., Goddard, K. M., & Johnson, A. H. (2011)**, *Journal of School Psychology*, 49(5), 529-554, DOI [10.1016/j.jsp.2011.05.001](https://doi.org/10.1016/j.jsp.2011.05.001) — the research on token economies "does not provide sufficient evidence to be deemed best-practice based on the WWC criteria." Cite the two side by side.

The federal guidance is more specific and more useful than either:

> **IES / What Works Clearinghouse, *Reducing Behavior Problems in the Elementary School Classroom*, NCEE 2008-012** — [landing page](https://ies.ed.gov/ncee/wwc/PracticeGuide/4), [full PDF](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/behavior_pg_092308.pdf). **Recommendation 3 (teach and reinforce new skills) is rated STRONG** on five RCTs and three single-subject studies.

Its operational guidance (p. 31) reads almost like a spec sheet: "Use **small rewards frequently, rather than large rewards infrequently**. Deliver rewards **quickly** after the desired behavior is exhibited. **Reward behavior, not the individual**, and communicate to students the **specific behavior** that led to the reward… Use **several different kinds** of rewards… **Gradually begin to reduce and then eliminate rewards.**" It addresses the undermining debate head-on as "Roadblock 3.2" (p. 40) — rewards that are "expected, tangible, and not related to performance" can erode engagement, but "positive reinforcement that is **tied to student competence** can increase the likelihood of appropriate classroom behavior and academic achievement without undermining intrinsic motivation" — and on pp. 66-67 it weighs Deci et al. against Cameron et al. and sides with Cameron.

**Read together, the two literatures converge.** Deci et al.'s harmful cells are *expected, tangible, loosely-tied-to-performance*. WWC's prescription is *behavior-specific, competence-tied, small, frequent, varied, and faded*. Those are complements, not contradictions — WWC is essentially prescribing the design that steers around Deci's harmful cells.

*(On PBIS: [pbis.org](https://www.pbis.org/pbis/what-is-pbis) describes it as "an evidence-based, tiered framework" with its own [studies database](https://www.pbis.org/pbis/studies), but those are the Center's own summary statements. **Any PBIS effect size is UNVERIFIED** — I did not reach a WWC intervention report on PBIS itself.)*

**On avatar customization — and this is the one mechanic shown to move autonomy:**

> **Birk, M. V., Atkins, C., Bowey, J. T., & Mandryk, R. L. (2016).** "Fostering intrinsic motivation through avatar identification in digital games." *CHI '16*, 2982-2995. DOI [10.1145/2858036.2858062](https://doi.org/10.1145/2858036.2858062)

**N=126.** Similarity, embodied and wishful identification with a customized avatar "increases **autonomy**, immersion, invested effort, enjoyment, and positive affect," and identification "translates into motivated behaviour as operationalized by the **time that players spent in an unending version of the infinite runner**." **This is the only mechanic in this whole section shown to raise *autonomy* — the exact need Sailer et al. (2017) found points, badges and leaderboards fail to touch.** Path coefficients **UNVERIFIED**. Corroborating: **Türkay & Kinzer (2014)**, *IJGCMS*, 6(1), 1-25, DOI [10.4018/ijgcms.2014010101](https://doi.org/10.4018/ijgcms.2014010101) — N=66 over ~10 hours: "both time and customization positively impacted players' identification with their avatars," interpreted through SDT. *(The outcome there is identification, not learning — don't upgrade it.)*

Also verified in a related vein: a preregistered 2×2 study in a Java programming game found participants given **visual choice** experienced higher avatar identification and autonomy, with choice leading indirectly to increases in intrinsic motivation, immersion, time spent and future play motivation ([*CHI 2022*, DOI 10.1145/3491102.3501848](https://doi.org/10.1145/3491102.3501848)). **The mechanism in both is *choice*, i.e. autonomy — not possession of an item. I could not verify an equivalent study in children aged 6-7 — UNVERIFIED.**

**On the "personalization principle" — a correction worth making explicitly.** The widely-quoted *d* ≈ 1.11 attributed to Mayer **could not be verified and should not be used**; it appears to be a median across a handful of individual experiments in closed-access book chapters, not a meta-analytic estimate. What *is* verifiable is the meta-analysis of exactly this principle:

> **Ginns, P., Martin, A. J., & Marsh, H. W. (2013).** "Designing Instructional Text in a Conversational Style: A Meta-analysis." *Educational Psychology Review*, 25(4), 445-472. (Abstract verified via the [ERIC API](https://api.ies.ed.gov/eric/).)

Reliable average effects on **friendliness (d = 0.46)** and **effective cognitive processing (d = 0.62)**, but **not** on learning assistance (0.16) or interest (0.15); on learning outcomes, **retention d = 0.30** and **transfer d = 0.54**. Crucially: "the clearest apparent boundary condition… was **instructional time, with small, non-significant effects being found in studies longer than 35 min**." So the real personalization effect is *d* ≈ 0.30-0.54 **and it decays to non-significance past about 35 minutes** — another front-loading result, echoing the duration gradient in §5.3.

**On streaks in young children — say the gap out loud.** There is **no published evidence base on streak anxiety or compulsive use in 5-8 year-olds**, and the "what-the-hell effect" applied to app streaks appears to be industry folklore rather than a published finding (the construct originates in the dieting/self-regulation literature). The closest paper to our question is **Sepúlveda, Varas-Pavez & Peake (2026), "Impact of streak feature in gamified app on kindergarten numeracy skills," *Education and Information Technologies*, 31(9), 2489-2511**, DOI [10.1007/s10639-026-13920-6](https://doi.org/10.1007/s10639-026-13920-6) — but it is **cross-sectional (the authors' own stated limitation), closed-access, and barely cited. Retrieve before relying on it.** What *is* well-established is the goal-gradient and endowed-progress literature: **Kivetz, R., Urminsky, O., & Zheng, Y. (2006)**, *Journal of Marketing Research*, 43(1), 39-58, DOI [10.1509/jmkr.43.1.39](https://doi.org/10.1509/jmkr.43.1.39) — loyalty-card members purchase more frequently as they approach a reward, website users return more often when closer to a goal, and **illusory (endowed) progress — pre-stamped cards — accelerates behaviour**. **Design consequence: "you already have 2 of 10 stars" is an evidence-backed lever that costs nothing psychologically, whereas "your 40-day streak dies tonight" is loss-framed.** Endowed progress is the cheaper of the two, ethically.

### 5.4 What this means for our reward design

1. **Six-year-olds are the maximum-sensitivity population in both directions.** Undermining is larger for children than adults (−0.39 vs −0.27, Q_b *p* < .04); gamification's measured benefit is *also* larger for children (K-12 ES 0.92 vs college 0.15; elementary *g* 1.29 vs higher-ed 0.01). We get the biggest lift *and* the biggest cost. There is no "it's fine, they're kids" reading of this literature.
2. **Treat the reward economy as a depreciating asset and design its fade.** The duration gradient is **1.57 (days) → 0.39 (weeks) → −0.20 (years)** ([Kim & Castelli 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8037535/)). A school-year product built on novelty can end the year *worse* than control. This is reinforced independently by the personalization principle's ~35-minute boundary ([Ginns et al. 2013](https://eric.ed.gov/?id=EJ1027078)) and by WWC's own instruction to "**gradually begin to reduce and then eliminate rewards**" ([NCEE 2008-012, p. 31](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/behavior_pg_092308.pdf)). Plan what carries the second semester.
3. **Rank mechanics by the need they feed, because the experimental evidence says they differ.** Points/badges/leaderboards buy **competence** only, and act as extrinsic incentives that raise output *quantity* without raising quality (Sailer et al. 2017; Mekler et al. 2017). Avatars/narrative/teammates buy **relatedness**, and avatar customization is the one mechanic shown to raise **autonomy** (Birk et al. 2016). Nothing in the points family touches autonomy, which is a third of what Ryan & Deci say motivation requires. **If you take one design bet from this section: over-invest in avatar, collection and narrative; under-invest in points and leaderboards.**
4. **Avoid the four documented failure modes.** (a) *Expected, tangible, loosely-tied-to-performance* rewards — the one cell every camp agrees is harmful. (b) **Visibly less-than-maximum performance-contingent rewards, *d* = −0.88** — this is the 1-of-3-stars pattern, and it is the worst number in the document. (c) **Global comparative ranking** — an absolute leaderboard opened a top-vs-bottom motivation gap over 10 weeks that a nearest-neighbour leaderboard did not (Bai et al. 2021), and negative rank feedback is worse than *no* feedback (Pickal et al. 2025). (d) **Paywalled visible status** — the entire substance of the Fairplay complaint, and something ClassDojo has architecturally designed around by keeping the Adventure Pass invisible in the classroom.
5. **Adopt WWC's four qualifiers wholesale**: behavior-specific, competence-tied, small-and-frequent rather than large-and-rare, and planned to fade. That is a *Strong*-rated federal recommendation for the elementary classroom, and it happens to steer precisely around Deci et al.'s harmful cells.
6. **Prefer endowed progress to loss-framed streaks.** Goal-gradient and illusory-progress effects are well established ([Kivetz et al. 2006](https://doi.org/10.1509/jmkr.43.1.39)); streak-as-loss in young children is *unstudied*. Even Duolingo's own data is deregulatory: their biggest win came from making the streak **easier** to keep (decoupling it from the XP goal: **+3.3% D14 retention, +10.5% daily learners on a streak**), and "nearly 40% of inactive-streak users with high engagement had the '**intense**' daily goal setting" — the aggressive goal was itself the churn driver ([Improving the streak](https://blog.duolingo.com/improving-the-streak/)). For a first grader who does not control the family calendar, make the streak forgiving by default — auto-repair, or count days-played-this-week.
7. **Reward effort as well as outcome.** Reflex's tokens are awarded "for **effort and progress**" ([Research Behind Reflex](https://reflex.explorelearning.com/research/research-behind-reflex)), decoupling reward from the performance-contingency that Deci et al. found most corrosive.
8. **Invest in feedback quality before a shop — but do not justify it with the praise number.** The pooled *d* = 0.33 for verbal reward is **+0.11 and non-significant for children**. The case for ST Math's "the animation shows you *why* you were wrong" rests on WWC Rec 6's immediate-feedback-and-self-correction requirement, not on the praise literature.
9. **Spend engineering effort on scheduling before cosmetics.** Duolingo's HLR scheduler moved **daily engagement +12%** in an operational study; their streak-animation polish moved D7 retention **+1.7%**. The scheduler is also the thing no competitor in §1 has built.
10. **Game fiction is the moderator that actually mattered** — in Sailer & Homner and again in the Frontiers 2023 breakdown, where **mechanics-only (points/badges/rewards alone) scored *g* = 0.533 against 1.285 for mechanics + dynamics + aesthetics**. Numberblocks and ST Math both win on fiction with no economy at all.
11. **Two existence proofs at the extremes, both viable.** **Zearn** ships a well-regarded first-grade math product whose entire motivation layer is *printable and teacher-mediated* — zero in-app economy. **Khan Academy Kids** ships with no currency and no streak. At the other end, **Boddle** runs five currencies, a prize wheel, and shard/seed pet acquisition that is gacha-adjacent. Both ends of that line ship successfully; the question is where we want to sit and why.

---

## 6. Recommendations for our build

### 6.1 Scope: pick the two critical areas that are two-thirds of first grade

Build depth on CCSS Grade 1 **Critical Area 1** (add/subtract within 20 and the named strategies) and **Critical Area 2** (place value, tens and ones), with the adaptive floor reaching down into Kindergarten (`K.OA.3` decomposing to 10, `K.OA.4` making 10, `K.CC.4` cardinality) ([Grade 1 standards](https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm1.pdf)). Measurement, time, data, and geometry can be thin or later. Two content traps to avoid: **no money content** (not a Grade 1 standard) and **no speed gates above sums of 10** (fluency within 20 is Grade 2's `2.OA.2`).

### 6.2 Architecture

| Layer | Choice | Why |
|---|---|---|
| Engine | **Phaser (MIT)** or **Excalibur (BSD-2)** | Both actively maintained as of 2026-09; permissive; web-first suits a school Chromebook |
| Scheduling / mastery | **`ts-fsrs` (MIT)** | The one place we can beat every product in §1 — none publishes a spacing model. Duolingo's own scheduler work moved daily engagement **+12%** ([Settles & Meeder 2016](https://aclanthology.org/P16-1174.pdf)) |
| Mastery unit | **per (skill × number-range)**, not per skill | WWC's early-math guide notes a child can be at a later step for small numbers and an earlier one for larger ([WWC 2013](https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf)) |
| Difficulty model | **Three independent axes** — discrimination, deadline, abstractness | From The Number Race ([Wilson et al. 2006](https://doi.org/10.1186/1744-9081-2-19)); no commercial product does this |
| Answer checking | Vendor **`perseus-score`** and **`kas`** from [Khan/perseus](https://github.com/Khan/perseus) (MIT) | Actively released; avoids writing tolerant answer-matching from scratch |
| Art / audio | **Kenney (CC0)** + CC0-filtered OpenGameArt + CC0/CC-BY Freesound | Verified CC0, no attribution burden, commercial use explicit ([kenney.nl/support](https://kenney.nl/support)) |
| Read-aloud | Pre-render with **Piper voices (MIT models)** at build time, or browser `SpeechSynthesis` at runtime | The Piper *engine* relicensed to GPL-3.0 under OHF-Voice; the voice models on HF remain MIT. Keep the GPL engine out of the shipped binary |
| Content | **Illustrative Mathematics 1st edition only (CC BY 4.0)** | The 2024 v.360 edition is CC BY-**NC**; EngageNY/Eureka is NC *and* SA; OpenStax has no K-5. Attribution string: "Based on IM® K–12 Math authored by Illustrative Mathematics and licensed under CC BY 4.0." ([IM terms](https://illustrativemathematics.org/terms-of-use/)) |
| Activity structure | Copy **GCompris's pattern** — a declarative per-activity manifest + shared base runtime | Their `ActivityInfo.qml` + tiny activity file model is unusually clean. **Copy the pattern, not the code** — GCompris is AGPL-3.0 |

### 6.3 The build order I would argue for

1. **The linear number board (M1) first.** Highest evidence-to-effort ratio in the document: a spinner, a token, ten squares, TTS speaking each square as the child taps through it. Independent RCT effect *d* = 1.62 after one hour of play ([Siegler & Ramani 2008](https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/sieg-ram08.pdf)). Keep it **linear and evenly spaced** — the 2009 follow-up shows circular boards don't work.
2. **Subitizing via the WWC's own Basic Hiding game (M2).** Show 1-3 objects, cover them, "how many am I hiding?", uncover to verify. The guide supplies the progression rule and the extension path (identical objects → similar → unrelated), plus the non-example technique ("that's four toys, not three toys") ([WWC 2013, Rec 1](https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf)).
3. **Manipulative-first composition (M2 + M11).** Ten-frames and a rekenrek for `K.OA.3/4` and `1.OA.6` make-a-ten. Instrument *how* the child solves it — counter-by-counter taps vs. a single make-ten action — so the "counting all → counting on" transition falls out of the interaction log. This is the Zearn Grade 1 through-line and the DreamBox differentiator.
4. **Spaced retrieval over facts within 10 (M6)** using ts-fsrs, with mixed easy/hard items as WWC Rec 6 requires.
5. **Only then a 1-5 minute timed segment (M3 + M4)** on already-taught facts, with a private "meet or beat your own score" chart and mandatory self-correction before advancing.
6. **Diagnostic disguised as play (M10)** — per-strand, starting below grade, spread over the first few sessions.

### 6.4 Reward design: the specific stance I'd take

Given that our audience is exactly the group Deci, Koestner & Ryan found tangible rewards to be **most** detrimental for ([1999](https://doi.org/10.1037/0033-2909.125.6.627)):

- **Ship a coherent world and characters (game fiction)** — the moderator that actually predicted behavioral outcomes in [Sailer & Homner (2020)](https://doi.org/10.1007/s10648-019-09498-w), and the difference between *g* = 0.533 (mechanics only) and 1.285 (mechanics + dynamics + aesthetics) in the [Frontiers 2023 meta-analysis](https://www.frontiersin.org/articles/10.3389/fpsyg.2023.1253549/full).
- **Give choice constantly** — which fluency game, which avatar, which order. Autonomy is the one need points and badges demonstrably fail to touch ([Sailer et al. 2017](https://doi.org/10.1016/j.chb.2016.12.033)) and the one avatar customization does ([Birk et al. 2016](https://doi.org/10.1145/2858036.2858062)).
- **Never hand back a visibly partial reward.** No 1-of-3 stars. Performance-contingent reward where the child receives less than the maximum is the worst effect in the literature at ***d* = −0.88**.
- **Reward effort as well as outcome**, following Reflex.
- **Keep all spend cosmetic**, and **never** make paid status visible to other children (the Fairplay/Prodigy failure mode; ClassDojo's home-only Adventure Pass is the architectural fix).
- **Forgiving streaks, or endowed progress instead.** Prefer "you already have 2 of 10" ([Kivetz et al. 2006](https://doi.org/10.1509/jmkr.43.1.39)) over "your streak dies tonight." Duolingo's own biggest streak win came from making it *easier*, and their "intense" daily goal correlated with streak death.
- **No public leaderboard** — and if any ranking ships, make it a **nearest-neighbour window, not a global list** ([Bai et al. 2021](https://doi.org/10.1016/j.compedu.2021.104297)). WWC Rec 6 and the ClassDojo performativity literature point the same way.
- **Plan the fade from day one.** WWC's Strong-rated Recommendation 3 says to "gradually begin to reduce and then eliminate rewards" ([NCEE 2008-012](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/behavior_pg_092308.pdf)), and the duration gradient (1.57 → 0.39 → **−0.20**) says a year-long product that doesn't will end up underwater.
- **Over-invest in feedback quality** — ST Math's "the animation shows you *why*" — but justify it from WWC Rec 6's self-correction requirement, **not** from the praise meta-analysis: verbal reward is *d* = +0.11 **non-significant for children**.

### 6.5 Honest expectations

Set the internal bar realistically. The most rigorous independent evaluations in this entire category land at **+0.03 to +0.20 SD**: DreamBox +0.10 average, Zearn's preregistered confirmatory outcome +0.07 and **not significant**, ST Math **negligible** in its only true independent RCT. A well-built product that reaches +0.10 SD would be at the top of the category. Treat any vendor claim above ~0.3 SD as a prompt to find out who paid for the study.

The counterweight, and the most encouraging fact in this document: the single strongest first-grade result on record — **Berkowitz et al. (2015), *Science*, N = 587 first-grade families** — came from *a parent and a child reading one silly word problem together at bedtime*, with **no adaptivity, no reward economy, and no mastery model** ([DOI 10.1126/science.aac7427](https://doi.org/10.1126/science.aac7427)). Whatever we build, the parent-child interaction loop deserves at least as much design attention as the child-device loop.

### 6.6 Compliance and gaps

- **COPPA applies.** The amended Rule took effect **22 April 2025** ([FTC FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)). Persistent identifiers and voice recordings both count as personal information — so an ASR-based "say the number" mechanic (which M1 would love to have) triggers verifiable parental consent. Prefer on-device speech, avoid third-party ad/analytics SDKs, and design the reward economy so it never needs an account with PII.
- **Open gaps worth a follow-up pass:** Reflex's actual Green Light threshold and fluency time cut-off; ST Math's per-level mastery threshold; school/district dollar figures for ST Math, Zearn and Reflex; Khan Academy Kids' K-1 math scope and sequence; whether any gamification meta-analysis breaks out ages 6-7. Most of these are behind Cloudflare-protected help centers or sales-quote walls rather than genuinely unpublished.

---

## Sources

### Standards

- Oregon DOE, *Common Core State Standards for Mathematics — Kindergarten* — https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssmk.pdf
- Oregon DOE, *CCSSM — Grade 1* — https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm1.pdf
- Oregon DOE, *CCSSM — Grade 2* — https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm2.pdf
- Utah Core Standards, Mathematics Grade 1 — https://www.uen.org/core/core.do?courseNum=5110
- *(Note: `thecorestandards.org` / `corestandards.org` returned 403/404 to automated fetch on 2026-09-09; the Oregon DOE adopted reproduction was used instead.)*

### Federal evidence syntheses

- Jayanthi, M., et al. (2021). *Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades.* WWC Practice Guide, NCEE #2021006 — https://ies.ed.gov/ncee/wwc/practiceguide/26 · [PDF](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)
- What Works Clearinghouse (2013). *Teaching Math to Young Children.* NCEE 2014-4005 — https://ies.ed.gov/ncee/wwc/practiceguide/18 · [PDF](https://ies.ed.gov/ncee/wwc/Docs/practiceguide/early_math_pg_111313.pdf)
- WWC Intervention Report: DreamBox Learning (Dec 2013) — https://ies.ed.gov/ncee/wwc/Intervention/794 · [Evidence Snapshot](https://ies.ed.gov/ncee/wwc/EvidenceSnapshot/627) · [full PDF](https://ies.ed.gov/ncee/wwc/Docs/InterventionReports/wwc_dreambox_121013.pdf) · [study record](https://ies.ed.gov/ncee/wwc/Study/78475)
- WWC Intervention Report: Building Blocks (Dec 2023) — https://ies.ed.gov/ncee/WWC/InterventionReport/733
- WWC ESSA tiers — https://ies.ed.gov/ncee/wwc/essa · Evidence for ESSA — https://www.evidenceforessa.org/what-is-essa/
- IES award record, Efficacy of Zearn Math — https://ies.ed.gov/use-work/awards/efficacy-zearn-math

### Peer-reviewed research

- Siegler, R. S., & Ramani, G. B. (2008). *Developmental Science*, 11(5), 655-661. DOI 10.1111/j.1467-7687.2008.00714.x — [PDF](https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/sieg-ram08.pdf) · [ERIC EJ849743](https://eric.ed.gov/?id=EJ849743)
- Siegler, R. S., & Ramani, G. B. (2009). *Journal of Educational Psychology*, 101(3), 545-560. DOI [10.1037/a0014239](https://doi.org/10.1037/a0014239)
- Wilson, A. J., Dehaene, S., Pinel, P., Revkin, S. K., Cohen, L., & Cohen, D. (2006). *Behavioral and Brain Functions*, 2:19. DOI [10.1186/1744-9081-2-19](https://doi.org/10.1186/1744-9081-2-19) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/16734905/)
- Wilson, A. J., Revkin, S. K., Cohen, D., Cohen, L., & Dehaene, S. (2006). *Behavioral and Brain Functions*, 2:20. DOI [10.1186/1744-9081-2-20](https://doi.org/10.1186/1744-9081-2-20) · [PMC1523349](https://pmc.ncbi.nlm.nih.gov/articles/PMC1523349/)
- Dunlosky, J., et al. (2013). *Psychological Science in the Public Interest*, 14(1), 4-58. [SAGE](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266) · [APS](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html)
- Berkowitz, T., et al. (2015). "Math at home adds up to achievement in school." *Science*, 350(6257), 196-198. DOI [10.1126/science.aac7427](https://doi.org/10.1126/science.aac7427) · Comment [10.1126/science.aad8008](https://www.science.org/doi/10.1126/science.aad8008) · Response [10.1126/science.aad8555](https://www.science.org/doi/10.1126/science.aad8555)
- Schaeffer, M. W., et al. (2018). *Journal of Experimental Psychology: General*, 147(12), 1782-1790. DOI [10.1037/xge0000490](https://doi.org/10.1037/xge0000490)
- Riconscente, M. M. (2013). *Games and Culture*, 8(4), 186-214. DOI [10.1177/1555412013496894](https://doi.org/10.1177/1555412013496894)
- Rutherford, T., et al. (2014). *Journal of Research on Educational Effectiveness* — [ERIC EJ1041346](https://eric.ed.gov/?id=EJ1041346)
- Foster, M. E. (2024). *Journal of Research on Educational Effectiveness* — [ERIC EJ1408302](https://eric.ed.gov/?id=EJ1408302)
- Pane, J. F., Doss, C., Todd, I., & Seaman, D. (2025). EdWorkingPaper 25-1211 — https://edworkingpapers.com/ai25-1211 · [ERIC ED674124](https://eric.ed.gov/?id=ED674124)
- Hashim, S. (2024). *AERA Open* — [ERIC EJ1455259](https://eric.ed.gov/?id=EJ1455259)
- Wang, H., & Woodworth, K. (2011). SRI International — [ERIC ED528686](https://eric.ed.gov/?id=ED528686)
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). *Psychological Bulletin*, 125(6), 627-668. DOI [10.1037/0033-2909.125.6.627](https://doi.org/10.1037/0033-2909.125.6.627) · [PubMed 10589297](https://pubmed.ncbi.nlm.nih.gov/10589297/)
- Lepper, M. R., Henderlong, J., & Gingras, I. (1999). *Psychological Bulletin*, 125(6), 669-676. DOI [10.1037/0033-2909.125.6.669](https://doi.org/10.1037/0033-2909.125.6.669)
- Ryan, R. M., & Deci, E. L. (2020). *Contemporary Educational Psychology*, 61, 101860. DOI [10.1016/j.cedpsych.2020.101860](https://doi.org/10.1016/j.cedpsych.2020.101860)
- Cameron, J., & Pierce, W. D. (1994). *Review of Educational Research*, 64(3), 363-423. DOI [10.3102/00346543064003363](https://doi.org/10.3102/00346543064003363)
- Cameron, J., Banko, K. M., & Pierce, W. D. (2001). *The Behavior Analyst*, 24(1), 1-44 — [PMC2731358](https://pmc.ncbi.nlm.nih.gov/articles/PMC2731358/)
- Deci, E. L., Koestner, R., & Ryan, R. M. (2001). *Review of Educational Research*, 71(1), 1-27. DOI [10.3102/00346543071001001](https://doi.org/10.3102/00346543071001001)
- Sailer, M., & Homner, L. (2020). *Educational Psychology Review*, 32(1), 77-112. DOI [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w)
- Bai, S., Hew, K. F., & Huang, B. (2020). *Educational Research Review*, 30, 100322. DOI [10.1016/j.edurev.2020.100322](https://doi.org/10.1016/j.edurev.2020.100322)
- Huang, R., et al. (2020). *Educational Technology Research & Development* — [ERIC EJ1266144](https://eric.ed.gov/?id=EJ1266144)
- Kim, J., & Castelli, D. M. (2021). *IJERPH*, 18(7), 3550 — [PMC8037535](https://pmc.ncbi.nlm.nih.gov/articles/PMC8037535/)
- *Frontiers in Psychology* (2023), 14:1253549 — https://www.frontiersin.org/articles/10.3389/fpsyg.2023.1253549/full
- Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). *Computers in Human Behavior*, 69, 371-380. DOI [10.1016/j.chb.2016.12.033](https://doi.org/10.1016/j.chb.2016.12.033) · [OA](https://nbn-resolving.org/urn:nbn:de:bvb:384-opus4-1090595)
- Mekler, E. D., et al. (2017). *Computers in Human Behavior*, 71, 525-534. DOI [10.1016/j.chb.2015.08.048](https://doi.org/10.1016/j.chb.2015.08.048)
- Bai, S., Hew, K. F., Sailer, M., & Jia, C. (2021). *Computers & Education*, 173, 104297. DOI [10.1016/j.compedu.2021.104297](https://doi.org/10.1016/j.compedu.2021.104297) · [OA PDF](https://opus.bibliothek.uni-augsburg.de/opus4/files/109038/109038.pdf)
- Pickal, A., et al. (2025). *Learning and Individual Differences*, 126, 102836. DOI [10.1016/j.lindif.2025.102836](https://doi.org/10.1016/j.lindif.2025.102836)
- Hanus, M. D., & Fox, J. (2015). *Computers & Education*, 80, 152-161. DOI [10.1016/j.compedu.2014.08.019](https://doi.org/10.1016/j.compedu.2014.08.019) *(no OA copy; statistics UNVERIFIED)*
- Christy, K. R., & Fox, J. (2014). *Computers & Education*, 78, 66-77. DOI [10.1016/j.compedu.2014.05.005](https://doi.org/10.1016/j.compedu.2014.05.005)
- Birk, M. V., Atkins, C., Bowey, J. T., & Mandryk, R. L. (2016). *CHI '16*, 2982-2995. DOI [10.1145/2858036.2858062](https://doi.org/10.1145/2858036.2858062)
- Türkay, S., & Kinzer, C. K. (2014). *IJGCMS*, 6(1), 1-25. DOI [10.4018/ijgcms.2014010101](https://doi.org/10.4018/ijgcms.2014010101)
- Ginns, P., Martin, A. J., & Marsh, H. W. (2013). *Educational Psychology Review*, 25(4), 445-472 — via the [ERIC API](https://api.ies.ed.gov/eric/)
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). *Journal of Marketing Research*, 43(1), 39-58. DOI [10.1509/jmkr.43.1.39](https://doi.org/10.1509/jmkr.43.1.39)
- Soares, D. A., Harrison, J. R., Vannest, K. J., & McClelland, S. S. (2016). *School Psychology Review*, 45(4), 379-399. DOI [10.17105/spr45-4.379-399](https://doi.org/10.17105/spr45-4.379-399)
- Maggin, D. M., Chafouleas, S. M., Goddard, K. M., & Johnson, A. H. (2011). *Journal of School Psychology*, 49(5), 529-554. DOI [10.1016/j.jsp.2011.05.001](https://doi.org/10.1016/j.jsp.2011.05.001)
- Sepúlveda, Varas-Pavez & Peake (2026). *Education and Information Technologies*, 31(9), 2489-2511. DOI [10.1007/s10639-026-13920-6](https://doi.org/10.1007/s10639-026-13920-6) *(cross-sectional; retrieve before relying on it)*
- IES/WWC, *Reducing Behavior Problems in the Elementary School Classroom*, NCEE 2008-012 — https://ies.ed.gov/ncee/wwc/PracticeGuide/4 · [PDF](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/behavior_pg_092308.pdf)
- PBIS Center — https://www.pbis.org/pbis/what-is-pbis · [studies database](https://www.pbis.org/pbis/studies)
- Manolev, J., Sullivan, A., & Slee, R. (2019). *Learning, Media and Technology*, 44(1), 36-51. DOI [10.1080/17439884.2018.1558237](https://doi.org/10.1080/17439884.2018.1558237)
- Settles, B., & Meeder, B. (2016). *Proceedings of ACL 2016*, 1848-1858. DOI [10.18653/v1/P16-1174](https://doi.org/10.18653/v1/P16-1174) · [PDF](https://aclanthology.org/P16-1174.pdf)
- "Audio Matters Too: How Audial Avatar Customization Enhances Visual Avatar Customization." *CHI 2022*. DOI [10.1145/3491102.3501848](https://doi.org/10.1145/3491102.3501848)
- Arnold, D. H., et al. (2021). *Journal of Children and Media* — summarized at [Khan Academy blog](https://blog.khanacademy.org/khan-academy-kids-improves-pre-literacy-skills-in-preschoolers-research-confirms/)
- Sarama, J., & Clements, D. H. — *Learning and Teaching with Learning Trajectories* — https://www.learningtrajectories.org/

### Vendor primary sources

**Prodigy:** [Is Prodigy Math Adaptive?](https://www.prodigygame.com/main-en/blog/is-prodigy-math-adaptive) · [What is Prodigy Math?](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game) · [Parents' Guide](https://www.prodigygame.com/main-en/blog/parents-guide-to-prodigy) · [Placement Test Guide](https://www.prodigygame.com/main-en/blog/prodigy-placement-test) · [Memberships](https://www.prodigygame.com/Memberships/math/) · [teachers](https://www.prodigygame.com/main-en/teachers) · [research](https://webflow.prodigygame.com/main-en/research) · [Waterloo funding news](https://uwaterloo.ca/engineering/news/alumni-company-prodigy-secures-159m-investment)
**Fairplay/FTC:** [complaint PDF (19 Feb 2021)](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf) · [campaign page](https://fairplayforkids.org/pf/prodigy/)
**DreamBox / Discovery:** [DreamBox Math](https://www.discoveryeducation.com/solutions/math/dreambox-math/) · [acquisition release](https://www.discoveryeducation.com/details/clearlake-capital-backed-discovery-education-completes-acquisition-of-dreambox-learning/) · [how it works](https://support.dreambox.com/s/article/How-Does-DreamBox-Work) · [family pricing](https://www.dreambox.com/family/pricing) · [iPad app](https://apps.apple.com/us/app/dreambox-math/id675354945) · [Evidence for ESSA entry](https://www.evidenceforessa.org/program/dreambox-learning/)
**Zearn:** [about](https://about.zearn.org/) · [approach](https://about.zearn.org/approach) · [research](https://about.zearn.org/research) · [terms](https://about.zearn.org/terms) · [pricing](https://about.zearn.org/math-resources/pricing) · [Grade 1 Course Guide](https://webassets.zearn.org/resources/G1_Course_Guide_Z1.pdf) · [Kindergarten Course Guide](https://webassets.zearn.org/resources/GK_Course_Guide_Z1.pdf) · [Evidence for ESSA entry](https://www.evidenceforessa.org/program/zearn-math/)
**ST Math / MIND:** [about](https://www.mindeducation.org/about/) · [ST Math](https://www.mindeducation.org/programs/st-math/) · [Early Learning](https://www.mindeducation.org/programs/st-math-early-learning/) · [The Science of ST Math](https://play.stmath.com/academy/courses/essentials4/nounit/science/) · [research portal](https://rp.stmath.com/pages/publications.html) · [WestEd 2019 PDF](https://rp.stmath.com/assets/pdfs/sxgofjub2d.pdf) · [SRI review](https://www.sri.com/publication/education-learning-pubs/stem-and-computer-science-pubs/st-math-nonregulatory-essa-standards-evidence-review-what-works-clearinghouse-standards-review/) · [ERIC ED559645](https://eric.ed.gov/?id=ED559645)
**Khan Academy Kids:** [khanacademy.org/kids](https://www.khanacademy.org/kids) · [App Store](https://apps.apple.com/us/app/khan-academy-kids/id1378467217) · [blog](https://blog.khanacademy.org/best-early-learning-apps-for-kids/) · [github.com/Khan](https://github.com/Khan)
**Reflex / Frax:** [reflex.explorelearning.com](https://reflex.explorelearning.com/) · [Research Behind Reflex](https://reflex.explorelearning.com/research/research-behind-reflex) · [Explore Reflex](https://reflex.explorelearning.com/about/explore-reflex) · [Unlock Reflex Games](https://reflex.explorelearning.com/resources/insights/unlock-reflex-games) · [Cholmsky 2011 white paper](https://reflex.explorelearning.com/user_area/content_media/raw/Reflex-White-Paper.pdf) · [impact page](https://reflex.explorelearning.com/research/the-impact-of-reflex-on-student-achievement) · [Frax](https://frax.explorelearning.com/) · [Time4MathFacts pricing](https://www.time4mathfacts.com/reflex/)
**IXL:** [Design Principles PDF](https://www.ixl.com/research/IXL_Design_Principles.pdf) · [SmartScore Guide PDF](https://www.ixl.com/materials/SmartScore_Guide.pdf) · [National Norms PDF](https://www.ixl.com/materials/us/research/National_Norms_for_IXL_s_Diagnostic_in_Grades_K-12.pdf) · [Company Milestones PDF](https://www.ixl.com/assets/company/IXL-Company-Milestones.pdf) · [Grade 1 skills](https://www.ixl.com/math/grade-1) · [family pricing](https://www.ixl.com/membership/family/subscribe)
**SplashLearn:** [about](https://www.splashlearn.com/about) · [careers](https://www.splashlearn.com/careers) · [efficacy](https://www.splashlearn.com/efficacy) · [ESSA Level III blog](https://www.splashlearn.com/blog/splashlearn-achieves-essa-level-three-certification/) · [Grade 1 games](https://www.splashlearn.com/math-games-for-1st-graders) · [App Store](https://apps.apple.com/us/app/splashlearn-kids-learning-app/id672658828)
**Math Playground:** [about](https://www.mathplayground.com/about.html) · [ToS](https://www.mathplayground.com/terms_of_service.html) · [Data Security & Privacy Plan](https://www.mathplayground.com/data_security_and_privacy_plan.html) · [Grade 1 games](https://www.mathplayground.com/grade_1_games.html) · [subscribe](https://www.mathplayground.com/subscribe)
**Numberock:** [About Us](https://numberock.com/about-us/) · [example lesson](https://numberock.com/lessons/us-coins/) · [sign-up/pricing](https://numberock.com/sign-up/) · [district pricing FAQ](https://numberock.com/faq/offer-district-pricing/) · [YouTube channel](https://www.youtube.com/channel/UCt9SZgFExNwWTH5T_JnyF-A/videos)
**Bedtime Math:** [homepage](https://bedtimemath.org/) · [Our Team](https://bedtimemath.org/our-team/) · [about](https://bedtimemath.org/about/) · [App Store](https://apps.apple.com/us/app/bedtime-math/id637910701) · [Crazy 8s kit preview](https://crazy8s.bedtimemath.org/Images/Crazy8s-Kit-Preview.pdf) · [Crazy 8s Club](https://crazy8sclub.org/how-it-works/) · [Overdeck Family Foundation bio](https://overdeck.org/about/people/laura-overdeck/) · [UChicago News](https://news.uchicago.edu/story/kids-benefit-when-parents-overcome-math-anxiety)
**Motion Math / Curriculum Associates:** [2017 acquisition release](https://www.curriculumassociates.com/about/press-releases/2017/11/ca-acquires-motion-math-enhance-engagement-strengthen-conceptual-understanding-k-6-students) · [2019 Learning Games release](https://www.curriculumassociates.com/about/press-releases/2019/08/ca-adds-learning-games-help-students-practice-master-mathematical-concepts) · [archived shutdown notice](https://web.archive.org/web/20200721034945/https://www.curriculumassociates.com/products/i-ready/i-ready-learning/motionmath-shutdown) · [i-Ready Learning Games](https://www.curriculumassociates.com/programs/i-ready-learning/learning-games)
**Numberblocks:** [Blue Zoo project page](https://www.blue-zoo.co.uk/projects/numberblocks/) · [Blocks Universe](https://www.blocksuniverse.tv/numberblocks/home) · [NCETM support materials](https://www.ncetm.org.uk/classroom-resources/ey-numberblocks-support-materials/) · [Numberblocks World](https://apps.apple.com/us/app/numberblocks-world/id1520827387) · [Hide and Seek](https://apps.apple.com/us/app/numberblocks-hide-and-seek/id1328950963) · [Meet the Numberblocks](https://apps.apple.com/us/app/meet-the-numberblocks/id1445555400) · [Google Play](https://play.google.com/store/apps/details?id=tv.alphablocks.numberblocksworld&hl=en_US) · [hand2mind cubes](https://www.hand2mind.com/numberblocks)
**Todo Math / Enuma:** [About Us](https://enuma.com/en/aboutUs/) · [enuma.com](https://enuma.com/en/) · [App Store](https://apps.apple.com/us/app/todo-math/id666465255) · [Global Learning XPRIZE](https://www.xprize.org/prizes/global-learning)
**Osmo:** [playosmo.com](https://www.playosmo.com/) · [about](https://www.playosmo.com/en-US/about/) · [why-osmo](https://www.playosmo.com/en-US/why-osmo/) · [FAQ](https://www.playosmo.com/en-US/faq/) · [Genius Numbers](https://www.playosmo.com/products/genius-number) · [Math Wizard Series](https://www.playosmo.com/products/math-wizard-series) · [Math Wizard App Store](https://apps.apple.com/us/app/osmo-math-wizard/id1470095030) · [Numbers App Store](https://apps.apple.com/us/app/osmo-numbers/id1531762562) · [BYJU'S acquisition release](https://www.webwire.com/ViewPressRel.asp?aId=234341)
**Boddle:** [about](https://www.boddlelearning.com/about) · [Premium](https://www.boddlelearning.com/premium) · [student support](https://www.boddlelearning.com/support-categories/student-classroom) · [ESSA study article](https://www.boddlelearning.com/article/boddle-essa-study-math-confidence)
**Matific:** [matific.com](https://www.matific.com/us/en-us/home/) · [terms](https://www.matific.com/us/en-us/home/terms/) · [parents](https://www.matific.com/us/en-us/home/parents/) · [research and efficacy](https://www.matific.com/us/en-us/home/why-matific/research-and-efficacy/)
**Reading Eggs / Mathseeds (Blake eLearning, 3P Learning):** [readingeggs.com](https://readingeggs.com/) · [mathseeds.com](https://mathseeds.com/)
**Duolingo:** [how the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) · [research.duolingo.com](https://research.duolingo.com/)

### Open source, licensing, and compliance

- GCompris — https://github.com/gcompris/GCompris-qt · https://invent.kde.org/education/gcompris · https://gcompris.net
- TuxMath — https://github.com/tux4kids/tuxmath
- Khan Perseus — https://github.com/Khan/perseus · KaTeX — https://github.com/KaTeX/KaTeX · math-input (archived) — https://github.com/Khan/math-input · khan-exercises (archived, unlicensed) — https://github.com/Khan/khan-exercises
- Kolibri — https://github.com/learningequality/kolibri · Studio — https://github.com/learningequality/studio
- The Number Race — https://sourceforge.net/projects/numberrace/ · [wiki](https://sourceforge.net/p/numberrace/wiki/Home/) · [SourceForge write-up](https://sourceforge.net/blog/potm-201111/)
- Phaser — https://github.com/phaserjs/phaser · PixiJS — https://github.com/pixijs/pixijs · Excalibur — https://github.com/excaliburjs/Excalibur · KAPLAY — https://github.com/kaplayjs/kaplay · Godot — https://github.com/godotengine/godot
- ts-fsrs — https://github.com/open-spaced-repetition/ts-fsrs · py-fsrs — https://github.com/open-spaced-repetition/py-fsrs · FSRS4Anki — https://github.com/open-spaced-repetition/fsrs4anki
- Blockly Games — https://github.com/blockly-games/blockly-games · Blockly — https://github.com/RaspberryPiFoundation/blockly
- MathLive — https://github.com/arnog/mathlive · Compute Engine — https://github.com/cortex-js/compute-engine · mathsteps (archived) — https://github.com/google/mathsteps
- PhET Number Play — https://github.com/phetsims/number-play · Number Line Operations — https://github.com/phetsims/number-line-operations
- Piper (archived) — https://github.com/rhasspy/piper · piper1-gpl — https://github.com/OHF-Voice/piper1-gpl · voices — https://huggingface.co/rhasspy/piper-voices
- Kenney assets (CC0) — https://kenney.nl/assets · https://kenney.nl/support · OpenGameArt FAQ — https://opengameart.org/content/faq · Freesound FAQ — https://freesound.org/help/faq/
- Illustrative Mathematics terms of use — https://illustrativemathematics.org/terms-of-use/ · IM K-5 — https://im.kendallhunt.com/k5/curriculum.html · IM v.360 — https://accessim.org/k5 · Open Up Resources K-5 — https://access.openupresources.org/curricula/our-k5-math
- EngageNY archive (NYSED) — https://www.nysed.gov/curriculum-instruction/engageny-mathematics-curriculum-files-archive · OpenStax K-12 — https://openstax.org/k12/algebra
- Toy Theater terms — https://toytheater.com/terms/
- FTC COPPA FAQ — https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions · FTC children's privacy — https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy

**Reward economies:** ClassDojo — [help center: skills/points](https://help.classdojo.com/hc/en-us/articles/202027539-Customize-Add-and-Edit-Skills-Points) · [awarding points](https://help.classdojo.com/hc/en-us/articles/207811096-How-To-Award-Points-to-Students) · [redeeming](https://help.classdojo.com/hc/en-us/articles/205647205-How-to-Redeem-Class-Points) · [resetting](https://help.classdojo.com/hc/en-us/articles/34014542792973-Reset-Student-Point-Bubbles) · [monster customization](https://help.classdojo.com/hc/en-us/articles/202739645-Customize-Your-Monster) · [Dojo Islands teacher FAQ](https://help.classdojo.com/hc/en-us/articles/8195127864717-Dojo-Islands-FAQ-for-Teachers) · [home FAQ](https://help.classdojo.com/hc/en-us/articles/25040486728973-Dojo-Islands-for-Home-FAQ) · [Classroom Rewards](https://help.classdojo.com/hc/en-us/articles/48066863473677-Classroom-Rewards-for-Dojo-Islands)
Khan Academy — [energy points/badges/avatars](https://support.khanacademy.org/hc/en-us/articles/202487710-What-are-energy-points-badges-and-avatars) · [gems](https://support.khanacademy.org/hc/en-us/articles/38505636598413-How-do-I-earn-gems-in-the-reimagined-Khan-Academy-experience) · [Khanmigo accessories](https://support.khanacademy.org/hc/en-us/articles/42456912953997-How-can-I-customize-Khanmigo-and-unlock-new-Khanmigo-accessories) · [weekly streak](https://support.khanacademy.org/hc/en-us/articles/46962453239437-What-is-a-streak-and-how-do-I-keep-it-going-in-the-reimagined-Khan-Academy-experience) · [what's changing](https://support.khanacademy.org/hc/en-us/articles/46056261189773-What-s-changing-for-students-on-the-reimagined-Khan-Academy)
Khan Academy Kids help center — [progress](https://khankids.zendesk.com/hc/en-us/articles/360041615571-How-does-the-learning-level-adjust-and-how-do-I-view-my-child-s-progress) · [avatars](https://khankids.zendesk.com/hc/en-us/articles/360007053871-How-do-I-change-the-avatar-for-a-user)
Epic! — [reading activity](https://support.getepic.com/hc/en-us/articles/115000867666-How-can-I-view-my-child-s-reading-activity) · [badges](https://support.getepic.com/hc/en-us/articles/205626365-How-do-achievements-and-badges-work) · [audiobooks and goals](https://support.getepic.com/hc/en-us/articles/45797785703565-How-do-Audiobooks-and-Read-to-Me-Books-count-toward-reading-goals-on-Epic)
Mathletics — [earning points](https://knowledgebase.mathletics.com/en_US/rewards-and-recognition/how-can-students-earn-points-in-mathletics) · [certificates](https://knowledgebase.mathletics.com/celebrate-learning/1-mathletics-certificates) · [features](https://www.mathletics.com/us/features/)
Boddle — [currencies](https://intercom.help/boddle/en/articles/7792630-knowledge-points-gold-battle-points-pet-points-and-boddle-bucks) · [getting pets](https://intercom.help/boddle/en/articles/8201941-getting-new-pets) · [quests](https://intercom.help/boddle/en/articles/7846677-quests) · [shop](https://intercom.help/boddle/en/articles/8201956-shop)
Reading Eggs [why it works](https://readingeggs.com/about/why-it-works/) · [FAQ](https://readingeggs.com/info/faqs/) · Mathseeds [why it works](https://mathseeds.com/about/why-it-works/)
Zearn — [Math Motivation Supplies](https://about.zearn.org/math-resources/math-motivation-supplies) · [How Zearn Math Works](https://about.zearn.org/how-zearn-math-works)
IXL — [awards](https://www.ixl.com/awards) · [SmartScore blog](https://blog.ixl.com/2020/11/11/ixl-smartscore-the-key-to-mastery-based-learning/) · [growth mindset](https://blog.ixl.com/2019/11/21/growth-mindset-and-the-ixl-smartscore/)
Duolingo — [Improving the streak](https://blog.duolingo.com/improving-the-streak/) · [App Store listing](https://apps.apple.com/us/app/duolingo-language-lessons/id570060128)
Fairplay/Prodigy — [FTC complaint PDF](https://fairplayforkids.org/wp-content/uploads/2021/02/Prodigy_Complaint_Feb21.pdf) · [press release](https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/) · [campaign page](https://fairplayforkids.org/prodigy/) · [JHU CRRE evaluation](https://jscholarship.library.jhu.edu/handle/1774.2/62841)

### Follow-ups worth one manual retrieval

1. **Hanus & Fox (2015)** full text — the headline counter-case, and we currently have **zero numbers** from it. No OA copy exists; needs library access.
2. **Sepúlveda et al. (2026)** kindergarten streak study — the only paper on our exact question.
3. **Sailer & Homner (2020)** CC-BY PDF — its education-level moderator table would sharpen §5.3 (Springer blocks automated fetch; a browser session will get it).
4. ***ETR&D* (2024)**, "Gamification enhances student intrinsic motivation, perceptions of autonomy and relatedness, but minimal impact on competency," DOI [10.1007/s11423-023-10337-7](https://doi.org/10.1007/s11423-023-10337-7) — the title runs directly against the needs-mapping in §5.3; resolve before committing to that framing.
5. **Prodigy's response to the FTC complaint, and any FTC action** — currently unverified in both directions.
6. Duolingo gem/shop pricing beyond the 400-gem streak-freeze refill, and league tier rules — the help center is a JS SPA that returns an empty shell to any fetcher.

### Items marked UNVERIFIED in this document

Prodigy's response to the Fairplay/FTC complaint and any FTC action (unverified in both directions); Khan Academy *legacy* badge-tier point thresholds (deliberately unpublished); Duolingo gem/shop prices beyond the 400-gem streak-freeze refill, league tier rules, the Hearts→Energy rename date, and whether a Duo outfit shop currently exists; SplashLearn's detailed reward mechanics (support center 403s on every path); Todo Math's sticker/streak specifics and the Locomotive Labs lineage (current App Store publisher is Enuma, Inc.); Cameron, Banko & Pierce (2001) specific *d* values (PMC copy is an image scan); Mekler et al. (2017) exact statistics; **all** Hanus & Fox (2015) statistics; Christy & Fox (2014) exact means/N; Sailer & Homner's education-level moderator table; Birk et al. (2016) path coefficients; Mayer's *d* ≈ 1.11 personalization figure (**do not use — cite Ginns et al. 2013 instead**); any PBIS effect size; any Ryan & Deci (2020) gamification-specific passage (the abstract does not mention gamification — do not attribute one); Kim & Castelli's per-cell *n* column (internally inconsistent — re-check before external quotation); founding years/founders for Prodigy (SMARTeacher Inc.), DreamBox, Zearn, SplashLearn, Numberock, ExploreLearning; Math Playground's owner-founder; Reflex's Green Light threshold and fluency time cut-off; ST Math's per-level mastery thresholds, device matrix and pricing; school/district dollar figures for ST Math, Zearn (current), Reflex, SplashLearn, Todo Math, Matific; Khan Academy Kids' K-1 math scope and sequence and its detailed reward mechanics; Zearn's native-app availability; Numberblocks' named curriculum consultant (Dr. Rebecca Hanson — corroborated by NCETM's Primary Director on LinkedIn but not by any first-party BBC/Blue Zoo page); Numberblocks efficacy research (likely none exists); Todo-Math-specific efficacy; Osmo efficacy (none published); Cameron & Pierce's counter-meta-analysis figures; whether any gamification meta-analysis breaks out ages 6-7; Open Up Resources' licensing FAQ (403); NYSED EngageNY exact CC version string (TLS failure); Math Learning Center app licensing (403, strongly negative); Didax virtual manipulatives licensing (not checked); ESSA Tier 3 and Tier 4 definitions (WWC page covered only Tiers 1-2); Fyfe et al. concreteness-fading paper abstract (paywalled — the WWC Rec 3 evidence is cited in its place).
