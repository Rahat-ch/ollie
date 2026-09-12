import Link from "next/link";
import type { ComponentProps } from "react";

/** Sky for the way between the Learner's and the Parent's screens; paper for a control the Learner should pass over. */
type Tone = "sky" | "paper";

const TONES: Readonly<Record<Tone, string>> = {
  sky: "bg-sky font-display text-body font-medium text-ink [--button-shadow-color:var(--sky-deep)]",
  paper: "bg-paper-2 font-text text-caption text-ink-soft [--button-shadow-color:var(--paper-3)]",
};

type PillLinkProps = ComponentProps<typeof Link> & { readonly tone: Tone };

/**
 * A 44px paper pill for the links that belong to the Parent: the Grown-ups
 * control on the home screen and the way back to Ollie from the Parent's
 * screens. A Parent target on purpose; the Learner's targets are 64px.
 */
export function PillLink({ tone, className = "", children, ...rest }: PillLinkProps) {
  return (
    <Link className={`paper-button flex h-touch-parent items-center gap-2 rounded-pill px-5 ${TONES[tone]} ${className}`.trim()} {...rest}>
      {children}
    </Link>
  );
}
