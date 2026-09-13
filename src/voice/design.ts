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
 * for: `Native [Language]. [Gender], [Age range]. [Quality]. Persona: ...
 * Emotion: ...`.
 */
export const OLLIE_VOICE_BRIEF = [
  "Native English.",
  "Gender-neutral leaning bright, a child of about eleven.",
  "Warm, playful, gently energetic, with slow clear diction and every word landing separately, reading to a six-year-old who cannot read yet.",
  "Voice: a kind older child.",
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
