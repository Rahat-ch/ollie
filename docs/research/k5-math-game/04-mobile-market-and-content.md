# Mobile Kids-Math Market + K–5 Math Content Map

**Research date:** 2026-09-09. All store metrics were pulled live on that date from Apple's iTunes Lookup/Search API, Apple's public customer-review RSS feed, and Google Play listing pages. Ratings and review counts move daily; treat them as a snapshot.

**Scope note:** ST Math, Zearn, DreamBox, Prodigy pedagogy, Khan Academy Kids pedagogy and Reflex are covered in depth by a separate researcher. They appear here only as market data points.

---

## 10-bullet decision-relevant summary

1. **Nobody in K–5 math uses voice as the primary answer channel.** Across 24 listings checked, the only speech *input* found is Duolingo ABC's read-aloud recognition (literacy, not math) and Khan Academy Kids' microphone-permission activities ([CSM](https://www.commonsensemedia.org/app-reviews/khan-academy-kids)). Everything else uses tap/drag/trace. Voice-in is a genuinely open lane — and the reviews say why it's hard (see #2).
2. **Child ASR is the single biggest execution risk.** Duolingo ABC's speech feature draws repeated 1–3★ reviews from parents of 3–6 year olds: *"the audio recognition is completely useless… she reads the word perfectly and it says she was wrong"* ([App Store reviews, id 1440502568](https://itunes.apple.com/us/rss/customerreviews/id=1440502568/sortby=mostrecent/json)). Any voice-first design needs a always-available tap fallback, generous number-word matching, and never a hard "wrong" on a recognition failure.
3. **Audio *output* is table stakes, and its failure kills apps.** Mathseeds' most recent negative reviews are almost entirely "sound stops working, app is useless because audio is required" ([id 1632175905](https://itunes.apple.com/us/rss/customerreviews/id=1632175905/sortby=mostrecent/json)). Narration must degrade gracefully.
4. **Paywall friction is the #1 complaint category in every paid app we sampled** — 22/37 low-star SplashLearn reviews, 28/74 HOMER, 18/35 Lingokids, 13/36 Prodigy, 10/26 Todo Math mention price/subscription/trial. The pattern that generates rage is *free-looking install → hard wall on first session*.
5. **The reward economy that scales is currency → cosmetics, not currency → power.** Prodigy's paid tiers gate pets/gear/zones and Common Sense Media's verdict is blunt: *"the math part of the game is an afterthought"* and *"leveling up is partly determined by points that are more easily earned as a paid user"* ([CSM](https://www.commonsensemedia.org/app-reviews/prodigy-math-game)). Selling advantage inside a learning loop is the trap to avoid.
6. **Streaks work, and Duolingo has the only public hard numbers.** Duolingo's 2025 10-K: *"about 43 million daily active users with a 7-day streak or longer, and about 15 million… with a 365-day streak or longer"* ([SEC 10-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm)); their blog reports 7-day-streak learners are **3.6×** more likely to complete a course, milestone animations gave **+1.7%** D7 retention, and a second Streak Freeze gave **+0.38%** DAU ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)). Ship the freeze/forgiveness mechanic *with* the streak, not after.
7. **Apple's Kids Category is the right home and it constrains the design.** 16 of the 24 apps checked carry a "Made for Ages" badge. Guideline 1.3/5.1.4 forbid third-party analytics and behavioural ads, require a parental gate for any purchase or outbound link, and lock you in once shipped ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). Design the parent surface as a gated area from day one.
8. **Grade 1 is 21 standards across 4 domains** (8 × 1.OA, 6 × 1.NBT, 4 × 1.MD, 3 × 1.G) — small enough to cover completely in an MVP ([CCSSM, pp. 15–16](https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf)). The Grade 1 fluency target is narrow and specific: **add/subtract within 20, fluent within 10** (1.OA.C.6).
9. **Roughly 60% of Grade 1 standards are answerable by a spoken number or word; ~30% need a visual to *read* but still a spoken answer; ~10% (1.NBT.C.4/C.6, 1.G.A.2) are genuinely manipulative-shaped.** See the Grade 1 table. That's a viable voice-first MVP with tap fallbacks in three places.
10. **Timed drill is contested and you should not build it for 6-year-olds.** NCTM's position is that *"Timed tests do not assess fluency and can negatively affect students, and thus should be avoided"* ([NCTM](https://www.nctm.org/Standards-and-Positions/Position-Statements/Procedural-Fluency-in-Mathematics/)), while the National Math Advisory Panel explicitly recommends practice to automaticity and endorses well-designed CAI drill ([NMAP 2008](https://files.eric.ed.gov/fulltext/ED500486.pdf)). The reconcilable design: untimed, strategy-scaffolded practice with self-paced repetition — which is also what Monster Math markets ("No time limits, no penalties").

---

# PART A — The mobile market

## A1. How the candidate list was verified

Every app below was confirmed to exist and be currently listed by direct lookup against Apple's iTunes API (`itunes.apple.com/lookup?id=…`) and, where a package could be resolved, against its live Google Play listing. Notable corrections to the brief's candidate list:

| Candidate | Status |
|---|---|
| **Duolingo Math** (standalone) | **Discontinued as a standalone app.** No `com.duolingo.math` package on Google Play; no standalone iOS listing. Duolingo's 10-K states *"Math, Music, and Chess courses are also integrated into the Duolingo App"* ([10-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm)). Math now lives inside the main Duolingo app. |
| **DragonBox Numbers / Algebra** | Alive but rebranded and subscription-gated as **Kahoot! Numbers by DragonBox** / **Kahoot! Algebra by DragonBox**, published by Kahoot ASA, requiring a Kahoot! Kids subscription ([listing](https://apps.apple.com/us/app/id1529174508)). |
| **Zapzapmath** | Listed but **abandoned** — last iOS update 2022-08-12, 310 ratings ([id 1003605763](https://apps.apple.com/us/app/id1003605763)). |
| **Quick Math Jr** | Listed but **abandoned** — last update **2016-07-12**, 3.60★ ([id 926078360](https://apps.apple.com/us/app/id926078360)). |
| **Elephant Learning** | Effectively dead on iOS — 2.18★ from 17 ratings, last update 2024-11 ([id 1153181621](https://apps.apple.com/us/app/id1153181621)). |
| **Marble Math Junior** | Listed, still $3.99 one-time, but last updated **2019-10-26** ([id 528617628](https://apps.apple.com/us/app/id528617628)). |
| **Moose Math** | Listed, free, no IAP, last updated 2023-11-29 ([id 660345152](https://apps.apple.com/us/app/id660345152)). Maintenance mode. |
| **ST Math** | **No consumer App Store presence** — school-licensed, reached via Clever/ClassLink. Not a mobile-market comparable. |
| **Mathletics** | Companion app only, 2.98★ / 140 ratings ([id 1369836502](https://apps.apple.com/us/app/id1369836502)). School-license product. |
| **Duolingo ABC** | Live, but the **iOS build is stale**: version 1.96.2, released **2023-08-02** ([id 1440502568](https://apps.apple.com/us/app/id1440502568)), while the Android build shows "Updated on Aug 24, 2026" ([Play](https://play.google.com/store/apps/details?id=com.duolingo.literacy)). Treat iOS ABC as deprioritised. |
| **Osmo Numbers** | Live but **requires Osmo Base + physical tiles**; 3.75★ / 144 ratings ([id 1531762562](https://apps.apple.com/us/app/id1531762562)). Hardware dependency. |
| **Kodable** | Coding, not math — excluded. |
| **Bedtime Math** | Live but tiny (65 ratings) and last updated 2023 ([id 637910701](https://apps.apple.com/us/app/id637910701)). Content-feed model, not a game. |

## A2. Comparison table

App Store rating / review count = US storefront, retrieved 2026-09-09 via `itunes.apple.com/lookup`. "Kids Cat." = carries a "Made for Ages X–Y" badge on its App Store page, which is Apple's Kids Category marker.

| App | Developer | Platforms | Stated ages | Pricing (US IAP, from listing) | App Store ★ / reviews | Kids Cat. | Core loop (one line) | Reward / gamification systems | Voice & audio | Curriculum claimed |
|---|---|---|---|---|---|---|---|---|---|---|
| **[SplashLearn](https://apps.apple.com/us/app/id672658828)** | StudyPad, Inc. | iOS, [Android](https://play.google.com/store/apps/details?id=com.splash.kids.education.learning.games.free.multiplication.reading.math.grade.app.splashmath), web | 2–11 | Free trial → $7.99–$11.99/mo; $69.99–$89.99/yr | 4.51 / 32,086 | ✅ Ages 6–8 | Adaptive skill game inside themed "learning worlds"; finish games to earn currency | Coins, "rewards and new characters", learning worlds; real-time parent progress tracking | Narration ("hear the word, see the word, say the word") — reading strand; **no voice input** | "Preschool to Grade 5 curriculum for both Math and Reading"; claims 60M kids, "1 in 3 US schools" |
| **[Prodigy Math Game](https://apps.apple.com/us/app/id950795722)** | Prodigy Education Inc. | iOS, [Android](https://play.google.com/store/apps/details?id=com.prodigygame.prodigy), web | 4+ rating; grades 1–8 | Free; Core $12.99/mo or $74.99/yr; Plus $19.99/$114.99; Ultra $25.99/$154.99; Magicoin packs $0.99–$9.99 | 4.76 / 243,091 | ❌ | Fantasy RPG: explore zones, battle monsters/players, each attack gated behind a math question | Wizard avatar, level 1→100, 100+ pets, 300+ items, member-only zones, Magicoin/Wishcoin currency, daily goals, parent-set Goals + 40+ in-game Rewards | Audio present; **no voice input** | "Fully aligned with state-level curricula"; 1,500 skills, 50,000+ questions |
| **[Khan Academy Kids](https://apps.apple.com/us/app/id1378467217)** | Khan Academy | iOS, [Android](https://play.google.com/store/apps/details?id=org.khankids.android) | 2–8 | **Free, no IAP** (nonprofit) | 4.80 / 130,164 | ✅ Ages 0–5 | Guided path with animal characters; mixed games, books, videos | Light: stars, character companions (Kodi, Ollo, Reya, Peck, Sandy); no currency or streak | Full read-aloud narration; **microphone permission for some activities** | "Standards-aligned"; Head Start + Common Core; PreK–Grade 2 |
| **[Todo Math](https://apps.apple.com/us/app/id666465255)** | Enuma, Inc. | iOS, [Android](https://play.google.com/store/apps/details?id=com.enuma.todomath) | Pre-K–Grade 2 | Free tier (limited plays) → $49.99–$99.99/yr; $89.99–$119.99/2yr | 4.70 / 1,142 | ✅ Ages 6–8 | Daily mission of short activities across counting/calculation/geometry/time | "Adorable collectibles", map pieces, mission completion; Parents Page for level + progress | Audio narration; **no voice input**; finger-tracing number entry | "Common Core State Standards-aligned"; 2,000+ activities Pre-K–2 |
| **[Monster Math](https://apps.apple.com/us/app/id931943412)** | Makkajai Edu Tech | iOS, [Android (Monster Math 2)](https://play.google.com/store/apps/details?id=com.makkajai.monstermath2free) | Grades 1–3 | Free trial → $9.99 / $44.99 / $59.99 ("Premium", $59.99/yr) | 4.51 / 34,201 | ✅ Ages 6–8 | Planet-hopping missions; each mission drills one fact-strategy | Badges, planets, missions, profile; "no time limits, no penalties"; parent progress reports marked *coming soon* | Audio; **no voice input** | Common Core + state curricula; grounded in Dr. Jennifer Bay-Williams' fact-fluency work |
| **[Math Kids](https://apps.apple.com/us/app/id1272098657)** (RV AppStudios) | RV AppStudios LLC | iOS, [Android](https://play.google.com/store/apps/details?id=com.rvappstudios.math.kids.counting) | Toddler–1st grade | **Free, no IAP** | 4.61 / 8,610 | ✅ Ages 0–5 | Mini-game carousel: count, compare, add, subtract, match | Stickers; minimal | Audio; **no voice input** | Informal — counting, comparison, add/subtract |
| **[Kahoot! Numbers by DragonBox](https://apps.apple.com/us/app/id1529174508)** | Kahoot ASA | iOS, [Android](https://play.google.com/store/apps/details?id=com.kahoot.numbers) | 4–8 | **Subscription required**: Kahoot! Kids $5.99/mo, $35.99/yr, or $19.99 one-time | 4.64 / 4,297 | ✅ Ages 0–5 | Manipulate "Nooms" (number creatures) — stack, slice, combine — in Sandbox, Puzzle, Run, Play modes | Deliberately minimal: *"no quizzes or mindless repetitions"*; progression through activities | Audio; **no voice input** | Number sense, addition/subtraction 1–20 |
| **[Kahoot! Algebra by DragonBox](https://apps.apple.com/us/app/id1550574178)** | Kahoot ASA | iOS, [Android](https://play.google.com/store/apps/details?id=com.kahoot.algebra5) | 5+ | Same Kahoot! Kids subscription | 4.65 / 1,065 | ✅ Ages 6–8 | Card-manipulation puzzle that gradually reveals equation-solving | Level progression, star ratings | Audio; **no voice input** | "Addition, division, multiplication" as equation operations |
| **[Kahoot! Kids](https://apps.apple.com/us/app/id6444439181)** | Kahoot ASA | iOS, [Android](https://play.google.com/store/apps/details?id=com.kahoot.kids) | 3–12 | $5.99/mo; $35.99–$47.99/yr; free tier = 1 profile, 1 daily challenge ([kahoot.com/kids](https://kahoot.com/kids/)) | 4.59 / 3,343 | ✅ Ages 0–5 | Hub launching 10 bundled apps (DragonBox math, Poio reading, chess, quizzes) | Bundle unlock; per-app progression; profile management + screen-time limits | Read-aloud in quiz games; **no voice input** | Math, literacy, chess, SEL across ages 3–12 |
| **[Matific](https://apps.apple.com/us/app/id1440019986)** | Matific | iOS, Android, web | 4–12 (K–6) | 7-day trial → $19.99/mo; $78.99/yr | 4.67 / 1,134 | ✅ Ages 6–8 | Adventure-island map; adaptive episodes unlock new island areas | **Avatar customisation**, treasure collection, unlockable island areas tied to mastery; email progress digests to parents | *"audio prompts for younger students not yet reading"*; **no voice input** | "Fully aligned with the US and Canada primary school math curriculum… K to 6" |
| **[Boddle](https://apps.apple.com/us/app/id1520367760)** | Boddle Learning Inc | iOS, [Android](https://play.google.com/store/apps/details?id=com.boddle.learning), web | K–6 | Premium $9.99/mo, $48.99/yr; **Boddle Bucks currency packs $0.99–$19.99** | 4.45 / 11,307 | ❌ | 3D world: quests + pet battles + mini-games, gated by practice questions | Pets (collect/battle), character customisation, quests, **daily goals and daily rewards**, purchasable currency; parent + teacher progress reports | Audio; **no voice input** | K–6 math, ELA, NGSS-aligned science |
| **[MathTango](https://apps.apple.com/us/app/id6475483877)** | Piknik (Toca Boca / Sago Mini / Originator bundle) | iOS | 5–10+ | Piknik Unlimited $9.99–$11.99/mo, $49.99–$79.99/yr; MathTango-only $7.99/mo | 4.63 / 3,984 | ✅ Ages 6–8 | Two worlds (add/sub island, mult/div starbase); endless missions build a world | **Collect monsters, build worlds**, earn in-game items; 100% ad-free, no IAP inside the app | Audio; **no voice input** | "Common Core based curriculum", 40+ levels, 500+ games |
| **[Mathseeds](https://apps.apple.com/us/app/id1632175905)** | Blake eLearning | iOS, [Android](https://play.google.com/store/apps/details?id=com.blake.mathseeds) | 3–9 | $6.99/mo, $49.99/yr; bundle w/ Reading Eggs $13.99/$99.99 | 4.61 / 246 | ❌ | 200 sequenced lessons on a map, 15 min/day, with end-of-map quizzes | Map progression, "fun rewards", end-of-map quizzes + "Driving Tests" for mastery; parent dashboard + detailed reports | **Audio-dependent** (a known failure point in reviews); no voice input | Common Core; "no math skills to a Grade 3 level" |
| **[Marble Math Junior](https://apps.apple.com/us/app/id528617628)** | Artgig Studio | iOS | Early elementary | **$3.99 one-time, no IAP** (last updated 2019) | 4.62 / 1,943 | ✅ Ages 6–8 | Tilt/drag a marble through a maze collecting the numbers that solve the problem | High score, earn new marbles + bonuses; unlimited profiles; parent-configurable problem types | *"audio questions for emerging readers"* — tap a problem to hear it spoken; **no voice input** | "Based on the Common Core Curriculum"; shapes, sequencing, +/−/× to 100, fractions, money, time |
| **[DoodleMath](https://apps.apple.com/us/app/id598196680)** | Discovery Education | iOS, Android, web | K–5 | $7.99–$10.99/mo per student; $60.99–$94.99/yr; lifetime $169.99 | 4.01 / 235 | ❌ | Placement test → daily personalised work programme, ~10 min/day | **Badges + stars for completing daily exercises, traded in for rewards (build a robot)**; explicitly "rewards effort over ability"; free parent hub | *"audio dictation"* accessibility option; **no voice input** | "Aligned to Common Core Standards for Kindergarten through 5th-grade math" |
| **[Lingokids](https://apps.apple.com/us/app/id1002043426)** | Monkimun Inc | iOS, Android | 2–8 | $14.99–$15.99/mo; $71.99–$89.99/yr | 4.27 / **646,893** | ✅ Ages 0–5 | "Playlearning" playlist of 4,000+ short activities, songs, shows across subjects | Character/IP collection (Disney, Blippi, Pocoyo), activity variety; progress reports + parent community; 4 child profiles; ad-free | Heavy narration and song; **no voice input** in math | 650+ learning objectives across math, literacy, science, SEL — math is one strand, not the spine |
| **[HOMER](https://apps.apple.com/us/app/id601437586)** | Homer | iOS, Android | 2–8 | $7.99–$12.99/mo; $59.99/yr | 4.43 / 25,360 | ✅ Ages 0–5 | Personalised daily "learning path" of stories, games, songs | Character personalisation, path progression; up to 4 profiles; parent printables | Narration throughout; **no voice input** | Reading/phonics first; math + SEL secondary |
| **[Numberblocks World](https://apps.apple.com/us/app/id1520827387)** | Blue-Zoo / Alphablocks Ltd | iOS, Android | 3+ (core 4–6) | 7-day trial → $7.99/mo, $29.99/yr | 4.11 / 303 | ✅ Ages 0–5 | Watch a Numberblocks episode, then play the matching number game/quiz | Level unlocks tied to number skills; **three subitising games**; quizzes show mastery | Full narration + songs; **no voice input** | Built with NCETM (UK); "compatible with all early years curricula" — UK, not Common Core |
| **[Osmo Numbers](https://apps.apple.com/us/app/id1531762562)** | Tangible Play | iOS (requires Osmo Base + tiles) | 5–12 | Hardware purchase; app free | 3.75 / 144 | ❌ | Place physical dot/digit tiles in front of the camera to pop bubbles and free fish | Fish collection (100+), world map | Audio; **no voice input**; input is *physical tiles* | Counting, addition, subtraction, multiplication |
| **[Duolingo](https://apps.apple.com/us/app/id570060128)** (contains Math) | Duolingo | iOS, [Android](https://play.google.com/store/apps/details?id=com.duolingo) | 4+ rating; general audience with age-gate | Free; Super $9.99–$12.99/mo, $79.99–$119.99/yr; gem packs $0.99–$19.99 | 4.72 / **5,435,872** | ❌ | Bite-sized lesson → XP → streak; path of units | **The reference implementation**: streak + Streak Freeze, XP, gems, hearts, daily quests, leagues/leaderboards, badges, Duo character | Speech recognition for language speaking exercises; math is tap-based | "Standards-aligned math lessons for elementary school, middle school, and high school" |
| **[Duolingo ABC](https://apps.apple.com/us/app/id1440502568)** | Duolingo | iOS (stale, v1.96.2 / 2023-08-02), [Android](https://play.google.com/store/apps/details?id=com.duolingo.literacy) (10M+ installs) | Preschool–Grade 2 | **Free, no IAP** | 4.25 / 3,794 | ✅ Ages 0–5 | 700+ bite-sized literacy lessons + interactive stories | "Fun mini games and rewards"; bite-sized lesson structure inherited from Duolingo | **Speech recognition for read-aloud** — the most-complained-about feature in its reviews | Phonics, sight words, vocabulary; literacy only, no math |
| **[Moose Math](https://apps.apple.com/us/app/id660345152)** | Duck Duck Moose (Khan Academy) | iOS, [Android](https://play.google.com/store/apps/details?id=com.duckduckmoosedesign.km) | 3–7 | **Free, no IAP**; last updated 2023 | 4.23 / 582 | ✅ Ages 0–5 | 5 activities (Moose Juice, Pet Bingo, Paint Pet, Lost & Found, Dot to Dot) | **Earn rewards to build and decorate your own city** — the cleanest earn→cosmetic loop in the set; Report Card for parents/teachers | Audio; **no voice input** | "Aligned with Common Core State Standards for Kindergarten and 1st Grade" |
| **[Mathletics Students](https://apps.apple.com/us/app/id1369836502)** | 3P Learning | iOS, Android | School K–12 | School license (companion app, no consumer IAP) | **2.98** / 140 | ❌ | Companion to the school web product: curriculum activities, Live Mathletics | Live Mathletics head-to-head, Multiverse, Play Paws games | Audio; **no voice input** | Curriculum-aligned (multi-region) |
| **[ABCmouse](https://apps.apple.com/us/app/id6460300848)** | Age of Learning, Inc. | iOS, Android | 2–8 | Subscription | 4.13 / 133,878 | *not checked* | Learning-path "step" progression across a virtual campus | Tickets → virtual items/pets/room decoration (long-standing model) | Narration; **no voice input** | PreK–2nd grade, multi-subject |

**Also verified as listed but not recommended as references:** Zapzapmath (abandoned 2022), Quick Math Jr (abandoned 2016), Elephant Learning (2.18★/17), Bedtime Math (65 ratings), Endless Numbers ([id 804360921](https://apps.apple.com/us/app/id804360921), last update 2022), Monster Math 2 ([id 1025450732](https://apps.apple.com/us/app/id1025450732)).

## A3. Deep dives on the six strongest gamification references

### 1. Duolingo (main app — the streak/XP/gem canon)

- **What you earn:** XP per lesson; gems as a soft currency; a streak day for completing at least one lesson.
- **What a streak day is:** *"the number of days in a row you've completed a lesson"* — one lesson, no minimum time ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)).
- **Forgiveness:** the **Streak Freeze** pauses a streak for one day; learners can equip **up to two at a time**. Duolingo explicitly frames this as goal-pursuit "slack" research, citing a UPenn/UCLA study, and reports that moving from one to two equippable Freezes **increased daily active learners by +0.38%**.
- **Loss aversion by design:** Duolingo states outright that as streaks lengthen the mechanic switches from novelty reward to *"loss aversion, an internal bias in your brain that makes you particularly averse to losing something."*
- **Milestone celebration matters measurably:** new milestone-day animations *"increased the likelihood a brand new learner was still using Duolingo 7 days later by +1.7%."*
- **Efficacy claim:** *"learners who reach a streak of just 7 days are 3.6 times more likely to complete their course."*
- **Spend side:** gems buy Streak Freezes, outfits for Duo, timer boosts and heart refills; gem packs are sold at $0.99–$19.99 and Super Duolingo removes hearts/ads ([App Store IAP list](https://apps.apple.com/us/app/id570060128)).
- **Scale evidence:** 52.7M DAU in Q4 2025 (up 30% YoY), DAU/MAU 39.6%, $1.038B FY2025 revenue, and **43M DAU on a 7-day+ streak / 15M on a 365-day+ streak** ([10-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm)).
- **Parental gate / kids posture:** the main Duolingo app is *general audience* with age-gating; only Duolingo ABC is aimed at under-13s and it *"does not collect personal information directly from the user beyond that required to use the app"* (10-K). **Under-13s who identify as such receive an ad-free version with restricted information practices.** That is the compliance shape to copy.

**Lesson for us:** copy the *structure* (one-unit-per-day streak, two-freeze forgiveness, celebratory milestone animation, XP as effort currency, gems as cosmetic currency) but not the hearts/leagues. Leagues are competitive-social and inappropriate under Apple's Kids Category rules and for a 6-year-old.

### 2. Duolingo ABC (the kids-facing adaptation — and its cautionary tale)

- Free, no IAP, Kids Category (Ages 0–5), 700+ bite-sized lessons and interactive stories, "fun mini games and rewards" ([listing](https://apps.apple.com/us/app/id1440502568)).
- **Uses speech recognition** for read-aloud. This is the closest existing analogue to our voice-input plan, and it is the single largest source of its negative reviews:
  - *"Horrible audio recognition… There are times when she doesn't make any sound similar to the word it's asking her to read and it will say the answer was right and then other times when she reads the word perfectly and it says she was wrong."* (2★)
  - *"when my 6y old tries the voice function it says it's wrong. I've tried it myself and we've tried on different devices… the talking function doesn't work which is most of what she's working on."* (3★)
  - *"There is this talking mechanism where it asks you to repeat a sentence/word… it is broken. Everyone in my family has tried to do it and the app keeps saying it is wrong."* (3★)
  ([reviews feed](https://itunes.apple.com/us/rss/customerreviews/id=1440502568/sortby=mostrecent/json))
- The iOS build has not shipped since **2023-08-02**, suggesting internal deprioritisation of the standalone kids app.

**Lesson for us:** *both* false positives and false negatives destroy trust, and the false-negative is worse — a 6-year-old who answers correctly and is told "wrong" learns that the app is unfair. Our design must (a) never present a low-confidence ASR result as a wrong *math* answer, (b) offer an instant tap fallback on every voice prompt, and (c) accept the wide space of spoken number forms ("fourteen", "one four", "ten and four").

### 3. SplashLearn

- **Economy:** *"Exciting learning worlds where they collect coins, rewards, and new characters"* — coins earned from games, spent on characters/worlds; 4,000+ games ([listing](https://apps.apple.com/us/app/id672658828)).
- **Parent surface:** *"Real-time progress tracking and insights for parents"*; the separate **[SplashLearn Parent Connect](https://apps.apple.com/us/app/id610303073) / Splash Jr** apps exist in the same developer account.
- **Pricing structure is aggressive and multi-variant:** the listing carries eight distinct membership SKUs from $7.99 to $11.99/month and $69.99 to $89.99/year — evidence of heavy price testing.
- **Free tier is thin, and it is the top complaint.** A 1★ review: *"I went to this app via a google search that was titled free learning app… Then come to find out that you only get 1 short free activity a day."* 22 of 37 sampled low-star reviews mention money.
- **Claimed scale (company claim, from the listing):** "over 60 million kids", "1 in 3 US schools", "Covers Preschool to Grade 5 curriculum for both Math and Reading", "Safe, ad-free, COPPA & GDPR compliant."
- **Kids Category:** ✅ Ages 6–8.

### 4. Prodigy Math Game

Prodigy's economy is documented in detail on their own blog ([Is a Prodigy Membership Worth It?, 2025-08-14](https://www.prodigygame.com/main-en/blog/is-prodigy-membership-worth-it/)):

- **Free (Basic):** all 11 zones and hundreds of quests, all starter and non-evolved pets with a team of up to ten, 300+ in-game items, adaptive question difficulty. Prodigy claims *"approximately 20 million students a year enjoy free access to more than 50,000 math questions and 1,500 curriculum-aligned skills"* and *"over 1.5 million teachers."*
- **Core ($6.25/mo billed annually; $12.99/mo on the App Store):** EPIC creatures, **100+ pets and the ability to evolve all of them**, hundreds of members-only gear and items, member-exclusive zones (Dark Tower, Rune Runs).
- **Plus:** adds a seasonal **Plus Member Box** (one exclusive item + one exclusive pet per season).
- **Ultra:** adds a monthly **Magicoin bonus** (Magicoin is required to evolve pets), plus Prodigy English with **250 bonus Wishcoins/month** and multiplied daily-goal Wishcoin payouts.
- **Currency is also directly purchasable:** "Magicoin 530 = $9.99" appears in the App Store IAP list ([listing](https://apps.apple.com/us/app/id950795722)).
- **Parent dashboard — the strongest in the market, and partly free:** free parent account gives a dashboard, **monthly report cards, weekly email progress updates**, and a "Classroom Learning" report. Paid tiers add **parent-set Goals with in-game Rewards** (40+ rewards at Plus), **"Cheer Them On"** encouragement messages delivered in-game, **Comparison Insights** vs peers, **Grade Override** to change difficulty, **Practice Areas** showing the specific questions a child struggles with, and printable practice sheets.
- **Prodigy's own framing of the value:** *"more time spent playing equals more time spent learning."*
- **The critique:** Common Sense Media rates it 7+ and says *"a lot of time can pass between skills questions"*, *"the math part of the game is an afterthought"*, and *"leveling up is partly determined by points that are more easily earned as a paid user"* ([CSM](https://www.commonsensemedia.org/app-reviews/prodigy-math-game)).
- **Not in Apple's Kids Category** — it has player-vs-player battle and a heavy purchase surface.

**Lesson for us:** the parent Goals→Rewards loop (parent sets a goal, child receives an in-game reward when they hit it) is the single most transferable idea here. The anti-pattern is monetising *progression speed*.

### 5. Todo Math (Enuma)

- **Credibility:** Enuma's team were **co-winners of the $15M Global Learning XPRIZE** (announced 2019-05-15), and XPRIZE reports Enuma's Kitkit School *"achieved the highest learning gains in the prize"* across the Tanzania field trial ([XPRIZE](https://www.xprize.org/prizes/global-learning)). The App Store listing repeats the claim.
- **Structure:** a **daily mission** of short activities — Counting & Number Concepts, Calculation, Mathematical Logic, Geometry, Clocks & Calendars — over 2,000 activities for Pre-K–Grade 2, "Common Core State Standards-aligned" ([listing](https://apps.apple.com/us/app/id666465255)).
- **Economy:** *"adorable collectibles"* and, historically, map pieces earned through free play. Deliberately light-touch.
- **Accessibility is the differentiator:** 8 languages, **left-handed mode, help button, dyslexic font**; Common Sense Media notes it accommodates *"auditory and visual processing issues"* and lets kids drag-and-drop or **write answers with a finger or stylus** ([CSM](https://www.commonsensemedia.org/app-reviews/todo-math)).
- **Parents Page:** change the child's level, edit the learning profile, review progress, sync across devices.
- **Parental gate:** CSM notes the upgrade prompt is prominent but *"activation requires a three-second hold"* — a classic Apple-compliant parental gate.
- **Monetisation backlash is real:** Enuma converted from paid/lifetime to subscription and the reviews are hostile — *"I paid full price for 'lifetime' usage and now they're squeezing even more money by making me subscribe"*; *"they recently took that away and now you can only play 6 times every day for free"*; *"Can't find info on subscription cost in App Store."*
- **CSM's recognition problem is directly relevant to us:** *"Some traced numbers, if written messily, are not correctly recognized."* Handwriting recognition fails 6-year-olds in exactly the way ASR does. Voice-plus-tap avoids both.

### 6. DragonBox / Kahoot! Numbers

- **Anti-gamification as the pedagogy.** The listing states the game *"works by integrating the learning seamlessly into the gameplay, with no quizzes or mindless repetitions"* ([listing](https://apps.apple.com/us/app/id1529174508)). There is no currency, no streak, no avatar.
- **The core object is the "Noom"** — a number rendered as a stackable, sliceable creature. Four modes: **Sandbox** (free exploration, explicitly positioned as a parent/teacher explanation tool), **Puzzle** (build puzzle pieces using arithmetic), plus run and play modes. Range: addition and subtraction 1–20.
- **Hard paywall:** *"REQUIRES A SUBSCRIPTION… Access to the contents and functionality of this app requires a subscription to Kahoot! Kids."* Free tier on the Kahoot! Kids bundle is one child profile and one daily challenge ([kahoot.com/kids](https://kahoot.com/kids/)).
- **Bundle economics:** $5.99/mo or $35.99–$47.99/yr unlocks ~10 apps; there is also a **$19.99 one-time purchase** SKU on the Numbers listing.
- **Parent surface is thin:** profile management, screen-time limits, sound controls — no real progress dashboard ([kahoot.com/kids](https://kahoot.com/kids/)).
- **Ratings are strong** (4.64 / 4,297 on iOS; 4.5 / 11.6K reviews and 1M+ installs on [Play](https://play.google.com/store/apps/details?id=com.kahoot.numbers)) despite the hard paywall — the concept sells itself.

### Bonus: Moose Math — the cleanest small reward economy

Free, no IAP, Kids Category. *"kids can earn rewards to help build their own city and decorate buildings"*, plus a **Report Card section where parents and teachers can monitor progress**, explicitly *"aligned with Common Core State Standards for Kindergarten and 1st Grade"* ([listing](https://apps.apple.com/us/app/id660345152)). This is the earn→spend→persistent-personal-space loop we want, in a K–1 shell, with zero monetisation pressure. It is in maintenance mode (last update 2023), which is an opportunity.

### Parental gates observed

| App | Gate mechanism |
|---|---|
| Todo Math | 3-second press-and-hold before upgrade ([CSM](https://www.commonsensemedia.org/app-reviews/todo-math)) |
| Khan Academy Kids | parent email verification at setup; "parent only" section ([CSM](https://www.commonsensemedia.org/app-reviews/khan-academy-kids); corroborated by a 1★ review complaining the app said *"parent only"*) |
| Kahoot! Kids | parent icon → settings, profile management, screen-time limits ([kahoot.com/kids](https://kahoot.com/kids/)) |
| Apple requirement | Kids Category apps must place *"links out of the app, purchasing opportunities, or other distractions"* behind a parental gate ([Guideline 1.3](https://developer.apple.com/app-store/review/guidelines/)) |

## A4. Market signals

| Signal | Figure | Source |
|---|---|---|
| Duolingo streak scale | **~43M DAU with a 7-day+ streak; ~15M DAU with a 365-day+ streak** (as of 2025-12-31) | [Duolingo FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm) |
| Duolingo engagement | 52.7M DAU in Q4 2025 vs 40.5M a year earlier (+30%); **DAU/MAU 39.6%**, up from 34.7% | same 10-K |
| Duolingo revenue | **$1.0376B FY2025** (subscription $873.4M, other $164.1M), +39% YoY; ~7.7% of revenue from advertising | same 10-K |
| Duolingo's own causal framing | *"we build gamification features into our platform to motivate our learners, and we run thousands of A/B tests to optimize each feature for maximum engagement"* | same 10-K |
| Streak → completion | 7-day streak learners are **3.6× more likely to complete their course** | [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) |
| Streak animation → retention | milestone animations: **+1.7% D7 retention** for new learners | same |
| Streak forgiveness → DAU | two equippable Streak Freezes: **+0.38% daily active learners** | same |
| Duolingo store position | *"top-grossing app globally in the Education category on both Google Play and the Apple App Store"*; >130M MAU | 10-K |
| Enuma / Global Learning XPRIZE | Co-winner of the **$15M** prize (announced **2019-05-15**); Kitkit School *"achieved the highest learning gains in the prize"*; 2,500 tablets across 141 Tanzanian villages, RCT design | [XPRIZE](https://www.xprize.org/prizes/global-learning) |
| Prodigy free-tier scale | *"approximately 20 million students a year"* free; 50,000+ questions; 1,500 skills; *"over 1.5 million teachers"* | [Prodigy blog](https://www.prodigygame.com/main-en/blog/is-prodigy-membership-worth-it/) |
| Prodigy consumer scale | 243,091 App Store ratings (largest of any dedicated kids' math app checked); 5M+ Play installs | [App Store](https://apps.apple.com/us/app/id950795722), [Play](https://play.google.com/store/apps/details?id=com.prodigygame.prodigy) |
| SplashLearn scale (company claim) | *"Loved by over 60 million kids and used in 1 in 3 US schools"* | [App Store listing](https://apps.apple.com/us/app/id672658828) |
| Khan Academy Kids scale (company claim) | *"helped over 21 million preschool and elementary students"*; *"more than 180,000 5-star reviews"* | [App Store listing](https://apps.apple.com/us/app/id1378467217) |
| Boddle scale (company claim) | *"more than 15 million students, parents, and teachers"* | [App Store listing](https://apps.apple.com/us/app/id1520367760) |
| Todo Math scale (company claim) | *"More than 10 million parents and 5,000 teachers"*; 5,000+ classrooms | [App Store listing](https://apps.apple.com/us/app/id666465255) |
| Lingokids consumer scale | **646,893 App Store ratings** — by far the largest kids-education review base in the set, though math is one strand among many | [App Store listing](https://apps.apple.com/us/app/id1002043426) |
| Math Kids (RV AppStudios) reach | **50M+ Play installs, 70K reviews** on a free, no-IAP, no-account mini-game app | [Play](https://play.google.com/store/apps/details?id=com.rvappstudios.math.kids.counting) |
| Efficacy claims (developer, unaudited) | Matific: *"improve test scores by an average of 34%"* in 30 min/week; HOMER: *"15 minutes a day = 74% reading growth"*; Mathseeds: *"proven… in just 15 minutes a day"* | respective App Store listings — **treat as marketing claims, UNVERIFIED** |
| Independent review coverage is collapsing | **Common Sense Education paused its edtech review program as of January 2026**: *"We are not completing new reviews or review updates at this time"*, with review content *"removed from our site entirely in February."* The consumer-side commonsensemedia.org app reviews remain live. | [Common Sense Education FAQ](https://www.commonsense.org/education/reviews/prodigy-math-game) (redirects to the FAQ notice) |

**Funding / corporate:** no primary source for SplashLearn, Prodigy, Enuma or Boddle funding rounds was reachable within this session's search budget — **UNVERIFIED**, flagged for follow-up.

## A5. What the reviews complain about

Method: pulled the ~98 most recent US App Store reviews per app from Apple's public customer-review RSS feed (`itunes.apple.com/us/rss/customerreviews/id=<id>/sortby=mostrecent/json`), filtered to ≤3★, and counted theme keywords. Counts are of low-star reviews mentioning the theme, out of the low-star reviews sampled.

| App | Low-star share of sample | Paywall | Reward-grind / not-learning | Bugs | Reading load | Difficulty/pacing | Ads | Voice/audio |
|---|---|---|---|---|---|---|---|---|
| SplashLearn | 37/98 | **22** | – | 5 | 2 | 2 | – | 1 |
| Prodigy | 36/98 | **13** | **13** | 3 | – | 1 | 6 | – |
| Khan Academy Kids | 26/98 | 0 | – | several | – | 3 | – | – |
| Todo Math | 26/98 | **10** | – | 1 | – | 1 | – | 2 |
| Monster Math | 23/98 | 1 | 1 | 1 | – | **5** | – | – |
| Lingokids | 35/98 | **18** | – | – | 1 | 1 | 3 | – |
| Kahoot! Numbers | 12/36 | 5 | – | 2 | – | 1 | 2 | – |
| MathTango | 14/68 | 7 | – | 1 | 1 | – | 1 | – |
| Duolingo ABC | 25/98 | – | – | – | **7** | 3 | 1 | **3** |
| Mathseeds | 7/10 | 2 | – | – | 1 | 1 | – | **4** |
| HOMER | **74/98** | **28** | – | **12** | 6 | 3 | 1 | 2 |
| Numberblocks World | 48/98 | **13** | 1 | 4 | – | 3 | – | 2 |
| DoodleMath | 13/25 | 3 | – | 2 | 1 | – | – | – |
| Boddle | 5/49 | 1 | 2 | – | – | 1 | – | – |
| Matific | 5/25 | – | – | 1 | – | 2 | – | – |

**Recurring themes with quotes (all from the review feeds cited above):**

1. **"Free" that isn't.** SplashLearn: *"I went to this app via a google search that was titled free learning app… come to find out that you only get 1 short free activity a day."* Numberblocks: *"WHY DO WE NEED THE SUBSCRIPTION."* Todo Math: *"Can't find info on subscription cost in App Store. Like to know costs before downloading."*
2. **Retroactive monetisation is the most toxic.** Todo Math: *"I paid full price for 'lifetime' usage and now they're squeezing even more money by making me subscribe."* / *"Bring back unlimited play… they recently took that away and now you can only play 6 times every day for free."* Prodigy: *"Why do we need subscriptions to just get a single pet first it was free."*
3. **Trial-to-charge and cancellation friction.** HOMER dominates this: *"Charged me with no notice and I cancelled"*; *"My daughter accidentally purchased this app and the subscription renewed after the free trial and the app wouldn't give me a refund."*
4. **Reward grinding crowds out learning.** Prodigy: *"Whenever I get to a wizard or a boss… it always takes so long because I have to get a certain number of pets and it just takes a certain number of days"* (3★). Corroborated by CSM: *"the math part of the game is an afterthought."* HOMER: *"Mostly stimulating content rather than learning… it's mostly just videos, songs, stories, coloring pages and placing stickers. It's more like watching TV than a learning game."*
5. **Voice/speech input failure.** Duolingo ABC (three separate reviewers, quoted in §A3.2). This is the highest-signal warning in the entire dataset for our design.
6. **Audio fragility.** Mathseeds: *"Sound stops suddenly. Super frustrating for my little learner."* / *"the app is useless because audio is required for many of the activities."*
7. **Reading requirement excludes the target user.** Duolingo ABC: *"My daughter has dyslexia so it's hard for her to read and I don't think this app supports that. She's upset and feels like she's a little kid."*
8. **Ceiling and pacing.** Khan Academy Kids attracts a distinctive complaint cluster: it only goes to Grade 2, so kids age out loudly (*"Up to 2nd grade?! …Where is 5th grade?"*), and both directions of pacing are criticised — *"the exercises are tedious and far below her ability… too slow paced"* and *"Overly restrictive on what kids should know."*
9. **Missing reward loop is itself a complaint.** Khan Academy Kids 1★: *"Make it fun add games if you get things correct."* A no-reward app gets punished too.
10. **Accessibility gaps.** Khan Academy Kids 1★: *"No caption options. Deaf and Hard of Hearing kids will not be able to use this."* Directly relevant to a voice-heavy product.

---

# PART B — What our K–5 content should be, and in what order

**Primary source:** *Common Core State Standards for Mathematics*, the official CCSSO-hosted PDF at [learning.ccsso.org/…/Math_Standards1.pdf](https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf) (corestandards.org itself now returns 403; this is the authoritative copy hosted by the Council of Chief State School Officers, one of the two authoring organisations). Page references below are to that PDF.

## B1. K–5 skill map by domain

Cluster headings are quoted from each grade's Overview page in the CCSSM PDF.

| Domain | K | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **Counting & Cardinality (CC)** | Know number names and the count sequence (K.CC.1–3); count to tell the number of objects (K.CC.4–5); compare numbers (K.CC.6–7) | *(domain ends after K)* | — | — | — | — |
| **Operations & Algebraic Thinking (OA)** | Understand addition as putting together/adding to and subtraction as taking apart/taking from (K.OA.1–5) | Represent and solve +/− problems (1.OA.1–2); understand properties and the +/− relationship (1.OA.3–4); add and subtract within 20 (1.OA.5–6); work with equations (1.OA.7–8) | Represent and solve +/− problems (2.OA.1); add and subtract within 20 (2.OA.2); work with equal groups → foundations for multiplication (2.OA.3–4) | Represent and solve ×/÷ problems (3.OA.1–4); understand properties and the ×/÷ relationship (3.OA.5–6); multiply and divide within 100 (3.OA.7); four operations + patterns (3.OA.8–9) | Use the four operations to solve problems (4.OA.1–3); factors and multiples (4.OA.4); generate and analyze patterns (4.OA.5) | Write and interpret numerical expressions (5.OA.1–2); analyze patterns and relationships (5.OA.3) |
| **Number & Operations in Base Ten (NBT)** | Work with numbers 11–19 to gain foundations for place value (K.NBT.1) | Extend the counting sequence (1.NBT.1); understand place value (1.NBT.2–3); use place value to add and subtract (1.NBT.4–6) | Understand place value to 1000 (2.NBT.1–4); use place value to add and subtract (2.NBT.5–9) | Use place value understanding to perform multi-digit arithmetic (3.NBT.1–3) | Generalize place value for multi-digit whole numbers (4.NBT.1–3); multi-digit arithmetic (4.NBT.4–6) | Understand the place value system incl. decimals (5.NBT.1–4); operations with multi-digit numbers and decimals to hundredths (5.NBT.5–7) |
| **Number & Operations — Fractions (NF)** | — | — | *(fraction ideas appear as "equal shares" in 2.G.3)* | Develop understanding of fractions as numbers (3.NF.1–3) | Extend fraction equivalence and ordering (4.NF.1–2); build fractions from unit fractions (4.NF.3–4); decimal notation for fractions (4.NF.5–7) | Equivalent fractions to add and subtract (5.NF.1–2); multiply and divide fractions (5.NF.3–7) |
| **Measurement & Data (MD)** | Describe and compare measurable attributes (K.MD.1–2); classify objects and count by category (K.MD.3) | Measure lengths indirectly and by iterating units (1.MD.1–2); tell and write time (1.MD.3); represent and interpret data (1.MD.4) | Measure and estimate lengths in standard units (2.MD.1–4); relate addition/subtraction to length (2.MD.5–6); time and money (2.MD.7–8); represent and interpret data (2.MD.9–10) | Time intervals, liquid volume, mass (3.MD.1–2); data (3.MD.3–4); area and its relation to multiplication (3.MD.5–7); perimeter (3.MD.8) | Measurement conversion (4.MD.1–3); data (4.MD.4); angles and angle measure (4.MD.5–7) | Convert like measurement units (5.MD.1); data (5.MD.2); volume and its relation to multiplication (5.MD.3–5) |
| **Geometry (G)** | Identify and describe shapes (K.G.1–3); analyze, compare, create, compose shapes (K.G.4–6) | Reason with shapes and their attributes (1.G.1–3) | Reason with shapes and their attributes (2.G.1–3) | Reason with shapes and their attributes (3.G.1–2) | Draw and identify lines and angles; classify shapes by properties of lines and angles (4.G.1–3) | Graph points on the coordinate plane (5.G.1–2); classify 2-D figures by properties (5.G.3–4) |

## B2. Grade 1 in full — our first target

All 21 Grade 1 standards, verbatim intent from CCSSM pp. 15–16. "Visual?" = does the child need to *see* something to answer, even if they answer by voice.

### 1.OA — Operations & Algebraic Thinking

| Code | Plain English | Example question a 6–7 year old can answer by voice | Visual needed? |
|---|---|---|---|
| **1.OA.A.1** | Solve add-to / take-from / put-together / take-apart / compare word problems within 20, with the unknown in **any** position | *"Maya had 8 stickers. She got some more. Now she has 13. How many did she get?"* → "five" | **No** — pure verbal. Optional picture support. |
| **1.OA.A.2** | Word problems adding **three** whole numbers with sum ≤ 20 | *"Three red apples, four green apples, two yellow apples. How many apples?"* → "nine" | **No** |
| **1.OA.B.3** | Apply properties as strategies: commutative (8+3 = 3+8) and associative (2+6+4 → 2+10) | *"You know 8 plus 3 is 11. So what is 3 plus 8?"* → "eleven" | **No** |
| **1.OA.B.4** | Understand subtraction as an unknown-addend problem (10 − 8 = "what makes 10 with 8?") | *"What do you add to 8 to make 10?"* → "two" | **No** |
| **1.OA.C.5** | Relate counting to addition and subtraction (counting on 2 to add 2) | *"Start at 7 and count on 3. Where do you land?"* → "ten" | **No** |
| **1.OA.C.6** | **Add and subtract within 20; fluent within 10.** Strategies: counting on, making ten, decomposing to a ten, using the +/− relationship, equivalent sums | *"What is 8 plus 6?"* → "fourteen". Strategy prompt: *"8 needs how many to make 10?"* → "two" | **No** for the answer; **yes** if you want to *teach* the strategy (ten-frame) |
| **1.OA.D.7** | Understand the equal sign; judge whether equations are true or false (6 = 6; 7 = 8 − 1; 4 + 1 = 5 + 2) | *"Is this true or false: five plus two equals two plus five?"* → "true" | **Helpful** — show the equation while reading it |
| **1.OA.D.8** | Find the unknown in an equation relating three numbers (8 + ? = 11; 5 = ? − 3; 6 + 6 = ?) | *"Eight plus what equals eleven?"* → "three" | **Helpful** — show `8 + ? = 11` |

### 1.NBT — Number & Operations in Base Ten

| Code | Plain English | Example voice question | Visual needed? |
|---|---|---|---|
| **1.NBT.A.1** | Count to 120 starting from **any** number; read and write numerals; represent a count with a numeral | *"Start at 87 and count to 92."* → "88, 89, 90, 91, 92" | **No** (counting aloud is ideal for voice) |
| **1.NBT.B.2** | Two digits = tens and ones. **a:** ten ones = a "ten". **b:** 11–19 = a ten and some ones. **c:** 10,20,…,90 = some tens and 0 ones | *"In the number 47, how many tens?"* → "four". *"14 is one ten and how many ones?"* → "four" | **Yes for teaching** — base-ten blocks / ten-frames. Answer is still verbal |
| **1.NBT.B.3** | Compare two two-digit numbers using >, =, < based on tens and ones | *"Which is bigger, 62 or 58?"* → "sixty-two" (voice-friendly as "bigger/smaller", not as a symbol) | **No** for spoken comparison; **yes** if the symbol `>` must be produced → use tap targets |
| **1.NBT.C.4** | Add within 100 (2-digit + 1-digit; 2-digit + multiple of 10) **using concrete models or drawings**, relating the strategy to a written method and **explaining the reasoning** | *"What is 34 plus 20?"* → "fifty-four" | **Yes** — the standard explicitly requires models/drawings and explanation. Pair voice answer with an on-screen base-ten model |
| **1.NBT.C.5** | Mentally find 10 more or 10 less than a two-digit number, **without counting**, and explain | *"What is ten more than 46?"* → "fifty-six" | **No** — genuinely the best pure-voice standard in Grade 1 |
| **1.NBT.C.6** | Subtract multiples of 10 from multiples of 10 (10–90), using models/drawings, relating to a written method | *"What is 70 minus 30?"* → "forty" | **Yes** for the modelling requirement; answer is verbal |

### 1.MD — Measurement & Data

| Code | Plain English | Example voice question | Visual needed? |
|---|---|---|---|
| **1.MD.A.1** | Order three objects by length; compare two lengths **indirectly** using a third | *"The red stick is longer than the blue stick. The blue stick is longer than the green stick. Which is shortest?"* → "green" | **No** for the verbal version; **yes** for the visual version |
| **1.MD.A.2** | Express length as a whole number of length units by laying copies of a shorter unit end to end, with no gaps or overlaps | *"The pencil is 6 paperclips long. How many paperclips?"* → "six" | **Yes** — the iteration must be seen or performed |
| **1.MD.B.3** | Tell and write time in **hours and half-hours** on analog and digital clocks | *"What time does the clock say?"* → "three thirty" / "half past three" | **Yes** — must see the clock. Voice answer works well |
| **1.MD.C.4** | Organise, represent and interpret data with **up to three categories**; answer "how many total", "how many in each", "how many more/fewer" | *"Looking at the chart, how many more kids picked dogs than cats?"* → "three" | **Yes** — must see the chart |

### 1.G — Geometry

| Code | Plain English | Example voice question | Visual needed? |
|---|---|---|---|
| **1.G.A.1** | Distinguish **defining** attributes (a triangle is closed and three-sided) from **non-defining** ones (colour, orientation, size); build and draw shapes with defining attributes | *"A triangle always has how many sides?"* → "three". *"Does a triangle have to be red?"* → "no" | **Partly** — the reasoning is verbal; "build and draw" needs a canvas |
| **1.G.A.2** | **Compose** 2-D shapes (rectangles, squares, trapezoids, triangles, half-circles, quarter-circles) or 3-D shapes (cubes, right rectangular prisms, cones, cylinders) into composite shapes, and new shapes from those | *"If you put two of these triangles together, what shape do you get?"* → "a square" | **Yes — this is the one genuinely drag-and-drop standard in Grade 1.** Voice can name the result but not perform the composition |
| **1.G.A.3** | Partition circles and rectangles into **two and four equal shares**; use *halves, fourths, quarters, half of, fourth of, quarter of*; describe the whole as two of / four of the shares; understand that more equal shares means smaller shares | *"If I cut this circle into four equal pieces, what do we call one piece?"* → "a fourth" / "a quarter". *"Are fourths bigger or smaller than halves?"* → "smaller" | **Yes** to see the partition; answer is a perfect voice word |

**Voice-friendliness tally for Grade 1:** 12 of 21 standards are answerable with a spoken number or word and need no visual at all (all of 1.OA except D.7/D.8 as displayed equations; 1.NBT.A.1, B.3, C.5; 1.MD.A.1 verbal form). A further 6 need a visual *stimulus* but still take a spoken answer (1.NBT.B.2, C.4, C.6; 1.MD.A.2, B.3, C.4; 1.G.A.3). Only **1.G.A.2** (compose shapes) and the "build and draw" half of **1.G.A.1** are structurally non-voice.

### Kindergarten prerequisites (ages 5–6) — CCSSM pp. 11–12

| Code | Prerequisite skill |
|---|---|
| K.CC.1 | Count to 100 by ones and by tens |
| K.CC.2 | Count forward from a given number (not always from 1) |
| K.CC.3 | Write numbers 0–20; represent a count with a numeral |
| K.CC.4a–c | One-to-one correspondence; **the last number said is the count** (cardinality); each next number is one larger |
| K.CC.5 | Count to answer "how many?" for up to 20 things in a line/array/circle, 10 scattered; count out a given number of objects |
| K.CC.6 | Compare group sizes: greater than / less than / equal to (up to ten objects) |
| K.CC.7 | Compare two written numerals between 1 and 10 |
| K.OA.1 | Represent + and − with objects, fingers, mental images, drawings, **sounds (e.g. claps)**, acting out, **verbal explanations**, expressions or equations |
| K.OA.2 | Solve +/− word problems and add/subtract **within 10** |
| K.OA.3 | **Decompose numbers ≤ 10 into pairs in more than one way** (5 = 2+3 and 5 = 4+1) — number bonds |
| K.OA.4 | **For any number 1–9, find the number that makes 10** — the make-ten partner |
| K.OA.5 | **Fluently add and subtract within 5** |
| K.NBT.1 | **Compose/decompose 11–19 as ten ones and some further ones** (18 = 10 + 8) |
| K.MD.1–2 | Describe measurable attributes; directly compare two objects (taller/shorter) |
| K.MD.3 | Classify objects into categories, count each, sort categories by count |
| K.G.1–3 | Name shapes and relative positions (above, below, beside, in front of, behind, next to); name shapes regardless of orientation or size; 2-D ("flat") vs 3-D ("solid") |
| K.G.4–6 | Compare shapes informally (sides, vertices/"corners"); model shapes from components; compose simple shapes into larger ones |

Note K.OA.3, K.OA.4 and K.NBT.1 — these three are the explicit prerequisites the Progressions name for make-a-ten (see B4).

### Grade 2 next steps (ages 7–8) — CCSSM pp. 19–20

| Code | Skill |
|---|---|
| 2.OA.1 | One- and **two-step** word problems within 100, unknowns in all positions |
| 2.OA.2 | **Fluently add and subtract within 20** using mental strategies; **by end of Grade 2, know from memory all sums of two one-digit numbers** |
| 2.OA.3 | Odd/even for groups up to 20; express an even number as a sum of two equal addends |
| 2.OA.4 | Use addition to find totals in rectangular arrays up to 5×5; write it as a sum of equal addends (pre-multiplication) |
| 2.NBT.1 | Three-digit place value: hundreds/tens/ones; 100 = ten tens |
| 2.NBT.2 | Count within 1000; **skip-count by 5s, 10s, 100s** |
| 2.NBT.3 | Read and write numbers to 1000 in numerals, number names and **expanded form** |
| 2.NBT.4 | Compare three-digit numbers with >, =, < |
| 2.NBT.5 | **Fluently add and subtract within 100** |
| 2.NBT.6 | Add up to four two-digit numbers |
| 2.NBT.7 | Add and subtract within 1000 with models/drawings; compose/decompose tens and hundreds |
| 2.NBT.8 | **Mentally add or subtract 10 or 100** from a number 100–900 |
| 2.NBT.9 | **Explain why** addition and subtraction strategies work |
| 2.MD.1–4 | Measure with rulers/yardsticks/meter sticks/tapes; measure with two different units; **estimate** in inches, feet, cm, m; find how much longer one object is |
| 2.MD.5–6 | Use +/− within 100 for length word problems; **represent whole numbers on a number line diagram** |
| 2.MD.7 | Tell and write time to the **nearest five minutes**, a.m./p.m. |
| 2.MD.8 | **Money**: dollar bills, quarters, dimes, nickels, pennies; $ and ¢ symbols |
| 2.MD.9–10 | Line plots from measurement data; **picture graphs and bar graphs** with up to four categories |
| 2.G.1 | Recognise/draw shapes with given attributes; identify triangles, quadrilaterals, pentagons, hexagons, cubes |
| 2.G.2 | Partition a rectangle into rows and columns of same-size squares and count them (pre-area) |
| 2.G.3 | Partition circles and rectangles into two, **three**, or four equal shares; halves, **thirds**, fourths; equal shares of identical wholes need not have the same shape |

## B3. Fluency expectations, and what the research says about drilling them

### The stated CCSSM fluencies

| Grade | Standard | Exact requirement |
|---|---|---|
| K | **K.OA.5** | "Fluently add and subtract **within 5**." |
| 1 | **1.OA.C.6** | "Add and subtract **within 20**, demonstrating **fluency for addition and subtraction within 10**." |
| 2 | **2.OA.2** | "Fluently add and subtract **within 20** using mental strategies. **By end of Grade 2, know from memory all sums of two one-digit numbers.**" |
| 2 | **2.NBT.5** | "Fluently add and subtract **within 100** using strategies based on place value…" |
| 3 | **3.OA.7** | "Fluently multiply and divide **within 100**… **By the end of Grade 3, know from memory all products of two one-digit numbers.**" |
| 3 | **3.NBT.2** | "Fluently add and subtract **within 1000** using strategies and algorithms…" |
| 4 | **4.NBT.4** | "Fluently add and subtract **multi-digit whole numbers using the standard algorithm.**" |
| 5 | **5.NBT.5** | "Fluently **multiply multi-digit whole numbers using the standard algorithm.**" |

(All quotations from the [CCSSM PDF](https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf), pp. 11, 15, 19, 23, 29, 35.)

Note the phrasing distinction the standards make deliberately: **"fluently"** (efficient, flexible, accurate — strategy-based) vs **"know from memory"** (2.OA.2 and 3.OA.7 only). Grade 1 never asks for memorisation.

### The timed-practice debate, stated fairly

**The NCTM position (against timed testing).** NCTM's official position statement, *Procedural Fluency in Mathematics*, says:

- Fluency is *"the ability to apply procedures efficiently, flexibly, and accurately; to transfer procedures to different problems and contexts; to build or modify procedures from other procedures; and to recognize when one strategy or procedure is more appropriate to apply than another"* — explicitly **not** "remembering facts and applying standard algorithms."
- *"Conceptual understanding must precede and coincide with instruction on procedures."*
- *"Basic facts should be taught using number relationships and reasoning strategies, not memorization. Students who learn fact strategies outperform students who learn through other approaches."*
- *"**Timed tests do not assess fluency and can negatively affect students, and thus should be avoided**"* (citing Boaler 2014; Kling & Bay-Williams 2021; NCTM 2020; Ramirez, Shaw & Maloney 2018). Recommended alternatives: interviews, observations, written prompts.

([NCTM position statement](https://www.nctm.org/Standards-and-Positions/Position-Statements/Procedural-Fluency-in-Mathematics/))

**Jo Boaler's argument (the anti-timed-test case).** In *Fluency Without Fear*, Boaler argues that *"for about one third of students the onset of timed testing is the beginning of math anxiety"*, citing Beilock (2011) and Ramirez et al. (2013) that time pressure blocks working memory so students cannot retrieve facts they know, and Delazer et al. (2005) that students who learned facts through strategic thinking showed *"superior performance… solved problems at the same speed, and showed better transfer to new problems"* than those who memorised ([youcubed](https://www.youcubed.org/evidence/fluency-without-fear/)).

**The counterweight (the case for automaticity and for well-designed drill).** The U.S. **National Mathematics Advisory Panel**, *Foundations for Success* (March 2008), takes a different emphasis:

- *"Computational facility with whole number operations rests on the **automatic recall** of addition and related subtraction facts, and of multiplication and related division facts."*
- Benchmarks: *"By the end of Grade 3, students should be proficient with the addition and subtraction of whole numbers"*; *"by the end of Grade 5… multiplication and division of whole numbers."*
- And explicitly on software: *"The Panel recommends that **high-quality computer-assisted instruction (CAI) drill and practice, implemented with fidelity, be considered as a useful tool in developing students' automaticity** (i.e., fast, accurate, and effortless performance on computation), freeing working memory so that attention can be directed to the more complicated aspects of complex tasks."*

([NMAP final report](https://files.eric.ed.gov/fulltext/ED500486.pdf), pp. 20, 26, and the Instructional Practices chapter.)

**Where the two actually agree, and what we should build.** Both camps agree that (a) automaticity with single-digit facts is a real and necessary goal, and (b) it should rest on number relationships rather than blind memorisation. The disagreement is narrower than the rhetoric suggests: it is about **timed assessment**, not about practice. The NMAP endorsement of CAI drill is about *practice*, not about a stopwatch.

Design consequence for a 6-year-old product: **practice frequently, never time, never rank, never penalise a slow answer.** Monster Math markets exactly this — *"No time limits, no penalties, and no distractions"* ([listing](https://apps.apple.com/us/app/id931943412)) — and DoodleMath markets *"eliminates math anxiety by rewarding effort over ability"* ([listing](https://apps.apple.com/us/app/id598196680)). The market has already converged on the safe position.

## B4. Learning progressions — the recommended sequence

**Primary source:** *Draft K–5 Progression on Counting and Cardinality and Operations and Algebraic Thinking* (5/29/2011), by the Common Core Standards Writing Team, hosted at [achievethecore.org/page/254](https://achievethecore.org/page/254/progressions-documents-for-the-common-core-state-standards-for-mathematics) ([direct PDF](https://achievethecore.org/content/upload/Draft-K-5%20Progression%20on%20Counting%20and%20Cardinality%20and%20Operations%20and%20Algebraic%20Thinking.pdf)). Companion documents at the same page cover K–5 NBT, K–5 Measurement & Data, K–6 Geometry, and 3–5 Fractions.

### The canonical sequence, quoted

**Step 0 — Subitizing.** *"Students come to quickly recognize the cardinalities of small groups without having to count the objects; this is called **perceptual subitizing**. Perceptual subitizing develops into **conceptual subitizing** — recognizing that a collection of objects is composed of two subcollections and quickly combining their cardinalities (e.g., seeing a set as two subsets of cardinality 2 and saying 'four'). Use of conceptual subitizing in adding and subtracting small numbers progresses to supporting steps of more advanced methods."* (p. 5)

**Step 1 — Counting, then cardinality, then counting out.** One-to-one correspondence → the last word said is the count (K.CC.4b) → counting out a requested number of objects. The Progression notes counting must be *fluent enough* that the child has attention left over to remember the target.

**The three computation levels (Progression p. 7, verbatim margin box):**

- **Level 1 — Direct Modeling by Counting All or Taking Away.** *"Represent situation or numerical problem with groups of objects, a drawing, or fingers. Model the situation by composing two addend groups or decomposing a total group. Count the resulting total or addend."*
- **Level 2 — Counting On.** *"Embed an addend within the total (the addend is perceived simultaneously as an addend and as part of the total). Count this total but abbreviate the counting by omitting the count of this addend; instead, begin with the number word of this addend. Some method of keeping track (fingers, objects, mentally imaged objects, body motions, other count words) is used to monitor the count."*
- **Level 3 — Convert to an Easier Problem.** *"Decompose an addend and compose a part with another addend."* (i.e. make-a-ten, doubles ± 1)

The Progression is emphatic that **"Counting on should be seen as a thinking strategy, not a rote method,"** and that counting on for subtraction is easier than counting down.

**The three prerequisites for make-a-ten (Progression p. 16, verbatim):**

> *a. knowing the partner that makes 10 for any number (**K.OA.4** sets the stage for this),*
> *b. knowing all decompositions for any number below 10 (**K.OA.3** sets the stage for this), and*
> *c. knowing all teen numbers as 10 + n (e.g., 12 = 10 + 2, 15 = 10 + 5, see **K.NBT.1** and **1.NBT.2b**).*

Worked example given: *computing 8 + 6 by making a ten — "8's partner to 10 is 2, so decompose 6 as 2 and its partner. 2's partner to 6 is 4. 10 + 4 is 14."*

### The sequence as a build order

```
subitize (perceptual → conceptual)
  → count sequence + one-to-one + cardinality (K.CC.4)
    → count out N objects (K.CC.5)
      → compare quantities (K.CC.6-7)
        → Level 1: count all / take away (K.OA.1-2)
          → number bonds: decompose ≤10 many ways (K.OA.3)
            → partners to 10 (K.OA.4)
              → teen numbers as 10 + n (K.NBT.1, 1.NBT.2b)
                → Level 2: counting on (1.OA.C.5)
                  → Level 3: make-a-ten and doubles±1 (1.OA.C.6)
                    → subtraction as unknown addend (1.OA.B.4)
                      → tens and ones place value (1.NBT.2, 1.NBT.3)
                        → 10 more / 10 less mentally (1.NBT.C.5)
                          → add 2-digit + 1-digit and + multiple of 10 (1.NBT.C.4)
                            → fluency within 20, memory of one-digit sums (2.OA.2)
                              → add/subtract within 100 (2.NBT.5)
```

### Corroboration from products

- **Moose Math** (Khan Academy / Duck Duck Moose) states it is *"aligned with Common Core State Standards for Kindergarten and 1st Grade"* and lists its skill order as Numbers → Counting (by 1s, 2s, 5s, 10s, to 100) → Addition & Subtraction (to 20, with numbers, dice and **rekenrek racks**) → Geometry → Measurement ([listing](https://apps.apple.com/us/app/id660345152)). The rekenrek is the classic make-a-ten manipulative — the same Level 3 target.
- **Numberblocks World** was *"created together with experts from the NCETM"* and ships **three dedicated subitising games** as an explicit early stage, with content *"presented in levels that help children progress through the different stages of number skills"* ([listing](https://apps.apple.com/us/app/id1520827387)). Independent corroboration that subitizing deserves its own game type, not a footnote.
- **Monster Math** states it is *"grounded in research by Math Fact Fluency Expert Dr. Jennifer Bay-Williams"* and focuses on *"basic and advanced fact strategies"* rather than rote memorisation ([listing](https://apps.apple.com/us/app/id931943412)) — Bay-Williams is cited by name three times in the NCTM position statement.
- **Kahoot! Numbers by DragonBox** builds its entire mechanic on Level 1→3 transitions: Nooms that can be *"stacked, sliced, combined, sorted, compared"* is a direct manipulative rendering of decomposition and composition within 20 ([listing](https://apps.apple.com/us/app/id1529174508)).
- **Todo Math** organises Pre-K–2 as Counting and Number Concepts → Calculation → Mathematical Logic → Geometry → Clocks & Calendars ([listing](https://apps.apple.com/us/app/id666465255)).
- **SplashLearn**'s stated Grade 1 scope — *"Place value, subtraction, telling time, math facts, measurement, basic word problems"* ([listing](https://apps.apple.com/us/app/id672658828)) — matches 1.NBT / 1.OA / 1.MD.

**UNVERIFIED:** Khan Academy's exact 1st-grade unit ordering and Zearn's Grade 1 mission ordering could not be retrieved — both sites render their course structure client-side and returned no unit names to a direct fetch, and the web-search budget for this session was exhausted. Flagged for a follow-up pass; the CCSSM Progressions above are the stronger authority for sequencing regardless.

## B5. Question formats that work by voice

The design rule: **voice is excellent for producing a number, a comparison word, a yes/no, or a name; it is bad for producing a spatial arrangement, a symbol, or a drawing.** Pair every non-voice-producible answer with a small set of large tap targets.

| Strand | Voice-friendly answer types | Example prompts | Needs tap / drag instead | Recommended pairing |
|---|---|---|---|---|
| **Counting & cardinality (K.CC, 1.NBT.A.1)** | A number; a **spoken count sequence** | *"How many?"* → "seven". *"Count from 87 to 92."* | Nothing significant | Pure voice. Count sequences are the single best voice-native activity in K–1 — ASR can score a sequence loosely, and it's how the skill is actually assessed in class |
| **Comparison (K.CC.6–7, 1.NBT.B.3)** | "bigger" / "smaller" / "more" / "less" / "same"; the winning number itself | *"Which is bigger, 62 or 58?"* | Producing the symbol `>`, `<`, `=` | Voice for the comparison word; **three big tap buttons** for the symbol form. Never require a child to say "greater than sign" |
| **Addition & subtraction facts (K.OA, 1.OA.C)** | A number | *"What is 8 plus 6?"* → "fourteen" | Nothing | Pure voice. Accept "fourteen", "one four", "ten and four" |
| **Number bonds / make-ten (K.OA.3–4)** | A number; a **pair of numbers** | *"What makes ten with eight?"* → "two". *"Give me two numbers that make five."* → "three and two" | Physically splitting a bar/bond | Voice for the answer; ten-frame or bond graphic as the *stimulus*. Two-number answers are voice-viable if phrased "X and Y" |
| **Word problems (1.OA.A.1–2)** | A number | *"Maya had 8, got some more, now has 13. How many did she get?"* | Nothing | Pure voice — and voice **removes the reading barrier** that Duolingo ABC reviewers complain about. This is our strongest differentiator |
| **True/false equations (1.OA.D.7)** | "true" / "false" / "yes" / "no" | *"Is 4 + 1 = 5 + 2 true or false?"* | Nothing | Show the equation, answer by voice. Two big tap buttons as fallback |
| **Unknown in an equation (1.OA.D.8)** | A number | *"Eight plus what equals eleven?"* | Writing the equation | Show `8 + ? = 11`, answer by voice |
| **Place value (1.NBT.B.2, C.4–C.6)** | A number; the words **"tens"** / **"ones"** / **"hundreds"** | *"In 47, how many tens?"* → "four". *"Is the 3 in 34 tens or ones?"* → "tens" | Building the number with base-ten blocks; regrouping | Voice for the answer; **on-screen base-ten blocks as the model** (the standard requires the model). Drag only when the task *is* composing a ten |
| **10 more / 10 less (1.NBT.C.5)** | A number | *"What is ten more than 46?"* | Nothing | Pure voice — best-in-class voice standard |
| **Measurement (1.MD.A.1–2)** | A number of units; "longer"/"shorter"/"taller" | *"How many paperclips long is the pencil?"*; *"Which is shortest?"* | Laying units end to end; ordering objects | Voice for the answer; **animated unit-iteration** as the stimulus. Ordering three objects → drag, or "point at the shortest" via tap |
| **Time (1.MD.B.3)** | "three o'clock", "three thirty", "half past three" | *"What time is it?"* | Setting the hands | Voice for reading a clock; **drag the hands** only for the produce-a-time task. Accept both "three thirty" and "half past three" |
| **Data (1.MD.C.4)** | A number; a category name | *"How many more chose dogs than cats?"* → "three"; *"Which had the most?"* → "dogs" | Building the graph | Voice for interpretation; graph is display-only |
| **Shape naming (K.G.1–2, 1.G.A.1)** | A shape name; "flat"/"solid"; a number of sides; yes/no | *"What shape is this?"* → "triangle"; *"How many sides?"* → "four"; *"Does a triangle have to be red?"* → "no" | Drawing the shape | Voice for naming and attribute reasoning. **Careful:** shape names are ASR-confusable ("square"/"sphere", "cone"/"comb") — pair with a 3–4 option tap grid on low confidence |
| **Composing shapes (1.G.A.2)** | The **name of the result** only | *"Two of these triangles make what shape?"* → "a square" | **The composition itself** | **This is the one place drag is unavoidable.** Voice can predict the result, then the child drags to confirm — that's actually better pedagogy than drag alone |
| **Partitioning / early fractions (1.G.A.3, 2.G.3)** | "half", "halves", "fourth", "quarter", "third"; "bigger"/"smaller" | *"One of four equal pieces is called a…?"* → "a fourth"; *"Are fourths bigger or smaller than halves?"* | Cutting the shape | Voice for the vocabulary and the comparison — this standard is unusually voice-rich. Tap to choose where to cut |

**Cross-cutting voice-design rules derived from the review evidence:**

1. **Never say "wrong" on low ASR confidence.** Say *"I didn't catch that — say it again, or tap your answer."* The Duolingo ABC reviews show that a false "wrong" is what breaks trust.
2. **Always show the tap fallback.** Not hidden behind a retry — visible from the first prompt.
3. **Accept multiple spoken forms of every number.** "fourteen" / "one four" / "ten four" / "for-teen". Homophone risk is high with young speakers ("two"/"too"/"to", "eight"/"ate", "one"/"won", "four"/"for").
4. **Never require the child to speak a symbol name.** `>` `<` `=` `+` `−` are tap targets.
5. **Provide captions for all narration.** A 1★ Khan Academy Kids review specifically flags the absence: *"No caption options. Deaf and Hard of Hearing kids will not be able to use this."*
6. **Support the no-microphone case entirely.** A tablet in a classroom or a shared family device may have mic access denied; the whole curriculum must be playable by tap.

---

# Recommendations for our build

## Gamification design

**Adopt (high confidence, evidence-backed):**

1. **Streak with built-in forgiveness from day one.** One "day" = complete one short session (Duolingo's definition: one lesson, no minimum time). Ship **two Streak Freezes** equippable from launch — Duolingo measured +0.38% DAU from the second freeze and frames it in goal-pursuit "slack" research. For a 6-year-old, weekends and family travel guarantee gaps; a streak that breaks weekly is a demotivator, and Duolingo says so explicitly.
2. **Milestone celebration animation.** Duolingo measured **+1.7% D7 retention** purely from making the streak-extension screen more satisfying. This is a cheap, high-yield investment for an animated-character product.
3. **Two-currency model: XP (effort, non-spendable) + coins (spendable, cosmetic-only).** XP shows growth and never resets; coins buy avatar/profile items. This is the SplashLearn/Moose Math/Matific pattern. **Never sell power or progression speed** — that is Prodigy's flaw and it is the specific thing Common Sense Media and reviewers attack.
4. **Persistent personal space as the coin sink.** Moose Math's "build and decorate your own city" is the cleanest K–1 implementation seen; Matific's avatar + unlockable island areas tied to *mastery* (not spend) is the second. Combine: coins → avatar and room items; **mastery → new areas/characters**. Tying some unlocks to mastery rather than currency prevents grinding from substituting for learning.
5. **Badges tied to *strategies*, not just volume.** e.g. "Make-Ten Master", "Counting-On Champion", "Ten More, Ten Less". This maps directly to the Progression's Level 1/2/3 and gives the parent dashboard something meaningful to show. DoodleMath's "badges and stars for daily exercises, traded in for rewards" is the mechanic; make the badge names pedagogical.
6. **Daily goal, sized small and set by the parent.** 3–5 questions or ~5 minutes. Prodigy's parent-set **Goals → in-game Rewards** loop is the most transferable parent feature in the market; build it free, not paid.
7. **Parent dashboard with a weekly email digest.** Prodigy ships weekly progress emails and monthly report cards **on the free tier**; Matific and Mathseeds both send email digests. The differentiator to add: **show which strategy the child is using**, not just accuracy — that is exactly what NCTM says fluency assessment should attend to and no consumer app does it.
8. **"Cheer Them On" style parent-to-child messages.** Prodigy lets a parent send an encouraging message that arrives in-game. For a voice product with an animated character, the character can *speak the parent's message* — a natural, differentiated version of a proven mechanic.

**Avoid (evidence-backed):**

- **Leaderboards and leagues.** Competitive social ranking is inappropriate for 6-year-olds and conflicts with the Kids Category posture. (Prodigy, which has PvP, is *not* in the Kids Category.)
- **Hearts / lives / any failure currency.** Duolingo's hearts drive monetisation but punish a struggling learner; a 1st-grader who is genuinely learning will be wrong often.
- **Timers, countdowns and speed scoring.** NCTM: timed tests *"should be avoided."* Monster Math and DoodleMath both market the absence of them.
- **Purchasable currency.** Boddle sells "Boddle Bucks" at $0.99–$19.99 and Prodigy sells Magicoin. This converts the reward economy into a store and invites exactly the "Apple Pay… I just got 15 dollars for my birthday and then I was gone" review.
- **A hard first-session paywall.** SplashLearn's "1 short free activity a day" generated the single angriest review in the entire sample. Give a real, complete free experience — at minimum a full Grade 1 unit.
- **Retroactive removal of free features.** Todo Math's conversion from lifetime to subscription generated the most bitter reviews in that app's feed.

**Compliance shape:**

- **Ship in Apple's Kids Category, Ages 6–8.** That means: no third-party analytics, no behavioural advertising, no PII or device info to third parties, a **parental gate** in front of every purchase surface and outbound link, and a privacy policy ([Guidelines 1.3 / 5.1.4](https://developer.apple.com/app-store/review/guidelines/)). Note the one-way door: *"Once customers expect your app to follow Kids Category requirements, it must continue to meet these guidelines in subsequent updates, even if you deselect the category."*
- **Parental gate pattern:** Todo Math's 3-second press-and-hold is the market-standard, review-verified implementation.
- **Microphone consent needs its own onboarding moment,** with an explicit "you can play entirely by tapping" path — Common Sense Media flags Khan Academy Kids' mic permission as a friction point.

## Content scope for an MVP

**MVP = Grade 1 complete, with Kindergarten fallback and Grade 2 stretch.**

**Phase 1 — the spine (21 Grade 1 standards, ~8 units):**

1. **Numbers to 120** — 1.NBT.A.1 (count from any number; read/write numerals). *Voice-native; the best first unit for demonstrating the voice premise.*
2. **Number bonds and partners to 10** — K.OA.3, K.OA.4 (prerequisites; ship them inside Grade 1, not as a separate grade). *Ten-frame visual, voice answer.*
3. **Counting on** — 1.OA.C.5, 1.OA.B.3 (commutativity as a counting-on shortcut). *Pure voice.*
4. **Make a ten** — 1.OA.C.6, requires K.NBT.1 / 1.NBT.2b (teen numbers as 10 + n). *Ten-frame or rekenrek visual; voice answer; strategy badge.*
5. **Subtraction as an unknown addend** — 1.OA.B.4, 1.OA.D.8. *Pure voice.*
6. **Word problems within 20** — 1.OA.A.1, 1.OA.A.2. *The killer voice use case: no reading required, all unknown positions.*
7. **Tens and ones** — 1.NBT.B.2, B.3, C.5 (10 more / 10 less mentally is the standout voice standard). *Base-ten blocks visual.*
8. **The equal sign** — 1.OA.D.7 (true/false). *Two-button + voice; cheap and high-value, and widely under-taught.*

**Phase 2 — completing Grade 1:** 1.NBT.C.4 and C.6 (adding within 100 with models — needs a real base-ten manipulative), 1.MD.A.1–2 (length), 1.MD.B.3 (time to hour/half-hour), 1.MD.C.4 (data with ≤3 categories), 1.G.A.1 and A.3 (shape attributes; halves and fourths — surprisingly voice-rich), 1.G.A.2 (compose shapes — the one drag-required activity).

**Phase 3 — span ages 5–8:** an adaptive down-shift into the K prerequisites (K.CC.4–5 cardinality, K.OA.2 within 10, K.OA.5 fluent within 5, K.G.1–3 shapes) and an up-shift into Grade 2 (2.OA.2 fluency within 20 and memory of one-digit sums, 2.NBT.2 skip-counting, 2.MD.7 time to five minutes, 2.MD.8 money, 2.G.3 thirds). **Do not build a placement quiz that a 6-year-old must sit through** — DoodleMath and Mathseeds both open with placement tests and both draw "too hard / too boring" reviews; infer level from the first few real questions instead.

**Content design rules:**

- **Sequence by the Progression's Level 1 → 2 → 3, not by standard code order.** Ship counting-on before make-a-ten before place value, exactly as quoted in §B4. The make-ten prerequisites (K.OA.3, K.OA.4, K.NBT.1) must be *taught*, not assumed.
- **Every fact-practice screen is untimed and unpenalised.** Explicit copy: "take your time."
- **Every question carries a strategy hint on the second attempt** ("8 needs how many to make 10?"), mirroring Prodigy's hint system and NCTM's strategy-first stance.
- **Ten-frames, number lines, base-ten blocks and a rekenrek are the four visual primitives.** They cover every "needs a visual" standard in the Grade 1 table.
- **Do not build a reading-dependent UI.** No instruction should require reading; the animated character speaks everything. This is what the Duolingo ABC dyslexia review is asking for, and it is the natural pairing with voice input.
- **Cap Grade 1 at complete coverage before adding Grade 2.** Khan Academy Kids' loudest complaint is its Grade 2 ceiling — but the fix is depth-then-breadth, not a thin K–5 spread. SplashLearn, Boddle and DoodleMath all claim K–5/K–6 and all draw "too easy / too hard / boring after a week" reviews.

**Open questions flagged for follow-up:** (a) funding and revenue for SplashLearn, Prodigy, Enuma and Boddle — no primary source reachable this session; (b) Khan Academy's and Zearn's exact Grade 1 unit ordering — client-side rendered, not fetchable; (c) published accuracy benchmarks for children's automatic speech recognition at ages 5–8 — no primary research source retrieved, and the qualitative evidence here is limited to Duolingo ABC's review feed.

---

# Sources

**Standards and curriculum (primary)**

- Common Core State Standards for Mathematics — official CCSSO-hosted PDF: https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf (Kindergarten pp. 11–12; Grade 1 pp. 15–16; Grade 2 pp. 19–20; Grades 3–5 pp. 21–37). Note: thecorestandards.org now returns HTTP 403.
- Progressions for the Common Core State Standards in Mathematics — index: https://achievethecore.org/page/254/progressions-documents-for-the-common-core-state-standards-for-mathematics
- Draft K–5 Progression on Counting and Cardinality and Operations and Algebraic Thinking (5/29/2011): https://achievethecore.org/content/upload/Draft-K-5%20Progression%20on%20Counting%20and%20Cardinality%20and%20Operations%20and%20Algebraic%20Thinking.pdf
- Draft K–5 Progression on Number and Operations in Base Ten: https://achievethecore.org/content/upload/ccss_progression_nbp_k5_2015_03_16.pdf
- Draft 3–5 Progression on Number and Operations—Fractions: https://achievethecore.org/content/upload/Draft%203–5%20Progression%20on%20Number%20and%20Operations—Fractions.pdf
- Draft K–6 Progression on Geometry: https://achievethecore.org/content/upload/ccss_progression_gk6_2014_12_27.pdf

**Research and position statements**

- NCTM, *Procedural Fluency in Mathematics* (position statement): https://www.nctm.org/Standards-and-Positions/Position-Statements/Procedural-Fluency-in-Mathematics/
- Jo Boaler, *Fluency Without Fear*, youcubed: https://www.youcubed.org/evidence/fluency-without-fear/
- National Mathematics Advisory Panel, *Foundations for Success: The Final Report*, U.S. Department of Education, March 2008: https://files.eric.ed.gov/fulltext/ED500486.pdf (ED.gov's own copy is now 404)
- Global Learning XPRIZE (Enuma / Kitkit School co-win, May 2019): https://www.xprize.org/prizes/global-learning

**Company and investor sources**

- Duolingo, Inc. FY2025 Form 10-K (filed via SEC EDGAR): https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm
- Duolingo blog, *The habit-building research behind your Duolingo streak* (Osman Mansur, 2022-01-31): https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Prodigy Education, *Is a Prodigy Membership Worth It? Your Questions Answered* (2025-08-14): https://www.prodigygame.com/main-en/blog/is-prodigy-membership-worth-it/
- Kahoot!, Kahoot! Kids product page: https://kahoot.com/kids/
- Apple, App Store Review Guidelines (1.3 Kids Category; 5.1.4 Kids Apps): https://developer.apple.com/app-store/review/guidelines/

**Independent reviews**

- Common Sense Media, Prodigy Math Game: https://www.commonsensemedia.org/app-reviews/prodigy-math-game
- Common Sense Media, Khan Academy Kids: https://www.commonsensemedia.org/app-reviews/khan-academy-kids
- Common Sense Media, Todo Math: https://www.commonsensemedia.org/app-reviews/todo-math
- Common Sense **Education** review-programme pause notice (Jan 2026): https://www.commonsense.org/education/reviews/prodigy-math-game

**App Store listings (Apple, US storefront, retrieved 2026-09-09)**

- SplashLearn — https://apps.apple.com/us/app/id672658828
- Prodigy Math Game — https://apps.apple.com/us/app/id950795722
- Khan Academy Kids — https://apps.apple.com/us/app/id1378467217
- Moose Math (Duck Duck Moose) — https://apps.apple.com/us/app/id660345152
- Todo Math (Enuma) — https://apps.apple.com/us/app/id666465255
- Monster Math (Makkajai) — https://apps.apple.com/us/app/id931943412
- Math Kids (RV AppStudios) — https://apps.apple.com/us/app/id1272098657
- Kahoot! Numbers by DragonBox — https://apps.apple.com/us/app/id1529174508
- Kahoot! Algebra by DragonBox — https://apps.apple.com/us/app/id1550574178
- Kahoot! Kids — https://apps.apple.com/us/app/id6444439181
- Matific — https://apps.apple.com/us/app/id1440019986
- Boddle — https://apps.apple.com/us/app/id1520367760
- MathTango (Piknik) — https://apps.apple.com/us/app/id6475483877
- Mathseeds (Blake eLearning) — https://apps.apple.com/us/app/id1632175905
- Marble Math Junior (Artgig) — https://apps.apple.com/us/app/id528617628
- DoodleMath (Discovery Education) — https://apps.apple.com/us/app/id598196680
- Lingokids — https://apps.apple.com/us/app/id1002043426
- HOMER — https://apps.apple.com/us/app/id601437586
- Numberblocks World (Blue-Zoo) — https://apps.apple.com/us/app/id1520827387
- Osmo Numbers (Tangible Play) — https://apps.apple.com/us/app/id1531762562
- Duolingo (contains Math) — https://apps.apple.com/us/app/id570060128
- Duolingo ABC — https://apps.apple.com/us/app/id1440502568
- Mathletics Students (3P Learning) — https://apps.apple.com/us/app/id1369836502
- Quick Math Jr (Shiny Things) — https://apps.apple.com/us/app/id926078360
- ABCmouse (Age of Learning) — https://apps.apple.com/us/app/id6460300848
- Zapzapmath School — https://apps.apple.com/us/app/id1003605763
- Elephant Learning Math Academy — https://apps.apple.com/us/app/id1153181621
- Bedtime Math — https://apps.apple.com/us/app/id637910701
- Endless Numbers (Originator) — https://apps.apple.com/us/app/id804360921

**Google Play listings (US, retrieved 2026-09-09)**

- SplashLearn — https://play.google.com/store/apps/details?id=com.splash.kids.education.learning.games.free.multiplication.reading.math.grade.app.splashmath
- Prodigy Math — https://play.google.com/store/apps/details?id=com.prodigygame.prodigy
- Khan Academy Kids — https://play.google.com/store/apps/details?id=org.khankids.android
- Todo Math — https://play.google.com/store/apps/details?id=com.enuma.todomath
- Monster Math 2 — https://play.google.com/store/apps/details?id=com.makkajai.monstermath2free
- Math Kids — https://play.google.com/store/apps/details?id=com.rvappstudios.math.kids.counting
- Kahoot! Numbers by DragonBox — https://play.google.com/store/apps/details?id=com.kahoot.numbers
- Kahoot! Algebra by DragonBox — https://play.google.com/store/apps/details?id=com.kahoot.algebra5
- Kahoot! Kids — https://play.google.com/store/apps/details?id=com.kahoot.kids
- Boddle — https://play.google.com/store/apps/details?id=com.boddle.learning
- Mathseeds — https://play.google.com/store/apps/details?id=com.blake.mathseeds
- Moose Math — https://play.google.com/store/apps/details?id=com.duckduckmoosedesign.km
- Duolingo — https://play.google.com/store/apps/details?id=com.duolingo
- Duolingo ABC — https://play.google.com/store/apps/details?id=com.duolingo.literacy
- (Verified absent: `com.duolingo.math` returns 404 — no standalone Duolingo Math app)

**App Store customer review feeds (Apple public RSS, sampled 2026-09-09)**

Pattern: `https://itunes.apple.com/us/rss/customerreviews/id=<trackId>/sortby=mostrecent/json` — sampled for SplashLearn (672658828), Prodigy (950795722), Khan Academy Kids (1378467217), Todo Math (666465255), Monster Math (931943412), Boddle (1520367760), Lingokids (1002043426), Kahoot! Numbers (1529174508), MathTango (6475483877), Duolingo ABC (1440502568), Duolingo (570060128), Matific (1440019986), DoodleMath (598196680), Mathseeds (1632175905), HOMER (601437586), Numberblocks World (1520827387).

**Store metadata API**

- Apple iTunes Lookup API: `https://itunes.apple.com/lookup?id=<trackId>&country=us` — source for developer name, genres, content advisory rating, price, average rating, rating count, version and release date for every iOS app in the table.
