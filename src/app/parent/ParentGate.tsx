"use client";

import { useEffect, useReducer } from "react";
import { CLOSED, gateReducer, PARENT_GATE_HOLD_MS } from "@/parent/gate";
import { LockIcon } from "@/ui/LockIcon";
import { PillLink } from "@/ui/PillLink";

const RING_RADIUS = 58;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Press and hold for about three seconds. The reducer decides; this screen
 * forwards the press, its release, and one timer, and draws the ring
 * filling for as long as the press lasts. There is no click handler, so a
 * tap does nothing.
 */
export function ParentGate({ onOpen }: { readonly onOpen: () => void }) {
  const [state, dispatch] = useReducer(gateReducer, CLOSED);
  const { heldSince, open } = state;

  useEffect(() => {
    if (heldSince === null || open) return;
    const timer = setTimeout(() => dispatch({ type: "elapsed", at: Date.now() }), PARENT_GATE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [heldSince, open]);

  useEffect(() => {
    if (open) onOpen();
  }, [open, onOpen]);

  const press = () => dispatch({ type: "press", at: Date.now() });
  const release = () => dispatch({ type: "release", at: Date.now() });
  const holding = heldSince !== null;

  return (
    <main className="learner-stage flex flex-col items-center justify-center gap-6 px-gutter" data-testid="parent-gate">
      <h1 className="font-display text-display-m font-semibold text-teal">For grown-ups</h1>
      <p className="max-w-120 text-center font-text text-body-l text-ink text-pretty">
        Press and hold the lock for three seconds to open the Parent Area.
      </p>
      <button
        type="button"
        className="gate-button relative flex size-32 items-center justify-center rounded-pill bg-paper-2 shadow-card"
        style={{ "--gate-hold": `${PARENT_GATE_HOLD_MS}ms` } as React.CSSProperties}
        data-holding={holding}
        aria-label="Hold to open the Parent Area"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(event) => {
          if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          press();
        }}
        onKeyUp={release}
        onBlur={release}
        onContextMenu={(event) => event.preventDefault()}
      >
        <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={RING_RADIUS} className="fill-none stroke-paper-3" strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r={RING_RADIUS}
            className="gate-ring fill-none stroke-teal"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
          />
        </svg>
        <LockIcon size={56} />
      </button>
      <PillLink href="/" tone="sky">
        Back to Ollie
      </PillLink>
    </main>
  );
}
