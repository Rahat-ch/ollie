/**
 * The shared `test` for every browser spec. A test run must never talk out
 * loud through the machine's own voice: Chromium on a Mac speaks through the
 * system's speech synthesis, so thirty tests reading Problems aloud fill the
 * room. Every page stubs `speechSynthesis.speak` to fail at once, which hands
 * the Speech Chain over to the on-screen step, the same path a device with
 * no voices takes.
 */
import { test as base } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.speak = (utterance: SpeechSynthesisUtterance) => {
        setTimeout(() => utterance.dispatchEvent(new Event("error")), 0);
      };
    });
    await provide(page);
  },
});
