/**
 * Every line Ollie can say that is the same for every Learner: the catalogue
 * the build-time render script works through, and the set the app looks a
 * line up in before it falls back to the platform's own speech. A line with
 * the Nickname in it is not here — those are rendered per Nickname at
 * creation time into the Content Pool on the volume (see the speech API route).
 */
import { hintFor, POWERS, rangeFor, SKILLS, type SkillRange } from "@/loop";
import { CHEER_COUNT, cheerFor, powerLine, revealLine, SESSION_DONE } from "@/play/lines";
import { everyDraft } from "./drafts";

/**
 * Ollie's own lines (the Hints, the cheers, the Reveal, Mastered, the end of
 * a Session) or a Problem's spoken line. The render script renders Ollie's
 * first: there are a hundred-odd of them and thousands of Problems.
 */
export type LineKind = "ollie" | "problem";

export type OllieLine = {
  readonly kind: LineKind;
  readonly text: string;
};

/** Every answer the pad takes, and so every number a cheer or a Reveal can name. */
export const PAD_ANSWERS: readonly number[] = Array.from({ length: 21 }, (_, n) => n);

/** One entry per thing said: two Skills can share a Hint, and two structures a spoken line. */
function dedupe(lines: readonly OllieLine[]): OllieLine[] {
  const seen = new Set<string>();
  const kept: OllieLine[] = [];
  for (const line of lines) {
    if (seen.has(line.text)) continue;
    seen.add(line.text);
    kept.push(line);
  }
  return kept;
}

/**
 * Ollie's hand-written lines, each once. Never model-written (ADR 0001).
 * Only what something on screen actually says: the Mastered line on the
 * celebration card is read, not spoken, so it is not here until it is; the
 * Power line is, because Ollie says it on the celebration it is earned on.
 */
export function ollieLines(): OllieLine[] {
  const texts = [
    SESSION_DONE,
    ...POWERS.map((power) => powerLine(power.name)),
    ...SKILLS.flatMap((skill) => skill.structures.map((structure) => hintFor({ skill: skill.id, structure }))),
    ...PAD_ANSWERS.flatMap((answer) => [
      revealLine(answer),
      ...Array.from({ length: CHEER_COUNT }, (_, i) => cheerFor(i + 1, answer)),
    ]),
  ];
  return dedupe(texts.map((text) => ({ kind: "ollie", text })));
}

/** The spoken line of every Problem the engine can draw, over every Skill and structure in the range. */
export function problemLines(range: SkillRange = "default"): OllieLine[] {
  return dedupe(
    SKILLS.flatMap((skill) =>
      everyDraft(skill, { range: rangeFor(skill, range), structures: skill.structures }).map(
        (draft): OllieLine => ({ kind: "problem", text: draft.spoken }),
      ),
    ),
  );
}

/** The whole catalogue: what `pnpm voice:lines` renders and bundles. */
export function fixedLines(range: SkillRange = "default"): OllieLine[] {
  return dedupe([...ollieLines(), ...problemLines(range)]);
}
