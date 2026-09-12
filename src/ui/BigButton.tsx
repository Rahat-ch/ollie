import type { ComponentProps } from "react";

type Hue = "sun" | "sky" | "cream";

const HUE: Readonly<Record<Hue, string>> = {
  sun: "bg-sun [--button-shadow-color:var(--sun-deep)]",
  sky: "bg-sky [--button-shadow-color:var(--sky-deep)]",
  cream: "bg-cream [--button-shadow-color:var(--paper-3)]",
};

type BigButtonProps = ComponentProps<"button"> & {
  readonly hue?: Hue;
  /** The one primary action on a Learner screen is xl; everything else is l. */
  readonly size?: "xl" | "l";
};

/** The classes of a chunky paper button, for a Link that should look like one. */
export function bigButtonClasses(hue: Hue = "sun", size: "xl" | "l" = "l"): string {
  const dims = size === "xl" ? "h-24 min-w-70 px-10 text-display-l gap-4" : "h-16 min-w-40 px-6 text-display-s gap-3";
  return `paper-button inline-flex items-center justify-center rounded-button font-display font-semibold text-ink ${HUE[hue]} ${dims}`;
}

/** A chunky paper button: flat deep-tone shadow, drops when pressed. */
export function BigButton({ hue = "sun", size = "l", className = "", children, ...rest }: BigButtonProps) {
  return (
    <button type="button" className={`${bigButtonClasses(hue, size)} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
