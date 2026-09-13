"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/profile/store";
import { BlankStage } from "@/ui/BlankStage";
import { Shop } from "./Shop";

/** The Shop once the browser has a set-up Profile; paper until then, and home if onboarding is still to do. */
export function ShopScreen() {
  const profile = useProfile();
  const router = useRouter();
  const ready = profile !== null && profile.identity !== null;
  useEffect(() => {
    if (profile && !ready) router.replace("/");
  }, [profile, ready, router]);
  if (!profile || !profile.identity) return <BlankStage />;
  return <Shop profile={profile} identity={profile.identity} />;
}
