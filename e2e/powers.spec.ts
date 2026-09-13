import { expect, test } from "@playwright/test";
import { asked, COUNTING_ON_PROFILE, key, playSession, readProfile, seedProfile, storedProblems, type StoredProblem } from "./play";

// Several Sessions end to end, each Problem waiting on Ollie's beat: more than the default budget.
test.slow();

test("Mastering counting on teaches Ollie Count-On Flight: the celebration is the Power, every counting-on Problem after it is flown, and the Path and the Parent Area keep it", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
  });

  await seedProfile(page, COUNTING_ON_PROFILE);

  // Before the Power there is nothing on the Path.
  await page.goto("/");
  await expect(page.getByTestId("path-power")).toHaveCount(0);

  // The Session that Masters counting on: six counting-on Problems, all first-try.
  await page.getByRole("link", { name: "Play" }).click();
  const first = await storedProblems(page);
  expect(first.filter((p) => p.skill === "counting-on")).toHaveLength(6);
  // No Power yet, so Ollie is idle or talking on a counting-on Problem, never flying.
  await expect(page.locator('main[data-phase="asking"]')).not.toHaveAttribute("data-power", /./);
  await playSession(page);

  // The Power is the headline: Ollie takes the pose and says the Learner taught it.
  const celebration = page.getByTestId("celebration");
  await expect(celebration).toHaveAttribute("data-power", "count-on-flight");
  await expect(page.getByText("You taught me Count-On Flight!")).toBeVisible();
  await expect(page.getByTestId("power-earned")).toContainText("Count-On Flight");
  await expect(celebration.locator(".ollie")).toHaveAttribute("data-pose", "count-on-flight");
  // The Session's Coins and Streak are still paid beside the Power.
  await expect(page.getByTestId("coins-earned")).toContainText("10");
  await expect(page.getByTestId("streak-earned")).toBeVisible();
  expect((await readProfile(page)).powers).toEqual(["count-on-flight"]);

  // Home: the Power is on the Path, at Unit 2, where it was learned.
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("path-power")).toHaveCount(1);
  await expect(page.getByTestId("path-power")).toHaveAttribute("data-power", "count-on-flight");

  // From now on Ollie flies every counting-on Problem. The Baseline has moved
  // on to make-a-ten, so counting on comes back as a Review Problem: play on
  // until the Session that has one, each Session started on a fresh page.
  let flown: StoredProblem | undefined;
  for (let session = 0; session < 4 && !flown; session++) {
    await page.goto("/play");
    const problems = await storedProblems(page);
    flown = problems.find((p) => p.skill === "counting-on");
    if (!flown) {
      await playSession(page);
      await page.getByRole("button", { name: "Done" }).click();
      continue;
    }
    // Answer up to the counting-on Problem, checking that no other Problem is flown.
    for (const problem of problems) {
      const stage = page.locator(`main[data-phase="asking"][data-problem="${problem.id}"]`);
      await expect(stage).toBeVisible();
      const { answer } = await asked(page);
      if (problem.id !== flown.id) {
        await expect(stage).not.toHaveAttribute("data-power", /./);
        await expect(page.locator(".hop-beat")).toHaveCount(0);
        await key(page, answer).click();
        continue;
      }
      await expect(stage).toHaveAttribute("data-power", "count-on-flight");
      await expect(stage.locator(".ollie")).toHaveAttribute("data-pose", "count-on-flight");
      await expect(page.getByTestId("number-line")).toHaveAttribute("data-power", "count-on-flight");
      // The wing beats fly the hops, one pair to a hop, from the Hint on. 0 is never the answer here.
      await key(page, 0).click();
      await expect(page.locator('main[data-phase="hint"]')).toBeVisible();
      const said = (problem.spoken.match(/\d+/g) ?? []).map(Number);
      await expect(page.locator(".hop-beat")).toHaveCount(answer - Math.max(...said));
      break;
    }
  }
  expect(flown, "a Review Problem brings counting on back within four Sessions").toBeDefined();

  // A reload keeps the Power: on the Path, and by name in the Parent Area.
  await page.goto("/");
  await expect(page.getByTestId("path-power")).toHaveAttribute("data-power", "count-on-flight");
  await page.goto("/parent");
  const gate = page.getByRole("button", { name: "Hold to open the Parent Area" });
  await gate.hover();
  await page.mouse.down();
  await page.waitForTimeout(3400);
  await page.mouse.up();
  await expect(page.getByTestId("parent-area")).toBeVisible();
  const rows = page.getByTestId("power-row");
  await expect(rows).toHaveCount(4);
  await expect(rows).toHaveText([/Count-On Flight/, /Make-Ten Magic/, /Missing Number Detective/, /Story Solver/]);
  await expect(rows.nth(0)).toHaveAttribute("data-learned", "yes");
  await expect(rows.nth(1)).toHaveAttribute("data-learned", "no");
  await expect(rows.nth(0)).toContainText("number line");

  expect(offHost).toEqual([]);
});
