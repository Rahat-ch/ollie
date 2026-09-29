import { expect, test } from "./test";

// The proxy in front of the model routes, on the built server. The burst
// that earns a 429 is left to the unit tests: here every spec shares one
// address, so spending its bucket would hold up the specs running beside it.

test("the model routes refuse another site's page and a request with no Origin", async ({ request }) => {
  const refused: Record<string, string>[] = [{ origin: "https://evil.example" }, {}];
  for (const headers of refused) {
    const answer = await request.post("/api/coach", { headers, data: {} });
    expect(answer.status()).toBe(403);
    expect(await answer.json()).toEqual({ error: "cross-origin requests are refused" });
  }
});

test("the model routes hear the site's own Origin", async ({ request, baseURL }) => {
  // Through the proxy to the route, which refuses the empty body itself.
  const answer = await request.post("/api/coach", { headers: { origin: baseURL! }, data: {} });
  expect(answer.status()).toBe(400);
});
