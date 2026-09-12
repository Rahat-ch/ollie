import { INK_STROKE } from "./icons";

/** The padlock: on the locked Path stop, the Grown-ups control, and the onboarding note. */
export function LockIcon({ size = 48, className = "" }: { readonly size?: number; readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...INK_STROKE} className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}
