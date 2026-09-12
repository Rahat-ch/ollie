/** The Avatar placeholder: a round cream creature. Colour and Items come with tickets 09 and 14. */
export function Avatar({ size = 72 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} role="img" aria-label="Your Avatar">
      <path d="M22 18 Q40 6 58 18" fill="none" className="stroke-paper-3" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" />
      <ellipse cx="42" cy="49" rx="30" ry="27" className="fill-paper-3" />
      <ellipse cx="40" cy="46" rx="30" ry="27" className="fill-cream" />
      <circle cx="30" cy="42" r="4" className="fill-ink" />
      <circle cx="50" cy="42" r="4" className="fill-ink" />
      <path d="M32 55 Q40 62 48 55" fill="none" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
