import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    // Bundled audio, once it exists, must not play out loud during a test run either.
    launchOptions: { args: ["--mute-audio"] },
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "ipad-landscape",
      // The iPad device defaults to WebKit; only Chromium is installed, so keep
      // the tablet viewport, touch, and user agent but run it in Chromium.
      use: { ...devices["iPad (gen 7) landscape"], browserName: "chromium" },
    },
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
