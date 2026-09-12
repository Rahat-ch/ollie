"use client";

import { useProfile } from "@/profile/store";
import { SessionScreen } from "./SessionScreen";

/** The Session screen once the browser has the Profile; paper until then. */
export function Play() {
  const profile = useProfile();
  if (!profile) return <main className="learner-stage" aria-busy="true" />;
  return <SessionScreen key={profile.seed} profile={profile} />;
}
