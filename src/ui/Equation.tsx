import type { Equation as EquationData } from "@/loop";

const OP = { "+": "+", "-": "−" } as const;

type EquationProps = {
  readonly equation: EquationData;
  /** After the answer: the unknown is filled in, in leaf. */
  readonly answerShown: boolean;
};

/** `8 + 5 = ?` in display-xl, the unknown slot blank until it is answered. */
export function Equation({ equation, answerShown }: EquationProps) {
  const slot = (name: EquationData["unknown"], value: number) =>
    equation.unknown !== name ? (
      <span>{value}</span>
    ) : answerShown ? (
      <span className="text-leaf-deep" data-testid="answer">
        {value}
      </span>
    ) : (
      <span data-testid="unknown">?</span>
    );
  return (
    <p className="flex justify-center gap-4 font-display text-display-xl font-semibold text-ink" data-testid="equation" aria-label={ariaLabel(equation, answerShown)}>
      {slot("left", equation.left)}
      <span>{OP[equation.op]}</span>
      {slot("right", equation.right)}
      <span>=</span>
      {slot("result", equation.result)}
    </p>
  );
}

function ariaLabel(equation: EquationData, answerShown: boolean): string {
  const show = (name: EquationData["unknown"], value: number) =>
    equation.unknown === name && !answerShown ? "what" : String(value);
  const op = equation.op === "+" ? "plus" : "take away";
  return `${show("left", equation.left)} ${op} ${show("right", equation.right)} equals ${show("result", equation.result)}`;
}
