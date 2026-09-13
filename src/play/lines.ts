/**
 * Ollie's fixed lines: hand-written, never model-written. Ticket 11 renders
 * each once in Ollie's voice; until then they are read on screen.
 */
/** The home greeting, by Nickname: the handover from onboarding is Ollie saying it. */
export const greeting = (nickname: string): string => `Hi, ${nickname}! Ready to play?`;

const CHEERS = ["Yes!", "You got it!", "That's it!", "Nice one!"] as const;

/** A cheer for a correct answer, rotating by position so a Session does not repeat itself. */
export function cheerFor(position: number, answer: number): string {
  return `${CHEERS[(position - 1) % CHEERS.length]} ${answer}!`;
}

export const revealLine = (answer: number): string => `It's ${answer}. Look, let's see why.`;

export const SESSION_DONE = "You did it!";

export const MASTERED_LINE = (skillName: string): string => `You know ${skillName} now!`;

/** The Streak on the celebration: one day, then days. */
export const streakLine = (days: number): string => `${days} ${days === 1 ? "day" : "days"}`;

/** A Streak milestone, at 3, 7, and 14 days. */
export const milestoneLine = (days: number): string => `${days} days in a row!`;

/** How long a line is on Ollie's beak with no audio yet: reading pace, bounded. */
export function speakingMs(line: string): number {
  return Math.min(5000, Math.max(1500, line.length * 55));
}
