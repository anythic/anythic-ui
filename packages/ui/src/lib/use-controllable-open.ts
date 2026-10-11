import { useState } from "react";

/**
 * Open state that works both controlled (`open` given) and uncontrolled.
 * `setOpen` always reports through `onOpenChange`.
 */
export function useControllableOpen(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
): [boolean, (open: boolean) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const value = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };
  return [value, setOpen];
}
