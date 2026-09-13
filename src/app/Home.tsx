"use client";

import Link from "next/link";
import { Ollie } from "@/ollie/Ollie";
import { greeting, speakingMs } from "@/play/lines";
import { pathStops } from "@/play/path";
import { useProfile } from "@/profile/store";
import { streakToday } from "@/rewards/rewards";
import { Avatar } from "@/ui/Avatar";
import { bigButtonClasses } from "@/ui/BigButton";
import { BlankStage } from "@/ui/BlankStage";
import { INK_STROKE } from "@/ui/icons";
import { LockIcon } from "@/ui/LockIcon";
import { Path } from "@/ui/Path";
import { PillLink } from "@/ui/PillLink";
import { CoinChip, CoinIcon, StreakChip } from "@/ui/RewardChips";

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

  if (!profile) return <BlankStage />;
  if (!identity) return <Onboarding />;

  return (
    <main className="learner-stage">
      <h1 className="sr-only">Ollie</h1>
      <PillLink href="/parent" tone="paper" className="absolute top-6 left-gutter pl-3">
        <LockIcon size={22} />
        Grown-ups
      </PillLink>
      <div className="absolute top-6 right-gutter flex items-center gap-4">
        <StreakChip streak={streakToday(profile.rewards, new Date())} freezes={profile.rewards.freezes} />
        <CoinChip coins={profile.rewards.coins} />
        <Avatar color={identity.avatarColor} worn={profile.rewards.worn} />
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
      <Link href="/shop" className={`${bigButtonClasses("l", "paper")} absolute right-gutter bottom-12`}>
        <CoinIcon />
        Shop
      </Link>
    </main>
  );
}
