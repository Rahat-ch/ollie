import type { ThemeId } from "@/profile/identity";
import { INK_STROKE } from "./icons";

/**
 * One flat paper picture per Theme, hand-cut in the illustration style of
 * `docs/design/direction.md`: filled paths only, one deep tone of the same
 * hue laid behind as the paper shadow, no outline and no gradient. The one
 * line the style allows (3px ink at 60%, `INK_STROKE`) appears only where a
 * drawing needs it: the puppy's mouth, the wave, the truck's step.
 *
 * All six share a 96×96 frame and one silhouette weight, so the same
 * picture reads at 176px in the Story card and at 44px in the Shop's Theme
 * picker without a second drawing.
 */
const PICTURES: Readonly<Record<ThemeId, React.ReactNode>> = {
  /* A puppy, front on: long soft ears, a cream muzzle, a bone at its paw. */
  puppies: (
    <>
      <ellipse cx="50" cy="52" rx="30" ry="28" className="fill-rust-deep" />
      <path d="M20 34C12 42 10 62 16 74C22 82 32 80 34 70C36 58 32 42 20 34Z" className="fill-rust-deep" />
      <path d="M76 34C84 42 86 62 80 74C74 82 64 80 62 70C60 58 64 42 76 34Z" className="fill-rust-deep" />
      <ellipse cx="48" cy="48" rx="30" ry="28" className="fill-rust" />
      <ellipse cx="48" cy="60" rx="17" ry="13" className="fill-cream" />
      <circle cx="36" cy="42" r="7" className="fill-paper" />
      <circle cx="36" cy="42" r="3.5" className="fill-ink" />
      <circle cx="34" cy="40" r="1.4" className="fill-paper" />
      <circle cx="60" cy="42" r="7" className="fill-paper" />
      <circle cx="60" cy="42" r="3.5" className="fill-ink" />
      <circle cx="58" cy="40" r="1.4" className="fill-paper" />
      <path d="M42 54C44 51 52 51 54 54C54 58 51 61 48 61C45 61 42 58 42 54Z" className="fill-ink" />
      <path d="M48 62V66M48 66C46 70 41 70 40 67M48 66C50 70 55 70 56 67" {...INK_STROKE} />
      <circle cx="32" cy="82.5" r="5" className="fill-sun-deep" />
      <circle cx="32" cy="91.5" r="5" className="fill-sun-deep" />
      <circle cx="64" cy="82.5" r="5" className="fill-sun-deep" />
      <circle cx="64" cy="91.5" r="5" className="fill-sun-deep" />
      <rect x="32" y="83.5" width="32" height="7" rx="3.5" className="fill-sun-deep" />
      <circle cx="32" cy="80" r="5" className="fill-sun" />
      <circle cx="32" cy="89" r="5" className="fill-sun" />
      <circle cx="64" cy="80" r="5" className="fill-sun" />
      <circle cx="64" cy="89" r="5" className="fill-sun" />
      <rect x="32" y="81" width="32" height="7" rx="3.5" className="fill-sun" />
    </>
  ),

  /* A round dinosaur with three plates, looking up over its shoulder. */
  dinosaurs: (
    <>
      <path d="M20 54L28 32L38 52ZM40 52L50 28L60 50Z" className="fill-leaf-deep" />
      <ellipse cx="44" cy="72" rx="28" ry="18" className="fill-leaf-deep" />
      <path d="M50 70C50 52 56 38 68 32C72 34 76 38 78 42C68 48 64 58 64 70Z" className="fill-leaf-deep" />
      <ellipse cx="42" cy="68" rx="28" ry="18" className="fill-leaf" />
      <path d="M16 62C6 60 2 48 6 40C11 46 16 54 20 60Z" className="fill-leaf" />
      <path d="M50 66C50 48 56 34 68 28C72 30 76 34 78 38C68 44 64 54 64 66Z" className="fill-leaf" />
      <ellipse cx="78" cy="32" rx="14" ry="12" className="fill-leaf" />
      <circle cx="80" cy="29" r="5.5" className="fill-paper" />
      <circle cx="81" cy="29" r="2.8" className="fill-ink" />
      <circle cx="79.5" cy="27.5" r="1.2" className="fill-paper" />
      <path d="M86 38C88 37 90 37 91 38" {...INK_STROKE} />
      <path d="M26 82C26 88 30 90 34 90C38 90 40 87 40 82ZM48 82C48 88 52 90 56 90C60 90 62 87 62 82Z" className="fill-leaf-deep" />
    </>
  ),

  /* A rocket climbing, with a flame and three paper stars. */
  space: (
    <>
      <path d="M50 8C62 20 66 40 62 58H38C34 40 38 20 50 8Z" className="fill-plum-deep" />
      <path d="M47 8C59 20 63 40 59 58H35C31 40 35 20 47 8Z" className="fill-plum" />
      <circle cx="47" cy="32" r="11" className="fill-sky-deep" />
      <circle cx="47" cy="31" r="9" className="fill-sky" />
      <circle cx="43" cy="27" r="2.5" className="fill-paper" />
      <path d="M35 44C26 50 22 58 22 66C28 64 32 62 36 58ZM59 44C68 50 72 58 72 66C66 64 62 62 58 58Z" className="fill-plum-deep" />
      <path d="M37 58H57C57 66 53 72 47 76C41 72 37 66 37 58Z" className="fill-sun-deep" />
      <path d="M40 58H54C54 65 51 70 47 73C43 70 40 65 40 58Z" className="fill-sun" />
      <path d="M78 14C79.2 20 80 20.8 86 22C80 23.2 79.2 24 78 30C76.8 24 76 23.2 70 22C76 20.8 76.8 20 78 14Z" className="fill-sun" />
      <path d="M16 30C16.8 34 17.3 34.5 21 35C17.3 35.5 16.8 36 16 40C15.2 36 14.7 35.5 11 35C14.7 34.5 15.2 34 16 30Z" className="fill-paper-3" />
      <path d="M80 62C80.8 66 81.3 66.5 85 67C81.3 67.5 80.8 68 80 72C79.2 68 78.7 67.5 75 67C78.7 66.5 79.2 66 80 62Z" className="fill-paper-3" />
    </>
  ),

  /* A fish, a paper wave under it, and two bubbles. */
  ocean: (
    <>
      <path d="M64 26C76 32 82 42 82 52C82 62 76 72 64 78C50 84 30 78 22 66C18 60 18 44 22 38C30 26 50 20 64 26Z" className="fill-sky-deep" />
      <path d="M62 24C74 30 80 40 80 50C80 60 74 70 62 76C48 82 28 76 20 64C16 58 16 42 20 36C28 24 48 18 62 24Z" className="fill-sky" />
      <path d="M80 50C86 44 92 40 94 42C95 46 95 54 94 58C92 60 86 56 80 50Z" className="fill-sky-deep" />
      <path d="M46 24C52 14 62 10 70 14C63 18 56 23 52 30Z" className="fill-sky-deep" />
      <path d="M48 74C54 82 62 86 69 84C62 80 56 77 52 70Z" className="fill-sky-deep" />
      <path d="M58 32C62 40 63 48 63 52C63 58 62 64 58 70C56 64 55 58 55 52C55 44 56 38 58 32ZM68 40C71 44 72 48 72 52C72 57 71 60 68 64C67 60 66 56 66 52C66 47 67 44 68 40Z" className="fill-sky-deep" />
      <circle cx="32" cy="44" r="8" className="fill-paper" />
      <circle cx="33" cy="44" r="4" className="fill-ink" />
      <circle cx="31" cy="42" r="1.6" className="fill-paper" />
      <path d="M22 54C26 56 30 56 34 54" {...INK_STROKE} />
      <circle cx="18" cy="22" r="6" className="fill-sky-deep" />
      <circle cx="32" cy="13" r="4" className="fill-sky-deep" />
      <path d="M6 86C12 80 18 80 24 86C30 92 36 92 42 86C48 80 54 80 60 86C66 92 72 92 78 86C84 80 88 80 92 84" {...INK_STROKE} />
    </>
  ),

  /* A fairy: two berry wings, a cream dress, sun hair, and a wand. */
  fairies: (
    <>
      <path d="M46 46C36 30 20 20 12 28C4 36 12 54 28 58C14 62 8 76 16 82C26 89 40 74 46 60Z" className="fill-berry-deep" />
      <path d="M54 46C64 30 80 20 88 28C96 36 88 54 72 58C86 62 92 76 84 82C74 89 60 74 54 60Z" className="fill-berry-deep" />
      <path d="M44 44C34 28 20 18 13 26C6 34 13 51 28 55C15 59 9 72 17 78C26 84 38 71 44 58Z" className="fill-berry" />
      <path d="M56 44C66 28 80 18 87 26C94 34 87 51 72 55C85 59 91 72 83 78C74 84 62 71 56 58Z" className="fill-berry" />
      <path d="M50 40C56 40 60 46 60 54L64 84H36L40 54C40 46 44 40 50 40Z" className="fill-cream" />
      <path d="M50 8C58 8 63 14 63 22C63 30 58 36 50 36C42 36 37 30 37 22C37 14 42 8 50 8Z" className="fill-sun" />
      <circle cx="50" cy="24" r="11" className="fill-cream" />
      <circle cx="45.5" cy="23" r="2.2" className="fill-ink" />
      <circle cx="54.5" cy="23" r="2.2" className="fill-ink" />
      <path d="M46 30C48 32 52 32 54 30" {...INK_STROKE} />
      <path d="M64 58L82 46" {...INK_STROKE} />
      <path d="M86 30C87.6 38 88.4 38.8 96 40.4C88.4 42 87.6 42.8 86 50.4C84.4 42.8 83.6 42 76 40.4C83.6 38.8 84.4 38 86 30Z" className="fill-sun" />
    </>
  ),

  /* A tipper truck, side on, with a rust cab and a load. */
  trucks: (
    <>
      <path d="M8 50H46L54 34H72L84 52V72H8Z" className="fill-sun-deep" />
      <path d="M8 46H46L54 30H70L82 48V68H8Z" className="fill-sun" />
      <path d="M58 34H68L76 46H58Z" className="fill-sky" />
      <path d="M12 30H44V48H12Z" className="fill-rust-deep" />
      <path d="M10 26H42V46H10Z" className="fill-rust" />
      <path d="M14 16H26V26H14ZM30 18H40V26H30Z" className="fill-rust-deep" />
      <path d="M74 56H82V64H74Z" className="fill-sun-deep" />
      <circle cx="26" cy="70" r="13" className="fill-ink" />
      <circle cx="26" cy="70" r="5.5" className="fill-paper-3" />
      <circle cx="70" cy="70" r="13" className="fill-ink" />
      <circle cx="70" cy="70" r="5.5" className="fill-paper-3" />
      <path d="M10 58H26" {...INK_STROKE} />
    </>
  ),
};

/** The Theme's picture: the Story card's at 176px, the Theme picker's at 44px. */
export function ThemeIcon({ theme, size = 48 }: { readonly theme: ThemeId; readonly size?: number }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true" data-theme={theme}>
      {PICTURES[theme]}
    </svg>
  );
}
