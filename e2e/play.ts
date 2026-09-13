import { expect, type Page } from "@playwright/test";

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
