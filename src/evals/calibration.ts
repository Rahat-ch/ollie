/**
 * The Calibration Sets' items: the 20 Stories and 10 Parent Summaries the
 * Judge must agree with before its scores count, without their labels.
 *
 * The labels are hand labels kept in one file per labeller under
 * docs/evals/labels (the owner's, written on 2026-09-13, are
 * `stories.owner.json` and `summaries.owner.json`), so a second labeller
 * reading this file learns nothing about how the first one judged. Half of
 * each set is sealed (src/evals/sealed.ts), which is the only module that
 * may import this one. Never a real child's data: the Nickname is a
 * placeholder.
 */
import { emptyNotes, getSkill } from "@/loop";
import type { SkillId } from "@/loop";
import type { StoryInput, SummaryInput, SummaryPractice } from "@/generation/types";
import type { ThemeId } from "@/profile/identity";
import { NICKNAME_PLACEHOLDER as N } from "@/story/nickname";
import { storyShape } from "@/story/shapes";
import type { StoryToJudge, SummaryToJudge } from "./judge";

/** A Story of the Calibration Set, as a labeller or the Judge sees it. */
export type StoryItem = StoryToJudge & { readonly id: string };

/** A Parent Summary of the Calibration Set, with the evidence it was written from. */
export type SummaryItem = SummaryToJudge & { readonly id: string };

/** The input for a structure laid out from a whole and a part, as the Skill's generator would. */
function input(theme: ThemeId, structure: string, whole: number, part: number): StoryInput {
  const { skill, equation } = storyShape(structure);
  const e = equation(whole, part);
  return { skill, structure, equation: e, answer: e[e.unknown], theme, nickname: N };
}

const story = (id: string, i: StoryInput, text: string): StoryItem => ({ id, input: i, text });

/**
 * 20 Stories that all pass the validator, to be judged for what only a
 * reader can: whether a six-year-old could follow it, whether what happens
 * matches the arithmetic, and whether it is a scene in the Theme.
 */
export const STORY_ITEMS: readonly StoryItem[] = [
  story("c01", input("puppies", "add-to", 12, 7), `${N} has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?`),
  story("c02", input("ocean", "take-from", 12, 4), `${N} sees 12 fish by the reef. 4 fish swim away, so how many fish are still by the reef?`),
  story("c03", input("space", "put-together", 14, 6), `${N} counts 6 stars and 8 comets in the night sky. How many things does ${N} count altogether?`),
  story("c04", input("dinosaurs", "add-to-change", 13, 4), `${N} had 9 dinosaur eggs in the nest. Now there are 13 eggs, so how many eggs did the dinosaurs bring?`),
  story("c05", input("trucks", "take-from-change", 11, 6), `${N} parked 11 trucks at the site. Now only 5 trucks are there, so how many trucks drove away?`),
  story("c06", input("fairies", "add-to", 12, 3), `${N} sees 3 fairies dance by the pond. 9 more fairies fly in, so how many fairies dance now?`),
  story("c07", input("puppies", "take-from", 10, 3), `${N} put 10 bones in the bowl. The puppies took 3 bones away, so how many bones are in the bowl?`),
  story("c08", input("trucks", "put-together", 11, 4), `${N} has 4 big trucks and 7 little trucks. How many trucks does ${N} have altogether?`),
  story("c09", input("space", "add-to-change", 12, 7), `${N} saw 5 rockets on the moon. Then more rockets landed and now there are 12, so how many rockets landed?`),
  story("c10", input("dinosaurs", "take-from-change", 14, 5), `14 dinosaurs slept in the cave with ${N}. Now 9 dinosaurs are left, so how many dinosaurs went out?`),
  story("c11", input("ocean", "add-to", 14, 8), `8 crabs sit on the sand. 6 more crabs come out of the waves, so how many crabs can ${N} see?`),
  story("c12", input("fairies", "take-from", 9, 2), `${N} found 9 flowers in the fairy garden. 2 flowers went to the pixies, so how many flowers did ${N} keep?`),
  story("c13", input("puppies", "take-from", 12, 5), `${N} has 12 puppies in the park. 5 more puppies come to play, so how many puppies are there now?`),
  story("c14", input("ocean", "add-to", 12, 7), `${N} sees 7 fish by the boat. 5 fish swim away, so how many fish are left?`),
  story("c15", input("space", "add-to", 9, 6), `Rockets 6 the moon on ${N} sees them. More 3 rockets the sky then, how many rockets now there are?`),
  story("c16", input("dinosaurs", "put-together", 14, 5), `${N} has 5 and 9 dinosaurs. How many dinosaurs?`),
  story("c17", input("trucks", "add-to-change", 12, 4), `${N} has 8 trucks. More trucks come, and now there are 12 trucks, so how many trucks are there now?`),
  story("c18", input("fairies", "put-together", 11, 6), `${N} sees 6 fairies and 5 butterflies in the garden. How many fairies does ${N} see?`),
  story("c19", input("puppies", "take-from-change", 12, 4), `${N} had 12 puppies. Then more puppies came and now there are 8, so how many puppies came?`),
  story("c20", input("ocean", "take-from", 11, 6), `${N} is 11 waves of the shell. 6 pearls the whale did, so how many waves does the reef keep?`),
];

/** One Skill's line of evidence, as the engine tallies it. */
const practice = (skill: SkillId, firstTryCorrect: number, hintAssisted: number, revealed: number): SummaryPractice => ({
  skill,
  name: getSkill(skill).name,
  firstTryCorrect,
  hintAssisted,
  revealed,
  unresolved: 0,
});

/** The Summary input for a Session tallied, with nothing personal in it. */
function summaryInputFor(
  sessionNumber: number,
  rows: readonly SummaryPractice[],
  over: Partial<SummaryInput> = {},
): SummaryInput {
  const problems = rows.reduce((total, row) => total + row.firstTryCorrect + row.hintAssisted + row.revealed + row.unresolved, 0);
  const weakest = rows[rows.length - 1];
  return {
    sessionNumber,
    problems,
    practice: rows,
    mastered: [],
    powers: [],
    weakest: { skill: weakest.skill, name: weakest.name },
    notes: emptyNotes(),
    ...over,
  };
}

const summary = (id: string, input: SummaryInput, practiced: string, activity: string): SummaryItem => ({
  id,
  input,
  output: { practiced, activity },
});

const CROSSING_TEN = summaryInputFor(4, [practice("make-a-ten", 4, 2, 1)]);
const TWO_SKILLS = summaryInputFor(6, [practice("counting-on", 5, 0, 0), practice("unknown-addend", 2, 1, 2)]);
const MASTERED_SESSION = summaryInputFor(9, [practice("partners-to-10", 8, 0, 0)], { mastered: ["Partners to 10"] });

/**
 * 10 Parent Summaries over evidence the engine could have tallied, to be
 * judged for faithfulness, the thing only a reader can judge. Every one of
 * them passes the Summary validator, so any that fails does so for what a
 * program cannot see. Never a real child's data.
 */
export const SUMMARY_ITEMS: readonly SummaryItem[] = [
  summary(
    "s01",
    CROSSING_TEN,
    "Your child worked on make-a-ten this Session. 4 of the 7 Problems were right on the first try, 2 more came right after a Hint, and 1 was Revealed.",
    "Put nine raisins in a bowl and ask how many more make ten, then eat the extras together.",
  ),
  summary(
    "s02",
    TWO_SKILLS,
    "Two strategies this Session. Counting on: 5 Problems, all right on the first try. Subtraction as unknown addend: 2 first-try correct, 1 after a Hint, and 2 Revealed.",
    "Hide some socks behind your back, show the rest, and take turns working out how many are hidden.",
  ),
  summary(
    "s03",
    MASTERED_SESSION,
    "Partners to 10 is Mastered. All 8 Problems were right on the first try, with no Hints and nothing Revealed.",
    "Lay out ten spoons, hide some under a cloth, and take turns saying how many are hiding.",
  ),
  summary(
    "s04",
    CROSSING_TEN,
    "Make-a-ten was the work this Session. 4 Problems were first-try correct, 2 needed a Hint before the right answer, and on 1 Ollie showed the answer.",
    "Count out nine buttons, add some more, and talk about what it takes to fill a group of ten first.",
  ),
  summary(
    "s05",
    TWO_SKILLS,
    "Counting on went well: 5 of 5 on the first try. Unknown addend is newer — 2 first-try correct, 1 after a Hint, 2 Revealed.",
    "Put a few pegs in one hand and some in the other, show one hand, and work out how many are hiding.",
  ),
  summary(
    "s06",
    summaryInputFor(4, [practice("make-a-ten", 4, 2, 1)], {
      notes: {
        hypotheses: [
          {
            id: "h1",
            claim: "May need more practice when a sum crosses ten",
            status: "proposed",
            confidence: 0.5,
            evidence: ["p21", "p24"],
            nextTest: "Give 3 make-a-ten Problems with sums over ten",
          },
        ],
        strengths: [],
      },
    }),
    "Make-a-ten this Session: 4 first-try correct, 2 right after a Hint, 1 Revealed. Ollie is watching whether the bigger sums are the harder ones and will try a few more next time.",
    "Fill a bowl to ten with grapes before adding the rest, and count the two groups out loud together.",
  ),
  summary(
    "s07",
    CROSSING_TEN,
    "Your child got 4 of the 7 make-a-ten Problems right this Session and just needed a little help with the rest.",
    "Count nine cubes into a line and work out how many more make ten.",
  ),
  summary(
    "s08",
    CROSSING_TEN,
    "Make-a-ten: 4 first-try correct, 2 after a Hint, 1 Revealed. She only slips when she rushes, and takes her time whenever the numbers get bigger.",
    "Fill a ten-frame with coins and talk about what is missing.",
  ),
  summary(
    "s09",
    TWO_SKILLS,
    "Counting on is Mastered and Ollie now has Count-On Flight. Unknown addend had 2 first-try correct, 1 after a Hint, and 2 Revealed.",
    "Say a number and count on three more together, without starting again at one.",
  ),
  summary(
    "s10",
    TWO_SKILLS,
    "A great Session all round: counting on and unknown addend are both solid now, with 5 first-try correct on counting on and a little help on the rest.",
    "Practise counting on to twenty on your fingers before bed.",
  ),
];
