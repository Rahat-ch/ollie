import { expect, test, type Page } from "@playwright/test";

const PROFILE_KEY = "ollie.profile";

const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
const fresh = (estimate: number) => ({ estimate, recentFirstAttempts: [], mastered: false });

/** A Profile with Units 1 and 2 Mastered and one Session played, so the next Session is the Baseline's first in Unit 3. */
const UNIT_3_PROFILE = {
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

type StoredProblem = { id: string; skill: string; structure: string; spoken: string };

test("a Learner in Unit 3 hears each word problem in her Theme with her Nickname; with no key on the server every Story is the template and the Session still completes; no request leaves the host", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  const storyRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
    if (request.url() === `${baseURL}/api/story` && request.method() === "POST") storyRequests.push(request.postData() ?? "");
  });

  await page.goto("/");
  await page.evaluate(([k, profile]) => localStorage.setItem(k, JSON.stringify(profile)), [PROFILE_KEY, UNIT_3_PROFILE] as const);
  await page.goto("/play");

  // The Baseline's Unit 3 Session: 6 result-unknown Problems and 2 Review Problems.
  await expect(page.getByTestId("progress-dot")).toHaveCount(8);
  const problems: StoredProblem[] = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).session.problems, PROFILE_KEY);
  const unit3 = problems.filter((p) => p.skill === "result-unknown");
  expect(unit3).toHaveLength(6);

  let hinted = false;
  for (const problem of problems) {
    const stage = page.locator(`main[data-phase="asking"][data-problem="${problem.id}"]`);
    await expect(stage).toBeVisible();
    const answer = solve(await page.getByTestId("equation").innerText());
    if (problem.skill === "result-unknown") {
      // The Story arrives from the server (the template, as the test server has no key), in the Theme, by Nickname.
      await expect(stage).toHaveAttribute("data-story-source", "template");
      const bubble = page.getByTestId("speech-bubble");
      await expect(bubble).toContainText("Mia");
      await expect(bubble).toContainText(/rockets|stars/);
      await expect(bubble).toHaveText(/\?$/);
      await expect(bubble).not.toHaveText(problem.spoken);
      await expect(page.getByTestId("theme-picture")).toBeVisible();
      await expect(page.locator('[data-testid="ten-frame"], [data-testid="number-line"]')).toHaveCount(0);
      if (!hinted) {
        // One miss: the hand-written Hint with the Theme picture still up, then the retry.
        hinted = true;
        await key(page, answer === 0 ? 1 : answer - 1).click();
        await expect(page.locator('main[data-phase="hint"]')).toBeVisible();
        await expect(page.getByTestId("theme-picture")).toBeVisible();
        await expect(bubble).toContainText(/count/i);
      }
    } else {
      await expect(stage).not.toHaveAttribute("data-story-source", /./);
      await expect(page.locator('[data-testid="ten-frame"], [data-testid="number-line"]')).toBeVisible();
    }
    await key(page, answer).click();
    await expect(page.locator('main[data-phase="correct"]')).toBeVisible();
  }

  await expect(page.getByTestId("celebration")).toBeVisible();
  await expect(page.getByText("8 Problems")).toBeVisible();
  expect(storyRequests).toHaveLength(6);
  for (const body of storyRequests) expect(body).not.toContain("Mia");
  expect(offHost).toEqual([]);
});
