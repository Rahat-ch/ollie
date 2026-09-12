import { expect, type Page } from "@playwright/test";

/** The Parent's four screens on a fresh device: the Nickname, the Avatar colour, the Theme, the note. */
export async function setUpProfile(page: Page, nickname = "Mia"): Promise<void> {
  await page.goto("/");
  const onboarding = page.getByTestId("onboarding");
  await expect(onboarding).toHaveAttribute("data-step", "nickname");
  await page.getByRole("textbox", { name: "Nickname" }).fill(nickname);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(onboarding).toHaveAttribute("data-step", "avatar");
  await page.getByRole("button", { name: "Sky" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(onboarding).toHaveAttribute("data-step", "theme");
  await page.getByRole("button", { name: "Space" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(onboarding).toHaveAttribute("data-step", "note");
  await page.getByRole("button", { name: "Start playing" }).click();
  await expect(page.getByRole("link", { name: "Play" })).toBeVisible();
}
