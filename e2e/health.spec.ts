import { expect, test } from "./test";

test("health reports a writable audio directory", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.ok).toBe(true); // ok mirrors audioDirWritable; 503 when false
  expect(typeof body.audioDir).toBe("string");
  expect(body.audioDirWritable).toBe(true);
});
