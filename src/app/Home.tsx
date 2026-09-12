"use client";

import Link from "next/link";
import { Ollie } from "@/ollie/Ollie";
import { GREETING } from "@/play/lines";
import { pathStops } from "@/play/path";
import { useProfile } from "@/profile/store";
import { Avatar } from "@/ui/Avatar";
import { bigButtonClasses } from "@/ui/BigButton";
import { Path } from "@/ui/Path";
import { SpeechBubble } from "@/ui/SpeechBubble";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--ink)" strokeOpacity="0.6" strokeWidth="3" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5z" />
    </svg>
  );
}

/** Ollie, the Avatar, the Path, and one big Play button. */
export function Home() {
  const profile = useProfile();
  return (
    <main className="learner-stage">
      <h1 className="sr-only">Ollie</h1>
      <div className="absolute top-6 right-gutter">
        <Avatar />
      </div>
      <SpeechBubble size="m" className="absolute top-30 left-12">
        {GREETING}
      </SpeechBubble>
      <Ollie pose="idle" size={220} className="absolute bottom-6 left-gutter" />
      <div className="flex min-h-dvh items-center justify-center pt-24 pb-44 pl-72">
        {profile && <Path stops={pathStops(profile.progress)} />}
      </div>
      <Link href="/play" className={`${bigButtonClasses("sun", "xl")} absolute bottom-12 left-1/2 -translate-x-1/2`}>
        <PlayIcon />
        Play
      </Link>
    </main>
  );
}
