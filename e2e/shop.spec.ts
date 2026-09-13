import { expect, test } from "@playwright/test";
import { setUpProfile } from "./onboarding";
import { daysAgo, key, playSession, PROFILE_KEY, readProfile, seedRewards, solve, storedProblems, UNIT_3_PROFILE } from "./play";

test("a completed Session pays ten Coins, the Shop turns them into a hat the Avatar still wears after a reload", async ({ page, baseURL }) => {
  const offHost: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
  });

  await setUpProfile(page);
  await expect(page.getByTestId("coin-count")).toHaveText("0");
  await page.getByRole("link", { name: "Play" }).click();
  await playSession(page);

  // The celebration shows what the Session earned: ten Coins for effort and the first day of the Streak.
  await expect(page.getByTestId("coins-earned")).toContainText("10");
  await expect(page.getByTestId("streak-earned")).toContainText("1");
  await expect(page.getByTestId("milestone")).toHaveCount(0);
  expect((await readProfile(page)).rewards).toMatchObject({ coins: 10, streak: 1, freezes: 2 });

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("coin-count")).toHaveText("10");

  // The Shop: six Avatar Items in three price tiers. Ten Coins buy the cheapest.
  await page.getByRole("link", { name: "Shop" }).click();
  await expect(page.getByTestId("shop-item")).toHaveCount(6);
  const prices = await page.getByTestId("shop-item").evaluateAll((cards) => cards.map((card) => card.getAttribute("data-price")));
  expect(prices).toEqual(["10", "10", "30", "30", "70", "70"]);
  const crown = page.getByRole("button", { name: /Gold Crown/ });
  await expect(crown).toBeDisabled();
  await page.getByRole("button", { name: /Party Hat/ }).click();
  await expect(page.getByTestId("coin-count")).toHaveText("0");
  await expect(page.getByRole("img", { name: "Your Avatar" })).toHaveAttribute("data-worn", "party-hat");

  // Changing the Theme in the Shop is what the next Session's Stories are set in.
  await page.getByRole("button", { name: "Dinosaurs" }).click();
  await page.reload();
  await expect(page.getByRole("img", { name: "Your Avatar" })).toHaveAttribute("data-worn", "party-hat");
  const stored = await readProfile(page);
  expect(stored.identity.theme).toBe("dinosaurs");
  expect(stored.rewards).toMatchObject({ coins: 0, owned: ["party-hat"], worn: { hat: "party-hat" } });

  // Back on the home screen the Avatar wears it too, and the Coins are still spent.
  await page.getByRole("link", { name: "Back to Ollie" }).click();
  await expect(page.getByRole("img", { name: "Your Avatar" })).toHaveAttribute("data-worn", "party-hat");
  await expect(page.getByTestId("coin-count")).toHaveText("0");
  expect(offHost).toEqual([]);
});

test("the third day in a row is a milestone, fired on the day the Streak reaches it", async ({ page }) => {
  await setUpProfile(page);

  // Two days in a row already, the last of them yesterday by the device's local time.
  await seedRewards(page, { coins: 20, lastSessionPaid: 2, streak: 2, lastSessionDay: daysAgo(1) }, 2);
  await page.goto("/play");
  await playSession(page);
  await expect(page.getByTestId("milestone")).toContainText("3");
  await expect(page.getByTestId("streak-earned")).toContainText("3");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("streak-count")).toHaveText("3");

  // The next day: the Streak becomes four, which is no milestone, and three does not fire again.
  await seedRewards(page, { lastSessionDay: daysAgo(1) });
  await page.goto("/play");
  await playSession(page);
  await expect(page.getByTestId("streak-earned")).toContainText("4");
  await expect(page.getByTestId("milestone")).toHaveCount(0);
});

test("the Theme picked in the Shop is the one the next Session's Stories are set in", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(([k, profile]) => localStorage.setItem(k, JSON.stringify(profile)), [PROFILE_KEY, UNIT_3_PROFILE] as const);

  // The Profile was set up in space; the Learner picks dinosaurs instead.
  await page.goto("/shop");
  await page.getByRole("button", { name: "Dinosaurs" }).click();
  await expect(page.locator('[data-testid="shop-theme"][data-theme="dinosaurs"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Back to Ollie" }).click();
  await page.getByRole("link", { name: "Play" }).click();

  // The first word problem of the next Session is told in the dinosaurs' words, not in space's.
  const problems = await storedProblems(page);
  let told = false;
  for (const problem of problems) {
    const stage = page.locator(`main[data-phase="asking"][data-problem="${problem.id}"]`);
    await expect(stage).toBeVisible();
    if (problem.skill === "result-unknown" || problem.skill === "change-unknown") {
      await expect(stage).toHaveAttribute("data-story-source", "template");
      const bubble = page.getByTestId("speech-bubble");
      await expect(bubble).toContainText(/dinosaurs?|eggs?/);
      await expect(bubble).not.toContainText(/rockets?|stars?/);
      told = true;
      break;
    }
    await key(page, solve(await page.getByTestId("equation").innerText())).click();
  }
  expect(told).toBe(true);
});
