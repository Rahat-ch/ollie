import type { PowerId } from "@/loop";

/**
 * A Power's mark: one flat paper shape cut out of a plum disc, from the same
 * parts as Ollie's pose for it — the wing beats over the hops, the ten-frame
 * filled to ten, the magnifying glass, the open book. Nothing but paper on
 * plum, so the mark still reads at 32px on the Path.
 */
const MARKS: Readonly<Record<PowerId, React.ReactNode>> = {
  /* Three hops along the number line, one wing beat over each. */
  "count-on-flight": (
    <>
      <path d="M3 22A4.5 4.5 0 0 1 12 22L9.8 22A2.3 2.3 0 0 0 5.2 22Z" className="fill-paper" />
      <path d="M11.5 22A4.5 4.5 0 0 1 20.5 22L18.3 22A2.3 2.3 0 0 0 13.7 22Z" className="fill-paper" />
      <path d="M20 22A4.5 4.5 0 0 1 29 22L26.8 22A2.3 2.3 0 0 0 22.2 22Z" className="fill-paper" />
      <rect x="3" y="22" width="26" height="2.2" rx="1.1" className="fill-paper" />
    </>
  ),
  /* A ten-frame filled to ten: the board in paper, the lines cut back to plum. */
  "make-ten-magic": (
    <>
      <rect x="4" y="10" width="24" height="12" rx="2.5" className="fill-paper" />
      <path d="M8.8 10H10.4V22H8.8ZM13.6 10H15.2V22H13.6ZM18.4 10H20V22H18.4ZM23.2 10H24.8V22H23.2ZM4 15.2H28V16.8H4Z" className="fill-plum" />
    </>
  ),
  /* The glass, tipped the way Ollie holds it. */
  "missing-number-detective": (
    <>
      <path d="M18.5 19.5L26 27C27.2 28.2 25.2 30.2 24 29L16.5 21.5Z" className="fill-paper" />
      <circle cx="14" cy="14" r="8.5" className="fill-paper" />
      <circle cx="14" cy="14" r="5.5" className="fill-plum" />
    </>
  ),
  /* The open book, its two leaves lifting off the spine. */
  "story-solver": (
    <>
      <path d="M4 8C8 6.5 13 6.5 15 9.5V26C13 23.5 8 23.5 4 25Z" className="fill-paper" />
      <path d="M28 8C24 6.5 19 6.5 17 9.5V26C19 23.5 24 23.5 28 25Z" className="fill-paper" />
      <path d="M6.5 13L12.5 14.5M6.5 17L12.5 18.5M25.5 13L19.5 14.5M25.5 17L19.5 18.5" className="stroke-plum" strokeWidth="1.6" strokeLinecap="round" />
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
