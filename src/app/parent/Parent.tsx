"use client";

import { useState } from "react";
import { useSetUpProfile } from "@/profile/use-set-up-profile";
import { BlankStage } from "@/ui/BlankStage";
import { ParentArea } from "./ParentArea";
import { ParentGate } from "./ParentGate";

/** The Parent Gate, then the Parent Area. The gate closes again on every visit; before onboarding there is nothing here, so home. */
export function Parent() {
  const ready = useSetUpProfile();
  const [open, setOpen] = useState(false);
  if (!ready) return <BlankStage />;
  if (!open) return <ParentGate onOpen={() => setOpen(true)} />;
  return <ParentArea profile={ready.profile} identity={ready.identity} />;
}
