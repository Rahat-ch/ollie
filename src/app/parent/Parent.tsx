"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfile } from "@/profile/store";
import { BlankStage } from "@/ui/BlankStage";
import { ParentArea } from "./ParentArea";
import { ParentGate } from "./ParentGate";

/** The Parent Gate, then the Parent Area. The gate closes again on every visit; before onboarding there is nothing here, so home. */
export function Parent() {
  const profile = useProfile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ready = profile !== null && profile.identity !== null;
  useEffect(() => {
    if (profile && !ready) router.replace("/");
  }, [profile, ready, router]);
  if (!profile || !ready) return <BlankStage />;
  if (!open) return <ParentGate onOpen={() => setOpen(true)} />;
  return <ParentArea profile={profile} identity={profile.identity} />;
}
