import { expect, test } from "./test";
import { setUpProfile } from "./onboarding";
import { asked, key, readProfile } from "./play";

const wrongAnswer = (answer: number): number => (answer === 0 ? 1 : answer - 1);

/** Two different wrong answers on the pad, so the second miss is never the answer (as `wrongAnswer` twice would be for 1). */
function twoMisses(answer: number): [number, number] {
  const [first, second] = [answer - 1, answer + 1, answer - 2, answer + 2].filter((n) => n >= 0 && n <= 20);
  return [first, second];
}

test("a Parent sets up the Profile, a Learner plays the first Session to the celebration with taps only, and the Parent opens the gate; no network", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
  });

  // Onboarding: four screens for the Parent, the disclosure verbatim, then the home screen greets the Learner by name.
  await page.goto("/");
  await expect(page.getByTestId("onboarding")).toHaveAttribute("data-step", "nickname");
  await expect(page.getByRole("link", { name: "Play" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await page.getByRole("textbox", { name: "Nickname" }).fill("  Mia ");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("onboarding")).toHaveAttribute("data-step", "avatar");
  await page.getByRole("button", { name: "Sky" }).click();
  await expect(page.getByRole("img", { name: "Avatar preview" })).toHaveAttribute("data-color", "sky");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("onboarding")).toHaveAttribute("data-step", "theme");
  await expect(page.getByRole("group", { name: "Theme" }).getByRole("button")).toHaveCount(6);
  await page.getByRole("button", { name: "Space" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("onboarding")).toHaveAttribute("data-step", "note");
  await expect(page.getByTestId("disclosure")).toHaveText(
    "The Nickname is sent to voice the Stories Ollie reads aloud, and nothing else leaves this device. No account, no recording.",
  );
  await page.getByRole("button", { name: "Start playing" }).click();

  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(page.getByText("Hi, Mia! Ready to play?")).toBeVisible();
  await expect(page.locator(".ollie")).toHaveAttribute("data-pose", "talking");
  await expect(page.getByRole("img", { name: "Your Avatar" })).toHaveAttribute("data-color", "sky");
  expect((await readProfile(page)).identity).toEqual({ nickname: "Mia", avatarColor: "sky", theme: "space" });
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
  const [firstMiss, secondMiss] = twoMisses(third.answer);
  await key(page, firstMiss).click();
  await expect(page.locator('main[data-phase="hint"]')).toBeVisible();
  await key(page, secondMiss).click();
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
  expect(reloaded.identity).toEqual(done.identity);
  await expect(page.getByTestId("path-stop")).toHaveCount(3);
  await page.getByRole("link", { name: "Play" }).click();
  await expect(page.getByTestId("progress-dot")).toHaveCount(6);

  // The Parent Gate: a tap does not open it; a continuous three-second press does.
  await page.goto("/");
  await page.getByRole("link", { name: "Grown-ups" }).click();
  const gate = page.getByRole("button", { name: "Hold to open the Parent Area" });
  await expect(gate).toBeVisible();
  await gate.click();
  await gate.click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("parent-area")).toHaveCount(0);
  await gate.hover();
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await expect(page.getByTestId("parent-area")).toHaveCount(0);
  await page.waitForTimeout(2400);
  await page.mouse.up();
  await expect(page.getByTestId("parent-area")).toBeVisible();

  // The Parent Area: the Knowledge Estimate and Mastered state for all seven Skills, and the Nickname.
  await expect(page.getByText("Mia · 1 Session played")).toBeVisible();
  const rows = page.getByTestId("mastery-row");
  await expect(rows).toHaveCount(7);
  await expect(rows).toHaveText([
    /Partners to 10/,
    /Teen numbers/,
    /Counting on from the larger number/,
    /Make-a-ten within 20/,
    /Subtraction as unknown addend/,
    /Result or total unknown/,
    /Change unknown/,
  ]);
  const partners = done.progress.skills["partners-to-10"];
  await expect(rows.nth(0)).toHaveAttribute("data-state", partners.mastered ? "mastered" : "in-progress");
  await expect(rows.nth(0)).toHaveAttribute("data-estimate", String(partners.estimate));
  await expect(rows.nth(0)).toContainText(`${Math.round(partners.estimate * 100)}%`);
  await expect(rows.nth(6)).toHaveAttribute("data-state", "not-started");
  await expect(page.getByRole("region", { name: "Parent Summaries" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Ollie's Notebook" })).toBeVisible();
  await expect(page.getByText("Powers Ollie has learned")).toBeVisible();

  // Leaving and coming back finds the gate closed again; the Learner's screens have no text input.
  await page.getByRole("link", { name: "Back to Ollie" }).click();
  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(page.locator("input, textarea, [contenteditable]")).toHaveCount(0);
  await page.goto("/parent");
  await expect(page.getByTestId("parent-gate")).toBeVisible();
  await expect(page.getByTestId("parent-area")).toHaveCount(0);

  expect(offHost).toEqual([]);
});

test("reloading mid-Session resumes the same Problem with progress intact", async ({ page }) => {
  await setUpProfile(page);
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

test("Play and the Parent route before onboarding go back to the Parent's set-up", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/parent");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
