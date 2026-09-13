"use client";

import { useSetUpProfile } from "@/profile/use-set-up-profile";
import { BlankStage } from "@/ui/BlankStage";
import { Shop } from "./Shop";

/** The Shop once the browser has a set-up Profile; paper until then, and home if onboarding is still to do. */
export function ShopScreen() {
  const ready = useSetUpProfile();
  if (!ready) return <BlankStage />;
  return <Shop profile={ready.profile} identity={ready.identity} />;
}
