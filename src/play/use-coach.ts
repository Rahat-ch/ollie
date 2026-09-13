/**
 * The Coach run and the Parent Summary after a Session, from the browser.
 * A completed Session waits on the record until a run writes it, so the run
 * survives a reload: whichever screen is open starts it, the Session screen
 * or the home screen, and a reload mid-run runs it again. That is still one
 * run of the engine's rule per Session — its own one retry included — and a
 * Session already coached never waits again. Nothing on screen waits for
 * it: the Learner is at the celebration and then gone, and the record is
 * written when the run lands. If it fails, the record keeps the Baseline
 * Plan and the reasons, and Ollie's Notebook says so.
 */
import { useEffect } from "react";
import { applyCoachRun } from "@/coach";
import type { Profile } from "@/profile/profile";
import { profileStore } from "@/profile/store";
import { powersEarnedIn, routeCoaching, runCoaching } from "./coaching";

/** The Sessions a run is in flight for on this page. */
const running = new Set<number>();

export function useSessionCoach(profile: Profile | null): void {
  const awaiting = profile?.coach.awaiting ?? null;
  useEffect(() => {
    if (!awaiting) return;
    const session = awaiting.log.sessionNumber;
    if (running.has(session)) return;
    running.add(session);
    // The record the run is written onto is read when it lands, not captured here.
    // The Powers the Session earned come from the Session waiting on the
    // record, not from a screen's state, so a reload names them all the same.
    void runCoaching(routeCoaching(), profileStore.get().coach, awaiting, powersEarnedIn(awaiting), new Date())
      .then((run) => profileStore.update((current) => ({ ...current, coach: applyCoachRun(current.coach, run) })))
      .finally(() => running.delete(session));
  }, [awaiting]);
}
