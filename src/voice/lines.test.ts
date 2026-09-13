import { describe, expect, it } from "vitest";
import { baselinePlan, DIAGNOSTIC_PLAN, hintFor, newProfile, SKILLS, startSession } from "@/loop";
import { profileWithMastered } from "@/loop/testing";
import { POWERS } from "@/loop";
import { cheerFor, powerLine, revealLine, SESSION_DONE } from "@/play/lines";
import { NICKNAME_PLACEHOLDER } from "@/story/nickname";
import { audioKey } from "./key";
import { fixedLines, ollieLines, PAD_ANSWERS, problemLines } from "./lines";

const texts = (lines: readonly { readonly text: string }[]) => new Set(lines.map((line) => line.text));

describe("ollieLines", () => {
  const said = texts(ollieLines());

  it("has every hand-written Hint, so the help after a first wrong answer is always in Ollie's voice", () => {
    for (const skill of SKILLS) {
      for (const structure of skill.structures) expect(said).toContain(hintFor({ skill: skill.id, structure }));
    }
  });

  it("has a cheer for every place in a Session and every answer on the pad, and the Reveal line for each", () => {
    for (const answer of PAD_ANSWERS) {
      expect(said).toContain(revealLine(answer));
      for (let position = 1; position <= 4; position++) expect(said).toContain(cheerFor(position, answer));
    }
  });

  it("has the end of a Session, and nothing that is only read: the Mastered line is on a card, not on Ollie's beak", () => {
    expect(said).toContain(SESSION_DONE);
    for (const skill of SKILLS) expect([...said].some((line) => line.includes(skill.name))).toBe(false);
  });

  it("has the line Ollie says on learning each of the four Powers, so the headline celebration is in Ollie's voice", () => {
    expect(said).toContain("You taught me Count-On Flight!");
    for (const power of POWERS) expect(said).toContain(powerLine(power.name));
  });

  it("is 14 Hints (Make-a-ten's two structures share one), 21 Reveal lines, 84 cheers, four Powers, and the end of a Session", () => {
    expect(ollieLines()).toHaveLength(14 + 21 + 84 + 4 + 1);
  });

  it("has no Nickname in it, because a fixed line is rendered once for every Learner", () => {
    for (const line of ollieLines()) expect(line.text).not.toContain(NICKNAME_PLACEHOLDER);
  });
});

describe("problemLines", () => {
  it("has the spoken line of every Problem a Session puts to the Learner", () => {
    const said = texts(problemLines("standard"));
    const mastered = profileWithMastered("partners-to-10", "teen-numbers", "counting-on", "make-a-ten", "unknown-addend");
    const started = { ...mastered, sessionsCompleted: 1 };
    for (const [plan, profile] of [
      [DIAGNOSTIC_PLAN, newProfile()],
      [baselinePlan({ ...newProfile(), sessionsCompleted: 1 }), { ...newProfile(), sessionsCompleted: 1 }],
      [baselinePlan(started), started],
    ] as const) {
      for (let seed = 0; seed < 40; seed++) {
        for (const problem of startSession(plan, profile, `voice-${seed}`).problems) expect(said).toContain(problem.spoken);
      }
    }
  });

  it("covers the default ranges within the standard ones, so a narrower run of the render script is a subset", () => {
    const standard = texts(problemLines("standard"));
    for (const line of problemLines("default")) expect(standard).toContain(line.text);
  });
});

describe("fixedLines", () => {
  const lines = fixedLines("standard");

  it("is Ollie's 124 lines and the 1,166 Problem lines of the standard ranges, each said once", () => {
    expect(texts(lines).size).toBe(lines.length);
    expect(lines.filter((l) => l.kind === "ollie")).toHaveLength(124);
    expect(lines.filter((l) => l.kind === "problem")).toHaveLength(1166);
    expect(fixedLines("default").filter((l) => l.kind === "problem")).toHaveLength(671);
  });

  it("gives every line its own audio key, so no line is bundled with another line's audio", () => {
    expect(new Set(lines.map((line) => audioKey(line.text))).size).toBe(lines.length);
  });
});
