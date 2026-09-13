/**
 * The Coach run and the Parent Summary after a Session, from the browser.
 * Exactly one run per completed Session: a Session already coached is never
 * coached again, whatever a re-render or a reload does, and a run in flight
 * is not started twice. Nothing on screen waits for it — the Learner is at
 * the celebration and then gone — so the run finishes in the background and
 * writes the record when it lands. If it fails, the record keeps the
 * Baseline Plan and the reasons, and Ollie's Notebook says so.
 */
import { useEffect } from "react";
import type { SessionResult } from "@/loop";
import { profileStore } from "@/profile/store";
import { routeCoaching, runCoaching } from "./coaching";

/** Powers earned in the Session, by name. They arrive with ticket 13; until then none is earned. */
const POWERS_EARNED: readonly string[] = [];

/** The Sessions a run has already been started for on this page. */
const started = new Set<number>();

export function useSessionCoach(result: SessionResult | null): void {
  useEffect(() => {
    if (!result) return;
    const { sessionNumber } = result.log;
    const record = profileStore.get().coach;
    if (started.has(sessionNumber) || record.lastSessionCoached >= sessionNumber) return;
    started.add(sessionNumber);
    void runCoaching(routeCoaching(), record, result, POWERS_EARNED, new Date()).then((coach) => {
      profileStore.update((current) => ({ ...current, coach }));
    });
  }, [result]);
}
