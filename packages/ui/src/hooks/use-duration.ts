import { useEffect, useRef, useState } from "react";

/**
 * Milliseconds between `active` turning on and off, once it has; undefined
 * while active and before the first run. Starting again resets it. A
 * component mounted while already active starts its clock at mount.
 */
export function useDuration(active: boolean): number | undefined {
  const [duration, setDuration] = useState<number>();
  const startedAt = useRef<number | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) {
      startedAt.current = Date.now();
      setDuration(undefined);
    } else if (!active && wasActive.current && startedAt.current !== null) {
      setDuration(Date.now() - startedAt.current);
    }
    wasActive.current = active;
  }, [active]);

  return duration;
}
