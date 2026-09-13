import { expect, test } from "@playwright/test";
import { setUpProfile } from "./onboarding";
import { asked, key, openParentArea, readProfile, seedProfile } from "./play";

const mastered = { estimate: 0.99, recentFirstAttempts: Array(10).fill(true), mastered: true };
const fresh = (estimate: number) => ({ estimate, recentFirstAttempts: [], mastered: false });

/** Units 1 unlocked into Unit 2, three Sessions played: what a Coach-planned Session follows. */
const PROGRESS = {
  nextProblemNumber: 30,
  sessionsCompleted: 3,
  skills: {
    "partners-to-10": mastered,
    "teen-numbers": mastered,
    "counting-on": fresh(0.4),
    "make-a-ten": fresh(0.3),
    "unknown-addend": fresh(0.2),
    "result-unknown": fresh(0.2),
    "change-unknown": fresh(0.15),
  },
};

const hypothesis = {
  id: "h1",
  claim: "May need more practice when a sum crosses ten",
  status: "supported",
  confidence: 0.7,
  evidence: ["p12", "p15"],
  nextTest: "Give 3 make-a-ten Problems with sums over ten and watch the first try",
};

/** The Coach's Plan for Session 4: six make-a-ten Problems with the larger addend 8 or 9. */
const PLAN = {
  length: 6,
  skills: [{ skill: "make-a-ten", weight: 1, numberRange: { min: 8, max: 9 } }],
  reviewShare: 0,
  hypothesisUnderTest: "h1",
};

const summary = (sessionNumber: number) => ({
  sessionNumber,
  at: `2026-09-0${sessionNumber}T18:30:00.000Z`,
  practiced: `Session ${sessionNumber}: your child worked on make-a-ten.`,
  activity: "Count out nine raisins and work out how many more make ten.",
  source: "summary",
  problems: 6,
  practice: [{ skill: "make-a-ten", name: "Make-a-ten within 20", firstTryCorrect: 4, hintAssisted: 1, revealed: 1, unresolved: 0 }],
  mastered: [],
  powers: [],
});

const RECORD = {
  notes: { hypotheses: [hypothesis], strengths: ["Partners to 10: every first try correct"] },
  plan: PLAN,
  source: "coach",
  reasons: [],
  lastSessionCoached: 3,
  cited: [
    { id: "p12", skill: "make-a-ten", equation: "8 + 5 = ?", assistance: "hint-assisted-correct", sessionNumber: 2 },
    { id: "p15", skill: "make-a-ten", equation: "9 + 4 = ?", assistance: "revealed", sessionNumber: 3 },
  ],
  changed: ['Now supported: "May need more practice when a sum crosses ten", with more evidence'],
  summaries: [9, 8, 7, 6, 5, 4, 3, 2, 1].map(summary),
};

test("completing a Session runs the Coach once; with no key on the server the next Session is the Baseline's, the Notebook says so, and the Parent still gets a Summary", async ({ page, baseURL }) => {
  const coachRequests: string[] = [];
  const summaryRequests: string[] = [];
  const offHost: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) offHost.push(request.url());
    if (request.method() !== "POST") return;
    if (request.url() === `${baseURL}/api/coach`) coachRequests.push(request.postData() ?? "");
    if (request.url() === `${baseURL}/api/summary`) summaryRequests.push(request.postData() ?? "");
  });

  await setUpProfile(page);
  await page.goto("/play");

  // The Diagnostic Session, with one Problem answered after a Hint and one Revealed.
  await expect(page.getByTestId("progress-dot")).toHaveCount(9);
  for (let position = 1; position <= 9; position++) {
    const { answer } = await asked(page);
    const miss = answer === 0 ? 1 : answer - 1;
    const otherMiss = answer === 20 ? 18 : answer + 1;
    if (position === 2) await key(page, miss).click();
    if (position === 3) {
      await key(page, miss).click();
      await key(page, otherMiss).click();
      await expect(page.locator('main[data-phase="reveal"]')).toBeVisible();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      continue;
    }
    await key(page, answer).click();
  }
  await expect(page.getByTestId("celebration")).toBeVisible();

  // One Coach run: the call and the engine's one retry, and no more, however the page is left and come back to.
  await expect.poll(async () => (await readProfile(page)).coach.lastSessionCoached).toBe(1);
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
  await page.reload();
  await page.waitForTimeout(500);
  expect(coachRequests).toHaveLength(2);
  expect(summaryRequests).toHaveLength(2);
  for (const body of [...coachRequests, ...summaryRequests]) {
    expect(body).not.toContain("Mia");
    expect(body).not.toContain("theme");
  }

  const record = (await readProfile(page)).coach;
  expect(record.source).toBe("baseline");
  expect(record.notes.hypotheses).toEqual([]);
  expect(record.summaries).toHaveLength(1);
  expect(record.summaries[0].source).toBe("template");

  // The Parent Area: the Notebook says the Baseline Plan is in use, and the Summary has the evidence by Assistance State.
  await openParentArea(page);
  await expect(page.getByTestId("notebook-baseline")).toContainText("ANTHROPIC_API_KEY is not set");
  const summaryCard = page.getByTestId("parent-summary");
  await expect(summaryCard).toHaveCount(1);
  await expect(summaryCard).toHaveAttribute("data-session", "1");
  await expect(summaryCard).toContainText("9 Problems");
  await expect(summaryCard.getByTestId("summary-evidence").first()).toContainText("first try");
  await expect(summaryCard).toContainText("with a Hint");
  await expect(summaryCard).toContainText("Revealed");
  await expect(page.getByTestId("summary-activity")).toContainText("Try tonight:");
  // A Summary says what the Learner did, never what she was thinking.
  await expect(summaryCard).not.toContainText(/thinking|understands|knows/);

  // Play goes on: the next Session is the Baseline's six Problems.
  await page.goto("/play");
  await expect(page.getByTestId("progress-dot")).toHaveCount(6);
  expect(offHost).toEqual([]);
});

test("Play builds the next Session from the Coach's stored Plan, and its Problems match the Plan's mix and ranges", async ({ page }) => {
  await setUpProfile(page);
  await seedProfile(page, { progress: PROGRESS, coach: RECORD });
  await page.goto("/play");

  await expect(page.getByTestId("progress-dot")).toHaveCount(6);
  const problems = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).session.problems as { skill: string; equation: { left: number; right: number } }[],
    "ollie.profile",
  );
  expect(problems).toHaveLength(6);
  for (const problem of problems) {
    expect(problem.skill).toBe("make-a-ten");
    const larger = Math.max(problem.equation.left, problem.equation.right);
    expect(larger).toBeGreaterThanOrEqual(8);
    expect(larger).toBeLessThanOrEqual(9);
  }
});

test("the Notebook shows each Hypothesis's evidence as the actual Problems, tappable, and the last seven Summaries survive a reload newest first", async ({ page }) => {
  await setUpProfile(page);
  await seedProfile(page, { progress: PROGRESS, coach: RECORD });
  await openParentArea(page);

  // Ollie's Notebook: the belief in prose, what changed, and what is being tested next.
  const belief = page.getByTestId("belief");
  await expect(belief).toHaveCount(1);
  await expect(belief).toContainText("May need more practice when a sum crosses ten");
  await expect(belief).toHaveAttribute("data-status", "supported");
  await expect(page.getByTestId("notebook-changed")).toContainText("Now supported");
  await expect(page.getByTestId("notebook-next")).toContainText("Give 3 make-a-ten Problems");
  await expect(page.getByTestId("notebook-baseline")).toHaveCount(0);

  // The evidence is the actual Problems, with their numbers and Assistance State.
  await expect(page.getByTestId("evidence-problem")).toHaveCount(0);
  await belief.getByRole("button", { name: /Show the 2 Problems/ }).click();
  const evidence = page.getByTestId("evidence-problem");
  await expect(evidence).toHaveCount(2);
  await expect(evidence.nth(0)).toContainText("8 + 5 = ?");
  await expect(evidence.nth(0)).toContainText("right after a Hint");
  await expect(evidence.nth(1)).toContainText("9 + 4 = ?");
  await expect(evidence.nth(1)).toContainText("Revealed");

  // The last seven Parent Summaries, newest first, still there after a reload.
  const summaries = page.getByTestId("parent-summary");
  await expect(summaries).toHaveCount(7);
  await expect(summaries.nth(0)).toHaveAttribute("data-session", "9");
  await expect(summaries.nth(6)).toHaveAttribute("data-session", "3");
  await expect(summaries.nth(0).getByTestId("summary-evidence")).toContainText("4 first try · 1 with a Hint · 1 Revealed");

  await page.reload();
  await openParentArea(page);
  await expect(page.getByTestId("parent-summary")).toHaveCount(7);
  await expect(page.getByTestId("parent-summary").nth(0)).toHaveAttribute("data-session", "9");
});
