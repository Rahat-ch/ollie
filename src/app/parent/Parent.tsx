"use client";

import { useState } from "react";
import { useProfile } from "@/profile/store";
import { ParentArea } from "./ParentArea";
import { ParentGate } from "./ParentGate";

/** The Parent Gate, then the Parent Area. The gate closes again on every visit. */
export function Parent() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  if (!profile) return <main className="learner-stage" aria-busy="true" />;
  if (!open) return <ParentGate onOpen={() => setOpen(true)} />;
  return <ParentArea profile={profile} />;
}
