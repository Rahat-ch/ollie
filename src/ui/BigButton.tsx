import type { ComponentProps } from "react";

type Size = "xl" | "l";

type BigButtonProps = ComponentProps<"button"> & {
  /** The one primary action on a Learner screen is xl; everything else is l. */
  readonly size?: Size;
};

/** The classes of a chunky sun button, for a Link that should look like one. */
export function bigButtonClasses(size: Size = "l"): string {
  const dims = size === "xl" ? "h-24 min-w-70 px-10 text-display-l gap-4" : "h-16 min-w-40 px-6 text-display-s gap-3";
  return `paper-button inline-flex items-center justify-center rounded-button bg-sun font-display font-semibold text-ink [--button-shadow-color:var(--sun-deep)] ${dims}`;
}

/** A chunky sun button: flat deep-tone shadow, drops when pressed. */
export function BigButton({ size = "l", className = "", children, ...rest }: BigButtonProps) {
  return (
    <button type="button" className={`${bigButtonClasses(size)} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
