import { expect, test } from "@playwright/test";
import { setUpProfile } from "./onboarding";

test("home page shows Ollie, the Avatar, the Path, and one Play button once the Profile is set up", async ({ page }) => {
  await setUpProfile(page, "Sam");

  await expect(page).toHaveTitle("Ollie");
  await expect(page.getByRole("heading", { level: 1, name: "Ollie" })).toBeAttached();
  await expect(page.getByText("Hi, Sam! Ready to play?")).toBeVisible();
  await expect(page.getByRole("img", { name: /^Ollie, / })).toBeVisible();
  await expect(page.getByRole("img", { name: "Your Avatar" })).toBeVisible();
  await expect(page.getByTestId("path-stop")).toHaveText([/Partners to 10/, /Counting on and make-a-ten/, /Word problems/]);
  await expect(page.getByRole("link", { name: "Play" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Grown-ups" })).toBeVisible();
});

test("home page exposes the icon and social image", async ({ page, request }) => {
  await page.goto("/");

  // Icons come from the src/app/icon.svg, favicon.ico, and apple-icon.png
  // file conventions; Next.js writes the <link> tags itself.
  const iconHrefs = await page
    .locator('head link[rel="icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(iconHrefs.some((href) => href.startsWith("/favicon.ico"))).toBe(true);
  expect(iconHrefs.some((href) => href.startsWith("/icon.svg"))).toBe(true);
  await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveCount(1);

  // The social image comes from src/app/opengraph-image.png plus metadataBase.
  const ogImage = page.locator('head meta[property="og:image"]');
  await expect(ogImage).toHaveCount(1);
  const ogImageUrl = (await ogImage.getAttribute("content")) ?? "";
  expect(ogImageUrl.startsWith("https://ollie.rahatcodes.com/")).toBe(true);
  await expect(page.locator('head meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(page.locator('head meta[property="og:image:height"]')).toHaveAttribute(
    "content",
    "630",
  );
  // Exact match: the alt comes from opengraph-image.alt.txt verbatim, so a
  // trailing newline in that file would leak into the attribute.
  await expect(page.locator('head meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    "Ollie the owl next to the words: Ollie learns how you learn. A Grade 1 math game.",
  );
  await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  // metadataBase points at production; the same path must resolve on the
  // server under test.
  const { pathname, search } = new URL(ogImageUrl);
  const response = await request.get(`${pathname}${search}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});
