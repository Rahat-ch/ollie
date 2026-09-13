import type { PowerId } from "@/loop";

/**
 * A Power's mark: one flat paper shape cut out of a plum disc, from the same
 * parts as Ollie's pose for it — the wing beats over the hops, the ten-frame
 * filled to ten, the magnifying glass, the open book. Nothing but paper on
 * plum, so the mark still reads at 32px on the Path.
 */
const MARKS: Readonly<Record<PowerId, React.ReactNode>> = {
  /* Hops along the number line, flown: the wing beat the Power puts over them. */
  "count-on-flight": (
    <>
      <path d="M14.5 9C11.8 6.6 8.4 6.8 6.2 9.3C8.9 10.4 12.3 10.2 14.5 9Z" className="fill-paper" />
      <path d="M15.5 9C18.2 6.6 21.6 6.8 23.8 9.3C21.1 10.4 17.7 10.2 15.5 9Z" className="fill-paper" />
      <path d="M4 25C4 13 14 13 14 25L12 25C12 15.5 6 15.5 6 25Z" className="fill-paper" />
      <path d="M16 25C16 13 26 13 26 25L24 25C24 15.5 18 15.5 18 25Z" className="fill-paper" />
      <rect x="5" y="25" width="22" height="2" rx="1" className="fill-paper" />
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
      <path d="M6.5 12.2L12.5 13.7L12.5 15.3L6.5 13.8ZM6.5 16.2L12.5 17.7L12.5 19.3L6.5 17.8ZM25.5 12.2L19.5 13.7L19.5 15.3L25.5 13.8ZM25.5 16.2L19.5 17.7L19.5 19.3L25.5 17.8Z" className="fill-plum" />
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
