const NUMBERS = Array.from({ length: 21 }, (_, n) => n);

type NumberPadProps = {
  readonly onTap: (answer: number) => void;
  /** No taps while Ollie is reacting. */
  readonly disabled?: boolean;
  /** The answer tried on the first miss, shown pressed so it is not tapped again. */
  readonly tried?: number;
};

/**
 * The 0 to 20 pad: the only way the Learner answers. The key and both of the
 * gaps are tokens that grow with the screen's height (`--pad-key`,
 * `--pad-gap`, `--pad-row-gap` in src/app/tokens.css), so the pad opens up to
 * take the column a tall iPad gives it rather than sitting in a band of empty
 * paper, and its width follows from the keys instead of being fixed at 352px.
 */
export function NumberPad({ onTap, disabled = false, tried }: NumberPadProps) {
  return (
    <div className="flex flex-col gap-(--pad-row-gap)" role="group" aria-label="Number pad" data-testid="number-pad">
      <div className="grid grid-cols-5 gap-(--pad-gap)">
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
      className={`paper-button flex size-(--pad-key) items-center justify-center rounded-card font-display text-numeral font-semibold text-ink [--button-shadow-color:var(--paper-3)] ${
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
