import type { ThemeId } from "@/profile/identity";

/** One flat paper picture per Theme, from the onboarding canvas. */
const PICTURES: Readonly<Record<ThemeId, React.ReactNode>> = {
  puppies: (
    <>
      <ellipse cx="24" cy="27" rx="15" ry="13" className="fill-rust" />
      <ellipse cx="11" cy="22" rx="5" ry="9" className="fill-rust-deep" />
      <ellipse cx="37" cy="22" rx="5" ry="9" className="fill-rust-deep" />
      <circle cx="19" cy="26" r="2.5" className="fill-ink" />
      <circle cx="29" cy="26" r="2.5" className="fill-ink" />
      <ellipse cx="24" cy="32" rx="3.5" ry="2.5" className="fill-ink" />
    </>
  ),
  dinosaurs: (
    <>
      <path d="M8 36 C8 22 18 14 30 16 L38 10 L40 20 C42 30 34 38 22 38 Z" className="fill-leaf" />
      <path d="M14 20l3-6 3 6zM22 16l3-6 3 6z" className="fill-leaf-deep" />
      <circle cx="34" cy="19" r="2.2" className="fill-ink" />
    </>
  ),
  space: (
    <>
      <path d="M24 6 C32 14 32 28 28 36 H20 C16 28 16 14 24 6 Z" className="fill-plum" />
      <circle cx="24" cy="20" r="4" className="fill-sky" />
      <path d="M20 36 L16 42 H32 L28 36 Z" className="fill-sun" />
      <path d="M16 30 L12 36 L18 34 Z M32 30 L36 36 L30 34 Z" className="fill-plum-deep" />
    </>
  ),
  ocean: (
    <>
      <path d="M10 26 C16 16 30 16 36 24 L42 18 L40 34 L36 28 C30 36 16 36 10 26 Z" className="fill-sky" />
      <circle cx="18" cy="24" r="2.2" className="fill-ink" />
      <path d="M6 40 Q12 36 18 40 T30 40 T42 40" fill="none" className="stroke-sky-deep" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  fairies: (
    <>
      <ellipse cx="16" cy="22" rx="9" ry="12" className="fill-berry" transform="rotate(-20 16 22)" />
      <ellipse cx="32" cy="22" rx="9" ry="12" className="fill-berry" transform="rotate(20 32 22)" />
      <ellipse cx="24" cy="26" rx="5" ry="12" className="fill-cream" />
      <circle cx="24" cy="12" r="4" className="fill-cream" />
      <path d="M24 38 l-3 6M24 38 l3 6" className="stroke-berry-deep" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  trucks: (
    <>
      <rect x="6" y="18" width="24" height="16" rx="3" className="fill-sun" />
      <path d="M30 22 h8 l4 6 v6 h-12 z" className="fill-sun-deep" />
      <circle cx="14" cy="36" r="4.5" className="fill-ink" />
      <circle cx="34" cy="36" r="4.5" className="fill-ink" />
    </>
  ),
};

export function ThemeIcon({ theme }: { readonly theme: ThemeId }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
      {PICTURES[theme]}
    </svg>
  );
}
