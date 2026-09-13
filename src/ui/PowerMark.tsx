import type { PowerId } from "@/loop";

/**
 * A Power's mark: one flat plum shape each, cut from the same parts as
 * Ollie's pose for it (the wing beat, the ten-frame chip, the magnifying
 * glass, the open book). Placeholder shapes until the illustration pass.
 */
const MARKS: Readonly<Record<PowerId, React.ReactNode>> = {
  "count-on-flight": (
    <>
      <path d="M5 17C7 9 13 5 19 5C17 9 16 12 16 17Z" className="fill-paper" />
      <path d="M19 17C20 12 22 9 25 7C26 12 25 15 23 17Z" className="fill-paper" />
    </>
  ),
  "make-ten-magic": (
    <>
      <rect x="5" y="9" width="22" height="14" rx="3" className="fill-paper" />
      <rect x="5" y="9" width="11" height="14" rx="3" className="fill-sun" />
      <circle cx="10.5" cy="16" r="3" className="fill-plum" />
    </>
  ),
  "missing-number-detective": (
    <>
      <path d="M18 18L25 25C26 26.5 24 28.5 22.5 27L16 20Z" className="fill-paper" />
      <circle cx="13" cy="13" r="8" className="fill-paper" />
      <circle cx="13" cy="13" r="5" className="fill-plum" />
    </>
  ),
  "story-solver": (
    <>
      <path d="M4 8C8 6 13 6 16 9V26C13 23 8 23 4 25Z" className="fill-paper" />
      <path d="M28 8C24 6 19 6 16 9V26C19 23 24 23 28 25Z" className="fill-paper" />
      <path d="M16 9V26" className="stroke-plum" strokeWidth="2" />
    </>
  ),
};

/** The Power's mark on a plum disc: the same mark on the Path and in the Parent Area. */
export function PowerMark({ power, size = 40 }: { readonly power: PowerId; readonly size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" data-power={power}>
      <circle cx="16" cy="16" r="16" className="fill-plum" />
      {MARKS[power]}
    </svg>
  );
}
