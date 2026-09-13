"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Identity } from "./identity";
import type { Profile } from "./profile";
import { useProfile } from "./store";

/**
 * What every screen behind onboarding needs: the Profile and the identity
 * the Parent chose. Null while the browser is still reading the Profile,
 * and on the way home when onboarding is still to do, which is the one
 * route out of a screen the Learner should not be on yet.
 */
export function useSetUpProfile(): { profile: Profile; identity: Identity } | null {
  const profile = useProfile();
  const router = useRouter();
  const identity = profile?.identity ?? null;
  useEffect(() => {
    if (profile && !identity) router.replace("/");
  }, [profile, identity, router]);
  return profile && identity ? { profile, identity } : null;
}
