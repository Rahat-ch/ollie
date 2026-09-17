import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Bundled audio, once it exists, must not play out loud during a test run
// either. The flag is Chromium's own and WebKit does not take it, so it is
// set on the Chromium projects rather than on `use`. In WebKit the speech
// stub in e2e/test.ts is what keeps a run quiet, and the stub is what
// matters: the Speech Chain's loudest step is the platform's own speech
// synthesis, which no launch flag mutes.
const MUTED = { launchOptions: { args: ["--mute-audio"] } };

/**
 * One real iPad, as Safari presents it: the CSS viewports in
 * docs/research/ipad-layout.md §2, each way up. The descriptor's own
 * defaultBrowserType is webkit, so `browserName` is deliberately left alone
 * — running Safari's engine is the point of these projects.
 */
const iPad = (name: string, width: number, height: number) => ({
  name,
  use: { ...devices["iPad (gen 7) landscape"], viewport: { width, height } },
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], ...MUTED },
    },
    {
      name: "ipad-landscape",
      // The Chromium reference: the tablet viewport, touch, and user agent of
      // the WebKit projects below, in the engine the suite has always run in.
      use: { ...devices["iPad (gen 7) landscape"], browserName: "chromium", ...MUTED },
    },
    iPad("ipad-102-landscape", 1080, 810),
    iPad("ipad-102-portrait", 810, 1080),
    iPad("ipad-11-landscape", 1180, 820),
    iPad("ipad-11-portrait", 820, 1180),
    iPad("ipad-13-landscape", 1366, 1024),
    iPad("ipad-13-portrait", 1024, 1366),
    iPad("ipad-mini-landscape", 1133, 744),
    iPad("ipad-mini-portrait", 744, 1133),
    // The current base iPad as Playwright's own registry measures it
    // (`iPad (gen 11) landscape`, 944×656 at a scale factor of 2.5). Apple's
    // native resolution halved says 1180×820 instead; the research flags the
    // disagreement as unverified, so the layout is held to both.
    iPad("ipad-base-landscape", 944, 656),
  ],
  webServer: {
    // Run the standalone server the Dockerfile runs, not `next start`, so the
    // browser tests exercise the same artefact that ships. Standalone output
    // does not include client assets, so copy them in first (as the Dockerfile
    // does with COPY), and public/ alongside.
    command: [
      "pnpm build",
      "rm -rf .next/standalone/.next/static .next/standalone/public",
      "cp -R .next/static .next/standalone/.next/static",
      "cp -R public .next/standalone/public",
      `PORT=${PORT} node .next/standalone/server.js`,
    ].join(" && "),
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
