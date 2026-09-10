import { expect, test } from "@playwright/test";

test("home page shows the Ollie placeholder", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Ollie");
  await expect(page.getByRole("heading", { level: 1, name: "Ollie" })).toBeVisible();
  await expect(page.getByText("Ollie learns how you learn.")).toBeVisible();
});
