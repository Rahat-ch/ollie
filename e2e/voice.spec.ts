import { expect, test, type Page } from "@playwright/test";
import { setUpProfile } from "./onboarding";

const PROFILE_KEY = "ollie.profile";

const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
const fresh = (estimate: number) => ({ estimate, recentFirstAttempts: [], mastered: false });

/** A Profile with Units 1 and 2 Mastered and one Session played, so the next Session is the Baseline's first in Unit 3. */
const UNIT_3_PROFILE = {
  version: 3,
  seed: "e2e-voice",
  identity: { nickname: "Mia", avatarColor: "sky", theme: "space" },
  progress: {
    nextProblemNumber: 80,
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

/** The engine's arithmetic, done independently from the equation on screen. */
function solve(equation: string): number {
  const match = equation.replace(/\s+/g, " ").match(/^(\d+|\?) ([+−]) (\d+|\?) = (\d+|\?)$/);
  if (!match) throw new Error(`not an equation: "${equation}"`);
  const [, left, op, right, result] = match;
  const num = Number;
  if (result === "?") return op === "+" ? num(left) + num(right) : num(left) - num(right);
  if (right === "?") return op === "+" ? num(result) - num(left) : num(left) - num(result);
  return op === "+" ? num(result) - num(right) : num(result) + num(right);
}

const key = (page: Page, n: number) => page.getByRole("button", { name: String(n), exact: true });

/** What is left of the chain when nothing is bundled and ElevenLabs cannot be reached. */
const FELL_THROUGH = /^(synthesis|text)$/;

test("with no voice on the server every line falls through to the line on screen, Ollie talks while it is said, and the Session still finishes", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  const speechRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
    if (request.url() === `${baseURL}/api/speech` && request.method() === "POST") speechRequests.push(request.postData() ?? "");
  });

  await page.goto("/");
  await page.evaluate(([k, profile]) => localStorage.setItem(k, JSON.stringify(profile)), [PROFILE_KEY, UNIT_3_PROFILE] as const);
  await page.goto("/play");

  await expect(page.getByTestId("progress-dot")).toHaveCount(8);
  const problems: { id: string; skill: string }[] = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).session.problems, PROFILE_KEY);

  let repeated = false;
  for (const problem of problems) {
    const stage = page.locator(`main[data-phase="asking"][data-problem="${problem.id}"]`);
    await expect(stage).toBeVisible();
    // No line is bundled and the server has no key, so the chain has fallen
    // past both: the platform reads the line, or the line simply stands on
    // screen. Either way the Problem is put to the Learner.
    await expect(stage).toHaveAttribute("data-speech-source", FELL_THROUGH);
    await expect(page.getByTestId("speech-bubble")).not.toBeEmpty();
    await expect(page.locator("svg.ollie")).toHaveAttribute("data-pose", "talking");

    if (!repeated) {
      // Repeat says the line again. What it costs is counted at the end: one
      // render per Story for the whole Session, however often Repeat is pressed.
      repeated = true;
      await page.getByRole("button", { name: "Repeat" }).click();
      await page.getByRole("button", { name: "Repeat" }).click();
      await expect(stage).toHaveAttribute("data-speech-source", FELL_THROUGH);
    }
    await key(page, solve(await page.getByTestId("equation").innerText())).click();
    await expect(page.locator('main[data-phase="correct"]')).toBeVisible();
  }

  const celebration = page.getByTestId("celebration");
  await expect(celebration).toBeVisible();
  await expect(celebration).toHaveAttribute("data-speech-source", FELL_THROUGH);

  // One request per Story and no more, with Repeat pressed twice along the
  // way: a Story's audio is asked for once and replayed from the device.
  const stories = problems.filter((p) => p.skill === "result-unknown");
  expect(stories).toHaveLength(6);
  expect(speechRequests).toHaveLength(stories.length);
  expect(new Set(speechRequests).size).toBe(stories.length);
  // The Nickname is the one word that goes off the device, and only to be voiced.
  for (const request of speechRequests) expect(request).toContain("Mia");
  expect(offHost).toEqual([]);
});

test("the server says Ollie has no voice rather than failing, so the home greeting falls through too", async ({ page, request, baseURL }) => {
  await setUpProfile(page, "Mia");
  await expect(page.locator("main.learner-stage")).toHaveAttribute("data-speech-source", FELL_THROUGH);
  await expect(page.locator("svg.ollie")).toHaveAttribute("data-pose", "talking");

  const answer = await request.post(`${baseURL}/api/speech`, { data: { kind: "greeting", nickname: "Mia" } });
  expect(answer.status()).toBe(503);
  expect(await answer.json()).toEqual({ error: ["ELEVENLABS_API_KEY is not set"] });
});
