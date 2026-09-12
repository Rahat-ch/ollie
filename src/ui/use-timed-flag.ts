import { useEffect, useState } from "react";

/**
 * True for `ms` after `key` changes, then false. Used for how long Ollie is
 * talking with no audio yet: the timer is the only thing that sets state.
 */
export function useTimedFlag(key: string, ms: number): boolean {
  const [expired, setExpired] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setExpired(key), ms);
    return () => clearTimeout(timer);
  }, [key, ms]);
  return expired !== key;
}
