/**
 * The Parent Gate: a press held continuously for about three seconds opens
 * the Parent Area. A tap, or any number of taps, never does. Plain data
 * and a pure reducer; the screen forwards pointer events and one timer.
 */
export const PARENT_GATE_HOLD_MS = 3000;

export type GateState = {
  /** When the current press began, in ms; null between presses. */
  readonly heldSince: number | null;
  readonly open: boolean;
};

export type GateEvent =
  | { readonly type: "press"; readonly at: number }
  | { readonly type: "release"; readonly at: number }
  /** The hold timer fired; opens only if the same press is still held. */
  | { readonly type: "elapsed"; readonly at: number };

export const CLOSED: GateState = { heldSince: null, open: false };

export function gateReducer(state: GateState, event: GateEvent): GateState {
  if (state.open) return state;
  if (event.type === "press") return { heldSince: event.at, open: false };
  if (event.type === "release") return CLOSED;
  const held = state.heldSince !== null && event.at - state.heldSince >= PARENT_GATE_HOLD_MS;
  return held ? { heldSince: state.heldSince, open: true } : state;
}
