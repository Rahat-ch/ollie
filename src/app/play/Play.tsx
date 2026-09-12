"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/profile/store";
import { SessionScreen } from "./SessionScreen";

/** The Session screen once the browser has a set-up Profile; paper until then, and home if onboarding is still to do. */
export function Play() {
  const profile = useProfile();
  const router = useRouter();
  const ready = profile !== null && profile.identity !== null;
  useEffect(() => {
    if (profile && !ready) router.replace("/");
  }, [profile, ready, router]);
  if (!profile || !ready) return <main className="learner-stage" aria-busy="true" />;
  return <SessionScreen key={profile.seed} profile={profile} />;
}
