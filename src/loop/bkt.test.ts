import { describe, expect, it } from "vitest";
import { bktUpdate } from "@/loop/bkt";

// Worked by hand: prior 0.3, learn 0.2, guess 0.2, slip 0.1.
// Correct:  P(known|correct) = 0.3*0.9 / (0.3*0.9 + 0.7*0.2) = 0.27 / 0.41 = 0.6585
//           then learn:       0.6585 + 0.3415*0.2            = 0.7268
// Wrong:    P(known|wrong)   = 0.3*0.1 / (0.3*0.1 + 0.7*0.8) = 0.03 / 0.59 = 0.0508
//           then learn:       0.0508 + 0.9492*0.2            = 0.2407
const params = { prior: 0.3, learn: 0.2, guess: 0.2, slip: 0.1 };

describe("bktUpdate", () => {
  it("raises the estimate on a correct first attempt", () => {
    expect(bktUpdate(0.3, true, params)).toBeCloseTo(0.7268, 4);
  });

  it("lowers the estimate on a wrong first attempt, but learning keeps it above zero", () => {
    expect(bktUpdate(0.3, false, params)).toBeCloseTo(0.2407, 4);
  });
});
