import { describe, expect, it } from "vitest";
import { CLOSED, gateReducer, PARENT_GATE_HOLD_MS } from "./gate";

describe("the Parent Gate", () => {
  it("does not open on a tap: a press released well before the hold is up", () => {
    const pressed = gateReducer(CLOSED, { type: "press", at: 1000 });
    const released = gateReducer(pressed, { type: "release", at: 1250 });
    expect(released).toEqual(CLOSED);
  });

  it("opens once the press has been held continuously for the hold time", () => {
    const pressed = gateReducer(CLOSED, { type: "press", at: 1000 });
    expect(gateReducer(pressed, { type: "elapsed", at: 1000 + PARENT_GATE_HOLD_MS - 1 }).open).toBe(false);
    expect(gateReducer(pressed, { type: "elapsed", at: 1000 + PARENT_GATE_HOLD_MS }).open).toBe(true);
  });

  it("does not open from a timer that fires after the press was let go", () => {
    const pressed = gateReducer(CLOSED, { type: "press", at: 1000 });
    const released = gateReducer(pressed, { type: "release", at: 2000 });
    expect(gateReducer(released, { type: "elapsed", at: 1000 + PARENT_GATE_HOLD_MS }).open).toBe(false);
  });

  it("does not add up repeated short presses", () => {
    let state = CLOSED;
    for (let i = 0; i < 10; i++) {
      state = gateReducer(state, { type: "press", at: i * 1000 });
      state = gateReducer(state, { type: "release", at: i * 1000 + 900 });
    }
    expect(state.open).toBe(false);
  });

  it("stays open once opened, whatever happens to the press afterwards", () => {
    const pressed = gateReducer(CLOSED, { type: "press", at: 0 });
    const open = gateReducer(pressed, { type: "elapsed", at: PARENT_GATE_HOLD_MS });
    expect(gateReducer(open, { type: "release", at: PARENT_GATE_HOLD_MS + 10 }).open).toBe(true);
  });

  it("holds for about three seconds", () => {
    expect(PARENT_GATE_HOLD_MS).toBe(3000);
  });
});
