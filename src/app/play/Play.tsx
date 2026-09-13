"use client";

import { useSetUpProfile } from "@/profile/use-set-up-profile";
import { BlankStage } from "@/ui/BlankStage";
import { SessionScreen } from "./SessionScreen";

/** The Session screen once the browser has a set-up Profile; paper until then, and home if onboarding is still to do. */
export function Play() {
  const ready = useSetUpProfile();
  if (!ready) return <BlankStage />;
  return <SessionScreen key={ready.profile.seed} profile={ready.profile} identity={ready.identity} />;
}
