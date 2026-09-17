/**
 * The shared `test` for every browser spec: every page is quietened before it
 * loads, so no test run reads a Problem out loud or plays one of Ollie's
 * lines through the speakers. What that means, and why a launch flag was not
 * enough, is in e2e/quiet.mjs, which scripts/design-review.mjs uses too.
 */
import { test as base } from "@playwright/test";
import { quiet } from "./quiet.mjs";

export { expect, type Page } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(quiet);
    await provide(page);
  },
});
