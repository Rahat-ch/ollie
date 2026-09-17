import { expect, type Page } from "@playwright/test";
import { localDay } from "@/rewards/rewards";

export const PROFILE_KEY = "ollie.profile";

/** The engine's arithmetic, done independently from the equation on screen. */
export function solve(equation: string): number {
  const match = equation.replace(/\s+/g, " ").match(/^(\d+|\?) ([+−]) (\d+|\?) = (\d+|\?)$/);
  if (!match) throw new Error(`not an equation: "${equation}"`);
  const [, left, op, right, result] = match;
  const num = Number;
  if (result === "?") return op === "+" ? num(left) + num(right) : num(left) - num(right);
  if (right === "?") return op === "+" ? num(result) - num(left) : num(left) - num(result);
  return op === "+" ? num(result) - num(right) : num(result) + num(right);
}

/** A key on the number pad. */
export const key = (page: Page, n: number) => page.getByRole("button", { name: String(n), exact: true });

/** Wait for a Problem to be asked and read it off the screen. */
export async function asked(page: Page): Promise<{ id: string; answer: number }> {
  const stage = page.locator('main[data-phase="asking"]');
  await expect(stage).toBeVisible();
  const id = (await stage.getAttribute("data-problem")) ?? "";
  const answer = solve(await page.getByTestId("equation").innerText());
  return { id, answer };
}

export async function readProfile(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), PROFILE_KEY);
}

/** Play the Session on screen to its celebration, every Problem first-try correct. */
export async function playSession(page: Page): Promise<void> {
  const dots = page.getByTestId("progress-dot");
  await expect(dots.first()).toBeVisible();
  const problems = await dots.count();
  for (let i = 0; i < problems; i++) {
    const { answer } = await asked(page);
    await key(page, answer).click();
  }
  await expect(page.getByTestId("celebration")).toBeVisible();
}

/** Rewrite parts of the stored Profile in the browser: the progress, or the record the Coach has left. */
export async function seedProfile(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    ([k, changes]) => {
      const profile = JSON.parse(localStorage.getItem(k as string)!);
      localStorage.setItem(k as string, JSON.stringify({ ...profile, ...(changes as object) }));
    },
    [PROFILE_KEY, patch] as const,
  );
}

/** Hold the Parent Gate until the Parent Area opens. */
export async function openParentArea(page: Page): Promise<void> {
  await page.goto("/parent");
  const gate = page.getByRole("button", { name: "Hold to open the Parent Area" });
  await gate.hover();
  await page.mouse.down();
  await page.waitForTimeout(3400);
  await page.mouse.up();
  await expect(page.getByTestId("parent-area")).toBeVisible();
}

/**
 * Rewrite the Profile's rewards in the browser, as though the Learner had
 * been playing for days, and the Sessions the Loop counts with them.
 */
export async function seedRewards(page: Page, rewards: Record<string, unknown>, sessionsCompleted?: number): Promise<void> {
  await page.evaluate(
    ([k, patch, sessions]) => {
      const profile = JSON.parse(localStorage.getItem(k as string)!);
      profile.rewards = { ...profile.rewards, ...(patch as object) };
      if (typeof sessions === "number") profile.progress = { ...profile.progress, sessionsCompleted: sessions };
      localStorage.setItem(k as string, JSON.stringify(profile));
    },
    [PROFILE_KEY, rewards, sessionsCompleted] as const,
  );
}

/** The local day a number of days back, by the same rule the app counts the Streak with. */
export function daysAgo(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() - days);
  return localDay(day);
}

const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
const fresh = (estimate: number) => ({ estimate, recentFirstAttempts: [], mastered: false });

/**
 * A Profile as the Parent has just set it up: nothing played, so the next
 * Session is the Diagnostic Session, whose Problems put both the ten-frame
 * and the number line on screen.
 */
export const DIAGNOSTIC_PROFILE = {
  version: 2,
  seed: "e2e-diagnostic",
  identity: { nickname: "Mia", avatarColor: "sky", theme: "space" },
  progress: {
    nextProblemNumber: 1,
    sessionsCompleted: 0,
    skills: {
      "partners-to-10": fresh(0.3),
      "teen-numbers": fresh(0.3),
      "counting-on": fresh(0.3),
      "make-a-ten": fresh(0.2),
      "unknown-addend": fresh(0.2),
    },
  },
  session: null,
};

/**
 * The Unit 3 Profile the design review screenshots from, whose first Story is
 * the longest shape the validator allows: twenty-five words, which the bubble
 * on the shortest iPad sets on three lines. The seed and the Problem number
 * are what pick that Story out of the Content Pool, so both are load-bearing;
 * e2e/layout.spec.ts asserts the three lines rather than trusting them.
 */
export const LONG_STORY_PROFILE = {
  version: 2,
  seed: "design-review-3",
  identity: { nickname: "Mia", avatarColor: "berry", theme: "puppies" },
  progress: {
    nextProblemNumber: 50,
    sessionsCompleted: 4,
    skills: {
      "partners-to-10": mastered,
      "teen-numbers": mastered,
      "counting-on": mastered,
      "make-a-ten": mastered,
      "unknown-addend": mastered,
      "result-unknown": fresh(0.2),
      "change-unknown": fresh(0.15),
    },
  },
  session: null,
};

/** A Profile with Units 1 and 2 Mastered and one Session played, so the next Session is the Baseline's first in Unit 3. */
export const UNIT_3_PROFILE = {
  version: 2,
  seed: "e2e-unit-3",
  identity: { nickname: "Mia", avatarColor: "sky", theme: "space" },
  progress: {
    nextProblemNumber: 50,
    sessionsCompleted: 1,
    skills: {
      "partners-to-10": mastered,
      "teen-numbers": mastered,
      "counting-on": mastered,
      "make-a-ten": mastered,
      "unknown-addend": mastered,
      "result-unknown": fresh(0.2),
      "change-unknown": fresh(0.15),
    },
  },
  session: null,
};

/**
 * A Profile one Session away from teaching Ollie Count-On Flight: Unit 1
 * Mastered so the Baseline plans counting on, one Session played, and four
 * first attempts at counting on already correct, so the six Problems of the
 * next Session carry it over the 8-of-10 rule. Stored as version 5, the
 * version deployed before Powers existed, with the Coach's own record and
 * no Powers, so the browser runs the migration too.
 */
export const COUNTING_ON_PROFILE = {
  version: 5,
  seed: "e2e-counting-on",
  identity: { nickname: "Mia", avatarColor: "sky", theme: "space" },
  progress: {
    nextProblemNumber: 20,
    sessionsCompleted: 1,
    skills: {
      "partners-to-10": mastered,
      "teen-numbers": mastered,
      "counting-on": { estimate: 0.9, recentFirstAttempts: [true, true, true, true], mastered: false },
      "make-a-ten": fresh(0.2),
      "unknown-addend": fresh(0.2),
      "result-unknown": fresh(0.2),
      "change-unknown": fresh(0.15),
    },
  },
  rewards: { coins: 0, lastSessionPaid: 1, streak: 1, lastSessionDay: null, freezes: 2, owned: [], worn: { hat: null, accessory: null, pet: null } },
  coach: {
    notes: { hypotheses: [], strengths: [] },
    plan: null,
    source: null,
    reasons: [],
    unavailable: false,
    lastSessionCoached: 0,
    cited: [],
    changed: [],
    summaries: [],
    awaiting: null,
  },
  session: null,
};

/** Write a whole Profile to the device, as though the Learner had been playing on it. */
export async function writeProfile(page: Page, profile: unknown): Promise<void> {
  await page.goto("/");
  await page.evaluate(([k, value]) => localStorage.setItem(k as string, JSON.stringify(value)), [PROFILE_KEY, profile] as const);
}

/** A Problem in the Session the Profile holds, as the Session screen stores it. */
export type StoredProblem = { id: string; skill: string; structure: string; spoken: string };

/** The Problems of the Session on screen, once the screen has written it to the Profile. */
export async function storedProblems(page: Page): Promise<StoredProblem[]> {
  const problems = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null")?.session?.problems ?? [], PROFILE_KEY);
  await expect.poll(async () => (await problems()).length).toBeGreaterThan(0);
  return problems();
}
