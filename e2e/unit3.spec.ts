import { expect, test } from "./test";
import { key, PROFILE_KEY, solve, UNIT_3_PROFILE, type StoredProblem } from "./play";

test("a Learner in Unit 3 hears each word problem in her Theme with her Nickname; every Story comes from the bundled Content Pool with no server call, and the Session still completes; no request leaves the host", async ({ page, baseURL }) => {
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
      // The Story comes from the bundled Content Pool, with no server call, in the Theme, by Nickname.
      await expect(stage).toHaveAttribute("data-story-source", "pool");
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
  // The bundled Pool holds every Story the Baseline's Unit 3 Session draws, so nothing is asked of the server.
  expect(storyRequests).toHaveLength(0);
  expect(offHost).toEqual([]);
});
