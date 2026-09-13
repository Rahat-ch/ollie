/**
 * The Calibration Set: the 20 Stories and 10 Parent Summaries the Judge
 * must agree with before its scores count.
 *
 * The Stories: 20 that all pass the validator,
 * hand-labelled for what only a reader can judge. The human verdicts
 * decide; the Judge must agree with them above the threshold before its
 * scores on new Stories are reported. Labelled by the developer on
 * 2026-09-13. Never a real child's data: the Nickname is a placeholder.
 */
import { emptyNotes, getSkill } from "@/loop";
import type { SkillId } from "@/loop";
import type { StoryInput, SummaryInput, SummaryPractice } from "@/generation/types";
import type { ThemeId } from "@/profile/identity";
import { NICKNAME_PLACEHOLDER as N } from "@/story/nickname";
import { storyShape } from "@/story/shapes";
import type { CalibrationStory, CalibrationSummary } from "./judge";

/** The input for a structure laid out from a whole and a part, as the Skill's generator would. */
function input(theme: ThemeId, structure: string, whole: number, part: number): StoryInput {
  const { skill, equation } = storyShape(structure);
  const e = equation(whole, part);
  return { skill, structure, equation: e, answer: e[e.unknown], theme, nickname: N };
}

const story = (id: string, pass: boolean, note: string, i: StoryInput, text: string): CalibrationStory => ({ id, pass, note, input: i, text });

export const STORY_CALIBRATION_SET: readonly CalibrationStory[] = [
  // Pass: natural, the action matches the arithmetic, in the Theme.
  story("c01", true, "Add-to told as puppies arriving; simple and in the Theme.", input("puppies", "add-to", 12, 7), `${N} has 7 puppies in the yard. 5 more puppies run in, so how many puppies are there now?`),
  story("c02", true, "Take-from told as fish swimming away.", input("ocean", "take-from", 12, 4), `${N} sees 12 fish by the reef. 4 fish swim away, so how many fish are still by the reef?`),
  story("c03", true, "Put-together with two named groups and a total question.", input("space", "put-together", 14, 6), `${N} counts 6 stars and 8 comets in the night sky. How many things does ${N} count altogether?`),
  story("c04", true, "Add-to change: start and end given, the change asked and never stated.", input("dinosaurs", "add-to-change", 13, 4), `${N} had 9 dinosaur eggs in the nest. Now there are 13 eggs, so how many eggs did the dinosaurs bring?`),
  story("c05", true, "Take-from change: start and end given, asks how many went.", input("trucks", "take-from-change", 11, 6), `${N} parked 11 trucks at the site. Now only 5 trucks are there, so how many trucks drove away?`),
  story("c06", true, "Fairies add-to with a short second sentence.", input("fairies", "add-to", 12, 3), `${N} sees 3 fairies dance by the pond. 9 more fairies fly in, so how many fairies dance now?`),
  story("c07", true, "Take-from with bones, a natural leaving verb.", input("puppies", "take-from", 10, 3), `${N} put 10 bones in the bowl. The puppies took 3 bones away, so how many bones are in the bowl?`),
  story("c08", true, "Put-together in the truck Theme.", input("trucks", "put-together", 11, 4), `${N} has 4 big trucks and 7 little trucks. How many trucks does ${N} have altogether?`),
  story("c09", true, "Change unknown with rockets landing, end state stated.", input("space", "add-to-change", 12, 7), `${N} saw 5 rockets on the moon. Then more rockets landed and now there are 12, so how many rockets landed?`),
  story("c10", true, "Take-from change with dinosaurs leaving the cave.", input("dinosaurs", "take-from-change", 14, 5), `14 dinosaurs slept in the cave with ${N}. Now 9 dinosaurs are left, so how many dinosaurs went out?`),
  story("c11", true, "Ocean add-to with the Nickname in the question.", input("ocean", "add-to", 14, 8), `8 crabs sit on the sand. 6 more crabs come out of the waves, so how many crabs can ${N} see?`),
  story("c12", true, "Past tense throughout, still simple.", input("fairies", "take-from", 9, 2), `${N} found 9 flowers in the fairy garden. 2 flowers went to the pixies, so how many flowers did ${N} keep?`),

  // Fail: the validator passes these, a reader does not.
  story("c13", false, "Says the take-from as more arriving: the action contradicts the arithmetic.", input("puppies", "take-from", 12, 5), `${N} has 12 puppies in the park. 5 more puppies come to play, so how many puppies are there now?`),
  story("c14", false, "Add-to narrated as leaving; asks how many are left.", input("ocean", "add-to", 12, 7), `${N} sees 7 fish by the boat. 5 fish swim away, so how many fish are left?`),
  story("c15", false, "Word order and grammar a child could not follow.", input("space", "add-to", 9, 6), `Rockets 6 the moon on ${N} sees them. More 3 rockets the sky then, how many rockets now there are?`),
  story("c16", false, "A bare sum with a Theme word pasted on; no scene.", input("dinosaurs", "put-together", 14, 5), `${N} has 5 and 9 dinosaurs. How many dinosaurs?`),
  story("c17", false, "Change unknown that asks for the end instead of the change.", input("trucks", "add-to-change", 12, 4), `${N} has 8 trucks. More trucks come, and now there are 12 trucks, so how many trucks are there now?`),
  story("c18", false, "Put-together that asks about only one group.", input("fairies", "put-together", 11, 6), `${N} sees 6 fairies and 5 butterflies in the garden. How many fairies does ${N} see?`),
  story("c19", false, "Take-from change narrated as arriving, so the question makes no sense.", input("puppies", "take-from-change", 12, 4), `${N} had 12 puppies. Then more puppies came and now there are 8, so how many puppies came?`),
  story("c20", false, "The numbers are there but the scene is nonsense for a six-year-old.", input("ocean", "take-from", 11, 6), `${N} is 11 waves of the shell. 6 pearls the whale did, so how many waves does the reef keep?`),
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

/** The evidence a Parent Summary was written from: a Session tallied, with nothing personal in it. */
function evidence(
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

const summary = (id: string, pass: boolean, note: string, input: SummaryInput, practiced: string, activity: string): CalibrationSummary => ({
  id,
  pass,
  note,
  input,
  output: { practiced, activity },
});

const CROSSING_TEN = evidence(4, [practice("make-a-ten", 4, 2, 1)]);
const TWO_SKILLS = evidence(6, [practice("counting-on", 5, 0, 0), practice("unknown-addend", 2, 1, 2)]);
const MASTERED_SESSION = evidence(9, [practice("partners-to-10", 8, 0, 0)], { mastered: ["Partners to 10"] });

/**
 * The Calibration Set for Parent Summaries: 10 notes over evidence the
 * engine could have tallied, hand-labelled for faithfulness — the thing
 * only a reader can judge. Every one of them passes the Summary validator,
 * so the four that fail do so for what a program cannot see: a claim the
 * evidence does not support, a claim about the child's thinking in words no
 * list catches, and evidence run together as "got them right". Labelled by
 * the developer on 2026-09-13. Never a real child's data.
 */
export const SUMMARY_CALIBRATION_SET: readonly CalibrationSummary[] = [
  // Pass: every claim is in the evidence, the three Assistance States stay apart.
  summary(
    "s01",
    true,
    "Every count is the engine's and the three states are kept apart.",
    CROSSING_TEN,
    "Your child worked on make-a-ten this Session. 4 of the 7 Problems were right on the first try, 2 more came right after a Hint, and 1 was Revealed.",
    "Put nine raisins in a bowl and ask how many more make ten, then eat the extras together.",
  ),
  summary(
    "s02",
    true,
    "Two strategies, each with its own evidence, and no claim beyond it.",
    TWO_SKILLS,
    "Two strategies this Session. Counting on: 5 Problems, all right on the first try. Subtraction as unknown addend: 2 first-try correct, 1 after a Hint, and 2 Revealed.",
    "Hide some socks behind your back, show the rest, and take turns working out how many are hidden.",
  ),
  summary(
    "s03",
    true,
    "Names what was Mastered, which the evidence says.",
    MASTERED_SESSION,
    "Partners to 10 is Mastered. All 8 Problems were right on the first try, with no Hints and nothing Revealed.",
    "Lay out ten spoons, hide some under a cloth, and take turns saying how many are hiding.",
  ),
  summary(
    "s04",
    true,
    "Says the Revealed Problem plainly, without softening it into a success.",
    CROSSING_TEN,
    "Make-a-ten was the work this Session. 4 Problems were first-try correct, 2 needed a Hint before the right answer, and on 1 Ollie showed the answer.",
    "Count out nine buttons, add some more, and talk about what it takes to fill a group of ten first.",
  ),
  summary(
    "s05",
    true,
    "Short and plain, and everything in it is in the evidence.",
    TWO_SKILLS,
    "Counting on went well: 5 of 5 on the first try. Unknown addend is newer — 2 first-try correct, 1 after a Hint, 2 Revealed.",
    "Put a few pegs in one hand and some in the other, show one hand, and work out how many are hiding.",
  ),
  summary(
    "s06",
    true,
    "Mentions the Hypothesis as something Ollie is watching, not as fact.",
    evidence(4, [practice("make-a-ten", 4, 2, 1)], {
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
    "Make-a-ten this Session: 4 first-try correct, 2 right after a Hint, 1 Revealed. Ollie is watching whether sums that cross ten are the harder ones and will try a few more next time.",
    "Fill a bowl to ten with grapes before adding the rest, and count the two groups out loud together.",
  ),

  // Fail: the validator passes these, a reader does not.
  summary(
    "s07",
    false,
    "Runs a Hint-assisted success and a Revealed answer together as a little help, so the evidence cannot be told apart.",
    CROSSING_TEN,
    "Your child got 4 of the 7 make-a-ten Problems right this Session and just needed a little help with the rest.",
    "Count nine cubes into a line and work out how many more make ten.",
  ),
  summary(
    "s08",
    false,
    "Claims how she was thinking, in words no list of phrases catches.",
    CROSSING_TEN,
    "Make-a-ten: 4 first-try correct, 2 after a Hint, 1 Revealed. She is clearly picturing the ten-frame before she answers, and only slips when she rushes.",
    "Fill a ten-frame with coins and talk about what is missing.",
  ),
  summary(
    "s09",
    false,
    "Claims a Mastery and a Power the evidence does not have.",
    TWO_SKILLS,
    "Counting on is now Mastered and Ollie has learned Count-On Flight. Unknown addend had 2 first-try correct, 1 after a Hint, and 2 Revealed.",
    "Say a number and count on three more together, without starting again at one.",
  ),
  summary(
    "s10",
    false,
    "Praise the evidence does not support, and an activity for a Skill that was not the weakest.",
    TWO_SKILLS,
    "A great Session all round: counting on and unknown addend are both solid now, with 5 first-try correct on counting on and a little help on the rest.",
    "Practise counting on to twenty on your fingers before bed.",
  ),
];
