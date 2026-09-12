import { INK_STROKE } from "./icons";

/** Hear the line again. On every Problem; the audio arrives with ticket 11. */
export function RepeatButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className="paper-button flex size-touch-learner items-center justify-center rounded-pill bg-paper-2 [--button-shadow-color:var(--paper-3)]"
      onClick={onClick}
      aria-label="Repeat"
    >
      <svg viewBox="0 0 24 24" width="32" height="32" {...INK_STROKE} aria-hidden="true">
        <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
        <path d="M4 3.5V8h4.5" />
      </svg>
    </button>
  );
}
