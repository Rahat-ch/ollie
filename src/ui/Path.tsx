import type { PathStop } from "@/play/path";
import { INK_STROKE } from "./icons";
import { LockIcon } from "./LockIcon";
import { PowerMark } from "./PowerMark";

function Check() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" {...INK_STROKE} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Stop({ stop }: { readonly stop: PathStop }) {
  const label = stop.state === "current" ? `Unit ${stop.unit} · now` : `Unit ${stop.unit}`;
  return (
    <div className="flex w-48 flex-col items-center gap-2" data-testid="path-stop" data-state={stop.state}>
      {stop.state === "done" && (
        <div className="flex size-27 items-center justify-center rounded-pill bg-leaf shadow-[0_4px_0_var(--leaf-deep)]">
          <Check />
        </div>
      )}
      {stop.state === "current" && (
        // The sun ring around the current stop is the canvas's own treatment (Main.dc.html), not an elevation.
        <div className="flex size-33 items-center justify-center rounded-pill bg-paper shadow-[0_0_0_6px_var(--sun)]">
          <div className="flex size-27 items-center justify-center rounded-pill bg-sun shadow-[0_4px_0_var(--sun-deep)]">
            {/* Ollie's head is rust with an amber beak; on paper it reads, on the sun disc it does not. */}
            <span className="flex size-19 items-center justify-center rounded-pill bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element -- the project's own SVG, no optimisation wanted */}
              <img src="/ollie/ollie-head.svg" alt="" width="64" height="64" />
            </span>
          </div>
        </div>
      )}
      {stop.state === "locked" && (
        <div className="flex size-27 items-center justify-center rounded-pill bg-paper-3">
          <LockIcon />
        </div>
      )}
      <div className="font-text text-caption text-ink-soft">{label}</div>
      <div className={`text-center font-display text-display-s font-semibold ${stop.state === "locked" ? "text-ink-soft" : "text-ink"}`}>
        {stop.name}
      </div>
      {stop.powers.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1" aria-label={`Powers Ollie learned in Unit ${stop.unit}`}>
          {stop.powers.map((power) => (
            <li key={power.id} data-testid="path-power" data-power={power.id} title={power.name}>
              <PowerMark power={power.id} size={34} />
              <span className="sr-only">{power.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The three Units in order along a dotted sky path. */
export function Path({ stops }: { readonly stops: readonly PathStop[] }) {
  const offsets = ["pt-24", "pt-16", "pt-[70px]"];
  return (
    <nav aria-label="Path" className="relative h-65 w-full max-w-173">
      <svg viewBox="0 0 692 260" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M96 150 C 200 40, 260 40, 346 118 S 520 220, 596 120" className="stroke-sky" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" />
      </svg>
      <ol className="absolute inset-0 flex items-start justify-between">
        {stops.map((stop, i) => (
          <li key={stop.unit} className={offsets[i]}>
            <Stop stop={stop} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
