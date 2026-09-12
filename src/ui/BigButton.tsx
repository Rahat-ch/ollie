import type { ComponentProps } from "react";

type Size = "xl" | "l";

/** Sun for the primary action; paper for the way back next to it. */
type Tone = "sun" | "paper";

type BigButtonProps = ComponentProps<"button"> & {
  /** The one primary action on a Learner screen is xl; everything else is l. */
  readonly size?: Size;
  readonly tone?: Tone;
};

const TONES: Readonly<Record<Tone, string>> = {
  sun: "bg-sun [--button-shadow-color:var(--sun-deep)]",
  paper: "bg-paper [--button-shadow-color:var(--paper-3)]",
};

/** The classes of a chunky paper button, for a Link that should look like one. */
export function bigButtonClasses(size: Size = "l", tone: Tone = "sun"): string {
  const dims = size === "xl" ? "h-24 min-w-70 px-10 text-display-l gap-4" : "h-16 min-w-40 px-6 text-display-s gap-3";
  return `paper-button inline-flex items-center justify-center rounded-button font-display font-semibold text-ink ${TONES[tone]} ${dims}`;
}

/** A chunky button: flat deep-tone shadow, drops when pressed. */
export function BigButton({ size = "l", tone = "sun", className = "", children, ...rest }: BigButtonProps) {
  return (
    <button type="button" className={`${bigButtonClasses(size, tone)} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
