import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { innerMarkup, MODULE_PATH, readPoseSources, renderModule } from "../../scripts/ollie-poses.mjs";
import { POSES } from "./poses.generated";

describe("poses.generated.ts", () => {
  it("is what scripts/ollie-poses.mjs renders from public/ollie/, so the SVGs stay the source of truth", () => {
    expect(readFileSync(MODULE_PATH, "utf8")).toBe(renderModule(readPoseSources()));
  });

  it("has the four base states and the four Power poses", () => {
    expect(Object.keys(POSES).sort()).toEqual([
      "celebrate",
      "count-on-flight",
      "encourage",
      "idle",
      "make-ten-magic",
      "missing-number-detective",
      "story-solver",
      "talking",
    ]);
  });

  it("names every part with data-part and no id, so two Ollies on one page never clash", () => {
    for (const markup of Object.values(POSES)) {
      expect(markup).not.toMatch(/\bid=/);
      for (const part of ["body", "wing-left", "wing-right", "eye-left", "eye-right", "beak"]) {
        expect(markup).toContain(`data-part="${part}"`);
      }
    }
  });
});

describe("innerMarkup", () => {
  it("keeps only what is inside the svg element", () => {
    expect(innerMarkup('<svg xmlns="x" viewBox="0 0 240 240">\n<g id="a"><path d="M0 0"/></g>\n</svg>\n')).toBe(
      '<g data-part="a"><path d="M0 0"/></g>',
    );
  });
});
