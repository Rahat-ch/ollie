import { expect, test, type Page } from "@playwright/test";

const PROFILE_KEY = "ollie.profile";

/** The engine's arithmetic, done independently from the equation on screen. */
function solve(equation: string): number {
  const match = equation.replace(/\s+/g, " ").match(/^(\d+|\?) ([+−]) (\d+|\?) = (\d+|\?)$/);
  if (!match) throw new Error(`not an equation: "${equation}"`);
  const [, left, op, right, result] = match;
  const n = Number;
  if (result === "?") return op === "+" ? n(left) + n(right) : n(left) - n(right);
  if (right === "?") return op === "+" ? n(result) - n(left) : n(left) - n(result);
  return op === "+" ? n(result) - n(right) : n(result) + n(right);
}

const wrongAnswer = (answer: number): number => (answer === 0 ? 1 : answer - 1);

/** Wait for a Problem to be asked and read it off the screen. */
async function asked(page: Page): Promise<{ id: string; answer: number }> {
  const stage = page.locator('main[data-phase="asking"]');
  await expect(stage).toBeVisible();
  const id = (await stage.getAttribute("data-problem")) ?? "";
  const answer = solve(await page.getByTestId("equation").innerText());
  return { id, answer };
}

const key = (page: Page, n: number) => page.getByRole("button", { name: String(n), exact: true });

async function readProfile(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), PROFILE_KEY);
}

test("a Learner plays the first Session to the celebration with taps only and no network", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(page.getByTestId("path-stop")).toHaveCount(3);
  await expect(page.getByTestId("path-stop").nth(0)).toHaveAttribute("data-state", "current");
  await expect(page.locator("input, textarea, [contenteditable]")).toHaveCount(0);
  await page.getByRole("link", { name: "Play" }).click();

  // The Diagnostic Session: nine Problems.
  await expect(page.getByTestId("progress-dot")).toHaveCount(9);
  await expect(page.locator("input, textarea, [contenteditable]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Repeat" })).toBeVisible();

  // Problem 1: first-try correct. Ollie celebrates, then moves on by itself.
  const first = await asked(page);
  const spoken = await page.getByTestId("speech-bubble").innerText();
  await key(page, first.answer).click();
  await expect(page.locator('main[data-phase="correct"]')).toBeVisible();
  await expect(page.locator(".ollie")).toHaveAttribute("data-pose", "celebrate");
  await expect(page.getByTestId("answer")).toHaveText(String(first.answer));

  // Problem 2: a first miss shows the Hint with the visual; the retry is right.
  const second = await asked(page);
  expect(second.id).not.toBe(first.id);
  const miss = wrongAnswer(second.answer);
  await key(page, miss).click();
  await expect(page.locator('main[data-phase="hint"]')).toBeVisible();
  await expect(page.locator(".ollie")).toHaveAttribute("data-pose", "encourage");
  await expect(page.getByTestId("speech-bubble")).not.toHaveText(spoken);
  await expect(page.getByTestId("unknown")).toHaveText("?");
  await expect(key(page, miss)).toBeDisabled();
  await expect(page.locator('[data-testid="ten-frame"], [data-testid="number-line"]')).toBeVisible();
  await key(page, second.answer).click();
  await expect(page.locator('main[data-phase="correct"]')).toBeVisible();

  // Problem 3: a second miss is the Reveal, with the answer filled in and a Next button.
  const third = await asked(page);
  await key(page, wrongAnswer(third.answer)).click();
  await expect(page.locator('main[data-phase="hint"]')).toBeVisible();
  await key(page, wrongAnswer(wrongAnswer(third.answer))).click();
  await expect(page.locator('main[data-phase="reveal"]')).toBeVisible();
  await expect(page.getByTestId("answer")).toHaveText(String(third.answer));
  await expect(key(page, third.answer)).toBeDisabled();

  // The Assistance States recorded so far, read from the Profile the page keeps.
  const midway = await readProfile(page);
  expect(midway.session.entries.map((e: { assistance: string }) => e.assistance)).toEqual([
    "first-try-correct",
    "hint-assisted-correct",
    "revealed",
  ]);
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // The rest first-try, then the celebration.
  for (let i = 4; i <= 9; i++) {
    const { answer } = await asked(page);
    await key(page, answer).click();
  }
  await expect(page.getByTestId("celebration")).toBeVisible();
  await expect(page.getByText("You did it!")).toBeVisible();
  await expect(page.getByText("9 Problems")).toBeVisible();

  const done = await readProfile(page);
  expect(done.progress.sessionsCompleted).toBe(1);
  expect(done.session).toBeNull();
  expect(done.progress.skills["partners-to-10"].recentFirstAttempts.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();

  // Reloading keeps the Profile: the next Session is the Baseline's six Problems, not the Diagnostic nine.
  await page.reload();
  const reloaded = await readProfile(page);
  expect(reloaded.progress).toEqual(done.progress);
  await expect(page.getByTestId("path-stop")).toHaveCount(3);
  await page.getByRole("link", { name: "Play" }).click();
  await expect(page.getByTestId("progress-dot")).toHaveCount(6);

  expect(offHost).toEqual([]);
});

test("reloading mid-Session resumes the same Problem with progress intact", async ({ page }) => {
  await page.goto("/play");
  const first = await asked(page);
  await key(page, first.answer).click();
  const second = await asked(page);
  await expect(page.getByTestId("progress-dot").nth(0)).toHaveAttribute("data-state", "done");

  await page.reload();
  const resumed = await asked(page);
  expect(resumed).toEqual(second);
  await expect(page.getByTestId("progress-dot").nth(0)).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("progress-dot").nth(1)).toHaveAttribute("data-state", "current");
});
