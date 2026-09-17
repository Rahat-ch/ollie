import { defineConfig, devices } from "@playwright/test";
import { IPADS } from "./e2e/ipads.mjs";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Bundled audio must not play out loud during a test run. `--mute-audio` is a
// Chromium launch flag, so it covers the two Chromium projects and nothing
// else; what actually keeps every project silent, WebKit included, is the
// init script in e2e/quiet.mjs, which mutes each media element as it plays
// and stubs the platform's speech synthesis.
const MUTED = { launchOptions: { args: ["--mute-audio"] } };

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
    // One real iPad each, as Safari presents it. The descriptor's own
    // defaultBrowserType is webkit, so `browserName` is deliberately left
    // alone — running Safari's engine is the point of these projects.
    ...IPADS.map(({ name, width, height }) => ({
      name,
      use: { ...devices["iPad (gen 7) landscape"], viewport: { width, height } },
    })),
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
