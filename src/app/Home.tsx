"use client";

import Link from "next/link";
import { Ollie } from "@/ollie/Ollie";
import { greeting } from "@/play/lines";
import { pathStops } from "@/play/path";
import { useSpeech } from "@/play/use-speech";
import { useProfile } from "@/profile/store";
import { Avatar } from "@/ui/Avatar";
import { bigButtonClasses } from "@/ui/BigButton";
import { BlankStage } from "@/ui/BlankStage";
import { INK_STROKE } from "@/ui/icons";
import { LockIcon } from "@/ui/LockIcon";
import { Path } from "@/ui/Path";
import { PillLink } from "@/ui/PillLink";
import { SpeechBubble } from "@/ui/SpeechBubble";
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
  // The greeting is the one fixed line with the Nickname in it, so it is
  // rendered per Nickname and cached; the chain falls through until it is there.
  const { speaking, source } = useSpeech(
    { text: line, request: identity ? { kind: "greeting", nickname: identity.nickname } : undefined },
    line,
  );

  if (!profile) return <BlankStage />;
  if (!identity) return <Onboarding />;

  return (
    <main className="learner-stage" data-speech-source={source ?? undefined}>
      <h1 className="sr-only">Ollie</h1>
      <PillLink href="/parent" tone="paper" className="absolute top-6 left-gutter pl-3">
        <LockIcon size={22} />
        Grown-ups
      </PillLink>
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
