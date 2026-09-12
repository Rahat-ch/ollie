type SpeechBubbleProps = {
  readonly children: React.ReactNode;
  /** Display-m for the home greeting, display-s on the Session screen. */
  readonly size?: "m" | "s";
  readonly className?: string;
};

/** Ollie's paper bubble with its tail pointing down-left toward Ollie. */
export function SpeechBubble({ children, size = "s", className = "" }: SpeechBubbleProps) {
  const text = size === "m" ? "text-display-m px-7 py-5" : "text-display-s px-6 py-4";
  return (
    <div className={`flex flex-col items-start ${className}`.trim()} data-testid="speech-bubble">
      <div
        className={`speech-bubble rounded-button bg-paper-2 font-display font-semibold text-ink shadow-card ${text}`}
        aria-live="polite"
      >
        {children}
      </div>
      <svg viewBox="0 0 40 28" width="40" height="28" className="ml-9" aria-hidden="true">
        <path d="M0 0h40L10 28z" className="fill-paper-2" />
      </svg>
    </div>
  );
}
