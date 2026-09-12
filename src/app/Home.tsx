"use client";

import Link from "next/link";
import { Ollie } from "@/ollie/Ollie";
import { greeting, speakingMs } from "@/play/lines";
import { pathStops } from "@/play/path";
import { useProfile } from "@/profile/store";
import { Avatar } from "@/ui/Avatar";
import { bigButtonClasses } from "@/ui/BigButton";
import { INK_STROKE } from "@/ui/icons";
import { LockIcon } from "@/ui/LockIcon";
import { Path } from "@/ui/Path";
import { SpeechBubble } from "@/ui/SpeechBubble";
import { useTimedFlag } from "@/ui/use-timed-flag";
import { Onboarding } from "./Onboarding";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" {...INK_STROKE} aria-hidden="true">
      <path d="M8 5.5v13l10-6.5z" />
    </svg>
  );
}

/** Ollie, the Avatar, the Path, and one big Play button; onboarding until the Profile has an identity. */
export function Home() {
  const profile = useProfile();
  const identity = profile?.identity ?? null;
  const line = identity ? greeting(identity.nickname) : "";
  // Ollie says the greeting once the screen is up; audio arrives with ticket 11.
  const speaking = useTimedFlag(line, speakingMs(line));

  if (!profile) return <main className="learner-stage" aria-busy="true" />;
  if (!identity) return <Onboarding />;

  return (
    <main className="learner-stage">
      <h1 className="sr-only">Ollie</h1>
      <Link
        href="/parent"
        className="paper-button absolute top-6 left-gutter flex h-touch-parent items-center gap-2 rounded-pill bg-paper-2 pr-4 pl-3 font-text text-caption text-ink-soft [--button-shadow-color:var(--paper-3)]"
      >
        <LockIcon size={22} />
        Grown-ups
      </Link>
      <div className="absolute top-6 right-gutter">
        <Avatar color={identity.avatarColor} />
      </div>
      <SpeechBubble size="m" className="absolute top-30 left-12">
        {line}
      </SpeechBubble>
      <Ollie pose={speaking ? "talking" : "idle"} size={220} className="absolute bottom-6 left-gutter" />
      <div className="flex min-h-dvh items-center justify-center pt-24 pb-44 pl-72">
        <Path stops={pathStops(profile.progress)} />
      </div>
      <Link href="/play" className={`${bigButtonClasses("xl")} absolute bottom-12 left-1/2 -translate-x-1/2`}>
        <PlayIcon />
        Play
      </Link>
    </main>
  );
}
