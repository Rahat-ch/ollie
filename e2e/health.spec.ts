import { expect, test } from "@playwright/test";

test("health reports a writable audio directory", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(typeof body.audioDir).toBe("string");
  expect(body.audioDirWritable).toBe(true);
});
