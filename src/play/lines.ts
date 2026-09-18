/**
 * Ollie's fixed lines: hand-written, never model-written. Every one of them
 * is the same for every Learner, so every one is rendered once in Ollie's
 * voice and bundled (src/voice). The home greeting is the one line whose
 * words on screen are not the words Ollie says: the bubble names the Learner
 * and the line Ollie says only says hi, so the home screen renders nothing
 * per Nickname and sends nothing for it (decisions.md, amendment 32).
 */
/** The home greeting on screen, by Nickname: the handover from onboarding is Ollie greeting the Learner. */
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

/** What Ollie says on the home screen while the bubble names the Learner: a fixed line like every other. */
export const HOME_GREETING = "Hi! Ready to play?";

export const MASTERED_LINE = (skillName: string): string => `You know ${skillName} now!`;

/** The headline of the Session a Power is earned on: the Learner taught it to Ollie. */
export const powerLine = (powerName: string): string => `You taught me ${powerName}!`;

/** The Streak on the celebration: one day, then days. */
export const streakLine = (days: number): string => `${days} ${days === 1 ? "day" : "days"}`;

/** A Streak milestone, at 3, 7, and 14 days. */
export const milestoneLine = (days: number): string => `${days} days in a row!`;

/** How long a line is on Ollie's beak with no audio yet: reading pace, bounded. */
export function speakingMs(line: string): number {
  return Math.min(5000, Math.max(1500, line.length * 55));
}
