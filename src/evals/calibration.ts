/**
 * The Calibration Set for Stories: 20 Stories that all pass the validator,
 * hand-labelled for what only a reader can judge. The human verdicts
 * decide; the Judge must agree with them above the threshold before its
 * scores on new Stories are reported. Labelled by the developer on
 * 2026-09-13. Never a real child's data: the Nickname is a placeholder.
 */
import type { StoryInput } from "@/generation/types";
import type { ThemeId } from "@/profile/identity";
import { NICKNAME_PLACEHOLDER as N } from "@/story/nickname";
import { storyShape } from "@/story/shapes";
import type { CalibrationStory } from "./judge";

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
