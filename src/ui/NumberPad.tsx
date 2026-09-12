const NUMBERS = Array.from({ length: 21 }, (_, n) => n);

type NumberPadProps = {
  readonly onTap: (answer: number) => void;
  /** No taps while Ollie is reacting. */
  readonly disabled?: boolean;
  /** The answer tried on the first miss, shown pressed so it is not tapped again. */
  readonly tried?: number;
};

/** The 0 to 20 pad: the only way the Learner answers. */
export function NumberPad({ onTap, disabled = false, tried }: NumberPadProps) {
  return (
    <div className="flex w-88 flex-col gap-3" role="group" aria-label="Number pad" data-testid="number-pad">
      <div className="grid grid-cols-5 gap-2">
        {NUMBERS.slice(0, 20).map((n) => (
          <Key key={n} n={n} onTap={onTap} disabled={disabled} tried={tried === n} />
        ))}
      </div>
      <div className="flex justify-center">
        <Key n={20} onTap={onTap} disabled={disabled} tried={tried === 20} />
      </div>
    </div>
  );
}

function Key({
  n,
  onTap,
  disabled,
  tried,
}: {
  readonly n: number;
  readonly onTap: (answer: number) => void;
  readonly disabled: boolean;
  readonly tried: boolean;
}) {
  return (
    <button
      type="button"
      className={`paper-button flex size-touch-learner items-center justify-center rounded-card font-display text-numeral font-semibold text-ink [--button-shadow-color:var(--paper-3)] ${
        tried ? "paper-button-pressed bg-paper-3 text-ink-soft" : "bg-cream"
      }`}
      onClick={() => onTap(n)}
      disabled={disabled || tried}
      aria-label={`${n}`}
    >
      {n}
    </button>
  );
}
