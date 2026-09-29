import { describe, expect, it } from "vitest";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { emptyLabelFile, withLabel, type ClaimLabel } from "./labels";
import { labelState, respondLabel, type LabelState } from "./label-server";
import { claimItems, finalRun, storyItems, summaryItems } from "./sealed";

const everything = finalRun("the labelling page's own tests");

const fresh = (labeller = "second"): LabelState =>
  labelState({
    labeller,
    items: { stories: storyItems(everything), summaries: summaryItems(everything), claims: claimItems(everything) },
    files: { stories: emptyLabelFile("stories", labeller), summaries: emptyLabelFile("summaries", labeller), claims: emptyLabelFile("claims", labeller) },
  });

const get = (state: LabelState, path: string) => respondLabel(state, { method: "GET", path });
const post = (state: LabelState, body: unknown) => respondLabel(state, { method: "POST", path: "/label", body: JSON.stringify(body) });
const itemsOf = (state: LabelState) => JSON.parse(get(state, "/items").body ?? "{}");

const claimLabel = (id: string): ClaimLabel => ({
  id,
  polarity: "contrast",
  namesAsDifficulty: { "crossing-ten": true, "change-unknown": false },
  citedSupport: "cannot-tell",
});

describe("the labelling page's server", () => {
  it("serves the page", () => {
    const page = get(fresh(), "/");
    expect(page.status).toBe(200);
    expect(page.type).toContain("text/html");
    expect(page.body).toContain("<title>");
  });

  it("sends every item of every set with the evidence a labeller needs", () => {
    const { labeller, sets } = itemsOf(fresh());
    expect(labeller).toBe("second");
    expect(sets.stories.items).toHaveLength(20);
    expect(sets.summaries.items).toHaveLength(10);
    expect(sets.claims.items).toHaveLength(100);
    const story = sets.stories.items.find((s: { id: string }) => s.id === "c01");
    expect(story).toMatchObject({ theme: "puppies", equation: "7 + 5 = ?", answer: 12 });
    expect(story.text).toContain("[Nickname]");
    expect(story.text).not.toContain(NICKNAME_PLACEHOLDER);
    const summary = sets.summaries.items.find((s: { id: string }) => s.id === "s01");
    expect(summary.tally[0]).toMatchObject({ skill: expect.any(String), parts: expect.arrayContaining(["1 Revealed"]) });
    expect(summary.practiced).toContain("make-a-ten");
    const claim = sets.claims.items[0];
    expect(claim).toMatchObject({ id: expect.stringMatching(/^k\d{3}$/), claim: expect.any(String), status: expect.any(String) });
    expect(claim.evidence.length).toBeGreaterThan(0);
  });

  it("hides every existing label and note, and where a claim came from", () => {
    const body = get(fresh(), "/items").body ?? "";
    expect(body).not.toMatch(/"pass"|"note"|"polarity"/);
    // The owner's note on c13, which gives its verdict away.
    expect(body).not.toContain("the action contradicts the arithmetic");
    // The Learner's id names the weakness planted in it; the report and Session say which run.
    expect(body).not.toMatch(/"learner"|"report"|crossing-ten-weakness/);
  });

  it("orders each set at random for each labeller, so the order says nothing about the verdicts", () => {
    const order = (labeller: string) => itemsOf(fresh(labeller)).sets.stories.items.map((s: { id: string }) => s.id);
    expect(order("second")).toEqual(order("second"));
    expect(order("second")).not.toEqual(order("third"));
    expect(order("second")).not.toEqual([...order("second")].sort());
  });

  it("returns only this labeller's own labels, so a labeller can pick up where they left off", () => {
    const state = fresh();
    state.files.stories = withLabel(state.files.stories, { id: "c02", pass: false, note: "mine" });
    expect(itemsOf(state).sets.stories.labels).toEqual({ c02: { id: "c02", pass: false, note: "mine" } });
  });

  it("saves a label, answers with it, and hands the whole file back to be written", () => {
    const state = fresh();
    const answer = post(state, { set: "claims", label: claimLabel("k007") });
    expect(answer.status).toBe(200);
    expect(answer.save).toEqual({ set: "claims", labeller: "second", labels: [claimLabel("k007")] });
    expect(itemsOf(state).sets.claims.labels.k007).toEqual(claimLabel("k007"));
    const again = post(state, { set: "stories", label: { id: "c05", pass: true } });
    expect(again.save).toEqual(withLabel(emptyLabelFile("stories", "second"), { id: "c05", pass: true }));
  });

  it("refuses a label for an item not in the set, or one that does not fit the set's questions", () => {
    const state = fresh();
    expect(post(state, { set: "stories", label: { id: "c99", pass: true } }).status).toBe(400);
    expect(post(state, { set: "claims", label: { id: "k001", pass: true } }).status).toBe(400);
    expect(post(state, { set: "widgets", label: { id: "k001" } }).status).toBe(400);
    expect(respondLabel(state, { method: "POST", path: "/label", body: "not json" }).status).toBe(400);
    expect(state.files.claims.labels).toEqual([]);
  });

  it("answers 404 to anything else", () => {
    expect(get(fresh(), "/nothing").status).toBe(404);
  });
});
