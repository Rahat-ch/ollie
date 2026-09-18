import { HOME_GREETING } from "@/play/lines";
import { audioFileName } from "@/voice/key";
import { expect, test, type Page } from "./test";
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

/**
 * This spec's premise, made true rather than left to the engine. The fixed
 * lines bundled with the app are in public/voice; Chromium's autoplay policy
 * fails to play them without a gesture, so in Chromium the chain always fell
 * past the bundled step of its own accord, while WebKit plays them and
 * reports `bundled`. Taking the files away is what "nothing on the device"
 * means, and it is now the same premise in both engines.
 */
test.beforeEach(async ({ page }) => {
  await page.route("**/voice/*.mp3", (route) => route.abort());
});

test("with no voice on the server every line falls through to the line on screen, Ollie talks while it is said, and the Session still finishes", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  const speechRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
    if (request.url() === `${baseURL}/api/speech` && request.method() === "POST") speechRequests.push(request.postData() ?? "");
  });

  // The Profile is on the device before the first page is drawn, rather than
  // written into a page that is already showing: WebKit fires a `storage`
  // event in the very window that wrote the key, which would draw the home
  // screen under the test. Play is the first screen either way.
  await page.addInitScript(([k, profile]) => localStorage.setItem(k, JSON.stringify(profile)), [PROFILE_KEY, UNIT_3_PROFILE] as const);
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
    await expect(page.locator("svg.ollie[data-speaking]")).toBeVisible();

    const answer = solve(await page.getByTestId("equation").innerText());
    if (!repeated) {
      // Repeat says the line again. What it costs is counted at the end: one
      // render per Story for the whole Session, however often Repeat is pressed.
      repeated = true;
      await page.getByRole("button", { name: "Repeat" }).click();
      await page.getByRole("button", { name: "Repeat" }).click();
      await expect(stage).toHaveAttribute("data-speech-source", FELL_THROUGH);

      // One miss: the Hint is said too, and the beak moves while it is, even
      // though Ollie is encouraging rather than idle.
      await key(page, answer === 0 ? 1 : answer - 1).click();
      const hint = page.locator('main[data-phase="hint"]');
      await expect(hint).toBeVisible();
      await expect(hint).toHaveAttribute("data-speech-source", FELL_THROUGH);
      await expect(page.locator("svg.ollie")).toHaveAttribute("data-pose", "encourage");
      await expect(page.locator("svg.ollie[data-speaking]")).toBeVisible();
    }
    await key(page, answer).click();
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

test("the home greeting asks the server for nothing: the bubble names the Learner and Ollie reaches for the bundled line", async ({ page, request, baseURL }) => {
  const speechRequests: string[] = [];
  const wanted: string[] = [];
  page.on("request", (asked) => {
    if (asked.url() === `${baseURL}/api/speech` && asked.method() === "POST") speechRequests.push(asked.postData() ?? "");
    if (asked.url().startsWith(`${baseURL}/voice/`)) wanted.push(asked.url());
  });

  await setUpProfile(page, "Mia");
  await expect(page.getByText("Hi, Mia! Ready to play?")).toBeVisible();
  // The bundled step is what Home plays: the one file for "Hi! Ready to
  // play?", the same for every Learner. This spec takes the files away, so
  // the chain falls through from there, and Ollie talks either way.
  await expect(page.locator("main.learner-stage")).toHaveAttribute("data-speech-source", FELL_THROUGH);
  await expect(page.locator("svg.ollie")).toHaveAttribute("data-pose", "talking");
  expect(wanted).toContain(`${baseURL}/voice/${audioFileName(HOME_GREETING)}`);
  // Nothing is asked of the server for the greeting, so the Nickname is not sent for it (ADR 0002).
  expect(speechRequests).toEqual([]);

  // And the route no longer voices one at all: a Story is the only line it takes.
  const answer = await request.post(`${baseURL}/api/speech`, { data: { kind: "greeting", nickname: "Mia" } });
  expect(answer.status()).toBe(400);
});

test("the server says Ollie has no voice rather than failing, so a Story falls through too", async ({ request, baseURL }) => {
  const answer = await request.post(`${baseURL}/api/speech`, {
    data: {
      kind: "story",
      nickname: "Mia",
      theme: "space",
      skill: "result-unknown",
      structure: "add-to",
      equation: { left: 7, op: "+", right: 5, result: 12, unknown: "result" },
      answer: 12,
      text: "Mia sees 7 stars. 5 more stars come out, so how many stars are there now?",
    },
  });
  expect(answer.status()).toBe(503);
  expect(await answer.json()).toEqual({ error: ["ELEVENLABS_API_KEY is not set"] });
});
