/**
 * Ollie's voice as a brief for ElevenLabs Voice Design: the description the
 * voice is designed from, and the lines it is previewed on. `pnpm
 * voice:design` sends both, plays back the three previews it gets, and
 * saves the chosen one as a reusable voice; its ID then lives in
 * ELEVENLABS_VOICE_ID and nowhere in the code.
 */
import { cheerFor, revealLine, SESSION_DONE } from "@/play/lines";
import { hintFor } from "@/loop";

export const OLLIE_VOICE_NAME = "Ollie";

/**
 * The brief from the spec, written in the shape the Voice Design guide asks
 * for: `Native [Language]. [Gender], [Age range]. [Quality]. Voice: ...
 * Emotion: ...`. The spec asks for "a kind older kid"; Voice Design refuses
 * any description of a child's voice (403, blocked generation), so the brief
 * asks for a cute cartoon voice for a friendly owl, youthful and bright, with
 * the same warmth and pace instead (decisions.md, amendment 31).
 */
export const OLLIE_VOICE_BRIEF = [
  "Native English.",
  "A cute cartoon voice for a friendly owl character.",
  "Gender-neutral leaning bright, youthful.",
  "Warm, playful, gently energetic, with slow clear diction and every word landing separately, reading aloud to a young listener who cannot read yet.",
  "Emotion: encouraging and delighted, patient after a wrong answer, never flat.",
  "Not a baby voice, not a teacher voice, not a narrator.",
].join(" ");

/** What ElevenLabs accepts as preview text, in characters. Its own bounds; a shorter preview is refused. */
export const PREVIEW_LIMITS = { min: 100, max: 1000 } as const;

/** Ollie's own lines, one per line of text: a greeting is left out because the preview must fit every Learner. */
export const OLLIE_VOICE_PREVIEW = [
  hintFor({ skill: "counting-on", structure: "larger-first" }),
  cheerFor(1, 12),
  revealLine(8),
  hintFor({ skill: "partners-to-10", structure: "missing-partner" }),
  SESSION_DONE,
].join("\n");
