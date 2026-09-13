/**
 * Ollie's fixed lines: hand-written, never model-written. Every one of them
 * is rendered once in Ollie's voice and bundled (src/voice); the greeting is
 * the one line with a Nickname in it, so it is rendered per Nickname instead.
 */
/** The home greeting, by Nickname: the handover from onboarding is Ollie saying it. */
export const greeting = (nickname: string): string => `Hi, ${nickname}! Ready to play?`;

const CHEERS = ["Yes!", "You got it!", "That's it!", "Nice one!"] as const;

/** How many cheers rotate, so the line catalogue can render each one. */
export const CHEER_COUNT = CHEERS.length;

/** A cheer for a correct answer, rotating by position so a Session does not repeat itself. */
export function cheerFor(position: number, answer: number): string {
  return `${CHEERS[(position - 1) % CHEERS.length]} ${answer}!`;
}

export const revealLine = (answer: number): string => `It's ${answer}. Look, let's see why.`;

export const SESSION_DONE = "You did it!";

export const MASTERED_LINE = (skillName: string): string => `You know ${skillName} now!`;

/** How long a line is on Ollie's beak with no audio yet: reading pace, bounded. */
export function speakingMs(line: string): number {
  return Math.min(5000, Math.max(1500, line.length * 55));
}
