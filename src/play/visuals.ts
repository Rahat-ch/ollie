/**
 * What the ten-frame or number line shows for a Problem at each stage of
 * play: as asked, animated for the Hint, and at the Reveal. Pure data; the
 * components draw it and the CSS animates the marks. The engine's numbers
 * are read, never changed (ADR 0001).
 */
import type { Problem } from "@/loop";

export type Stage = "asking" | "hint" | "reveal";

export type CounterColor = "red" | "yellow";

/**
 * A mark says what the Hint animation does to a cell or counter: `count`
 * pulses it in sequence so the Learner can count along, `arrive` brings a
 * counter in, `gone` shows where a counter was taken away.
 */
export type Mark = "count" | "arrive" | "gone" | null;

export type Cell = { readonly counter: CounterColor | null; readonly mark: Mark };

/** A yellow counter waiting beside the frame. */
export type LooseCounter = { readonly mark: Mark };

export type TenFrameModel = {
  readonly kind: "ten-frame";
  /** One or two frames of ten cells each, read left to right, top row first. */
  readonly frames: readonly (readonly Cell[])[];
  /** Counters waiting beside the frame (make-a-ten's second addend). */
  readonly loose: readonly LooseCounter[];
};

export type NumberLineModel = {
  readonly kind: "number-line";
  readonly min: 0;
  readonly max: 20;
  /** Where the Learner starts counting from. */
  readonly start: number;
  /** Where the hops land. */
  readonly end: number;
  readonly hops: number;
  readonly showEnd: boolean;
  readonly showHops: boolean;
};

/** Unit 3's word problems show the Profile's Theme picture; the screen knows the Theme, the model does not. */
export type ThemePictureModel = { readonly kind: "theme-picture" };

export type VisualModel = TenFrameModel | NumberLineModel | ThemePictureModel;

const FRAME_SIZE = 10;

const cell = (counter: CounterColor | null, mark: Mark = null): Cell => ({ counter, mark });

/** A frame with `filled` counters of `color` from the first cell, the rest empty. */
function frame(filled: number, color: CounterColor, filledMark: Mark = null, emptyMark: Mark = null): Cell[] {
  return Array.from({ length: FRAME_SIZE }, (_, i) =>
    i < filled ? cell(color, filledMark) : cell(null, emptyMark),
  );
}

const loose = (count: number, mark: Mark = null): LooseCounter[] => Array.from({ length: count }, () => ({ mark }));

/** `given` red counters, then yellow ones arriving in the rest of the frame. */
const filledFrom = (given: number): Cell[] =>
  frame(given, "red").map((c, i) => (i < given ? c : cell("yellow", "arrive")));

function partnersTo10(problem: Problem, stage: Stage): TenFrameModel {
  const { equation } = problem;
  if (problem.structure === "take-from-ten") {
    // 10 - a: a full frame; the Hint takes `a` away and counts what is left.
    const left = equation.result;
    const frames =
      stage === "asking"
        ? [frame(10, "red")]
        : stage === "hint"
          ? [frame(left, "red", "count", "gone")]
          : [frame(left, "red", "count")];
    return { kind: "ten-frame", frames, loose: [] };
  }
  // a + ? = 10: `a` counters; the empty spaces are the partner.
  const given = equation.left;
  if (stage === "reveal") return { kind: "ten-frame", frames: [filledFrom(given)], loose: [] };
  return { kind: "ten-frame", frames: [frame(given, "red", null, stage === "hint" ? "count" : null)], loose: [] };
}

function teenNumbers(problem: Problem, stage: Stage): TenFrameModel {
  // 10 + n: one whole frame of ten and `n` extras in a second frame.
  const ones = problem.equation.right;
  const mark: Mark = stage === "asking" ? null : "count";
  return { kind: "ten-frame", frames: [frame(10, "red"), frame(ones, "yellow", mark)], loose: [] };
}

function makeATen(problem: Problem, stage: Stage): TenFrameModel {
  // larger + smaller: the larger addend in the frame, the smaller waiting;
  // the Hint moves just enough in to fill the frame and counts the rest.
  const { left, right } = problem.equation;
  const larger = Math.max(left, right);
  const smaller = Math.min(left, right);
  if (stage === "asking") {
    return { kind: "ten-frame", frames: [frame(larger, "red")], loose: loose(smaller) };
  }
  const movedIn = FRAME_SIZE - larger;
  return { kind: "ten-frame", frames: [filledFrom(larger)], loose: loose(smaller - movedIn, "count") };
}

function countingOn(problem: Problem, stage: Stage): NumberLineModel {
  // Start at the bigger addend whichever comes first; the landing is the answer.
  const { left, right, result } = problem.equation;
  const start = Math.max(left, right);
  return {
    kind: "number-line",
    min: 0,
    max: 20,
    start,
    end: result,
    hops: result - start,
    showEnd: stage === "reveal",
    showHops: stage !== "asking",
  };
}

function unknownAddend(problem: Problem, stage: Stage): NumberLineModel {
  // Both numbers are known from the start; the hops between them are the answer.
  const { equation } = problem;
  const whole = equation.op === "-" ? equation.left : equation.result;
  const known = equation.op === "-" ? equation.right : equation.left;
  return {
    kind: "number-line",
    min: 0,
    max: 20,
    start: known,
    end: whole,
    hops: whole - known,
    showEnd: true,
    showHops: stage !== "asking",
  };
}

export function visualFor(problem: Problem, stage: Stage): VisualModel {
  switch (problem.skill) {
    case "partners-to-10":
      return partnersTo10(problem, stage);
    case "teen-numbers":
      return teenNumbers(problem, stage);
    case "make-a-ten":
      return makeATen(problem, stage);
    case "counting-on":
      return countingOn(problem, stage);
    case "unknown-addend":
      return unknownAddend(problem, stage);
    case "result-unknown":
    case "change-unknown":
      return { kind: "theme-picture" };
    default:
      throw new Error(`No visual model for ${String(problem.skill satisfies never)}`);
  }
}
