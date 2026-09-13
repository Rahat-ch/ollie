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
import { routeCoaching, runCoaching } from "./coaching";

/** Powers earned in the Session, by name. They arrive with ticket 13; until then none is earned. */
const POWERS_EARNED: readonly string[] = [];

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
    void runCoaching(routeCoaching(), profileStore.get().coach, awaiting, POWERS_EARNED, new Date())
      .then((run) => profileStore.update((current) => ({ ...current, coach: applyCoachRun(current.coach, run) })))
      .finally(() => running.delete(session));
  }, [awaiting]);
}
