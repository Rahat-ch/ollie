/**
 * The one Profile on this device, in localStorage under a single key, read
 * through useSyncExternalStore so the server renders nothing personal and
 * the browser fills it in. A Profile that is missing or unreadable is
 * replaced by a fresh one with a random seed.
 */
import { useSyncExternalStore } from "react";
import { createProfile, parseProfile, serializeProfile, type Profile } from "./profile";

export const PROFILE_KEY = "ollie.profile";

type Listener = () => void;

let cached: Profile | undefined;
const listeners = new Set<Listener>();

const notify = (): void => listeners.forEach((listener) => listener());

function read(): Profile {
  if (cached === undefined) {
    cached = parseProfile(window.localStorage.getItem(PROFILE_KEY)) ?? createProfile(crypto.randomUUID());
  }
  return cached;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const profileStore = {
  /** The Profile as it stands; created on first read. */
  get: read,
  save(profile: Profile): void {
    const text = serializeProfile(profile);
    if (cached !== undefined && serializeProfile(cached) === text) return;
    window.localStorage.setItem(PROFILE_KEY, text);
    cached = profile;
    notify();
  },
  update(change: (profile: Profile) => Profile): void {
    profileStore.save(change(read()));
  },
};

// Another window on this device (a second tab, or the developer's browser
// beside the tablet's) writes the same key. Its write must not be replaced by
// this window's stale copy on the next save, so the cache is dropped and the
// screens re-read whenever the key changes elsewhere.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== PROFILE_KEY) return;
    cached = undefined;
    notify();
  });
}

const getServerSnapshot = (): Profile | null => null;

/** The Profile, or null on the server and until the browser has read it. */
export function useProfile(): Profile | null {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}
