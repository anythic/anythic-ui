import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface StreamingTextProps extends HTMLAttributes<HTMLDivElement> {
  /** The text received so far. */
  text: string;
  /** Whether more text is still arriving. Shows the cursor while true. */
  streaming?: boolean;
  /** Set to false to hide the cursor even while streaming. */
  cursor?: boolean;
}

/**
 * Renders text that grows as tokens arrive, with a blinking cursor while
 * the stream is open. Pair it with `useTextStream` or any state you update.
 */
export function StreamingText({
  text,
  streaming = false,
  cursor = true,
  className,
  ...props
}: StreamingTextProps) {
  return (
    <div
      // aria-busy holds screen-reader announcements until the text settles,
      // instead of reading out every token.
      aria-live="polite"
      aria-busy={streaming}
      data-streaming={streaming || undefined}
      className={cn("whitespace-pre-wrap break-words", className)}
      {...props}
    >
      {text}
      {streaming && cursor && (
        <span
          aria-hidden="true"
          data-slot="cursor"
          className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] animate-pulse bg-current motion-reduce:animate-none"
        />
      )}
    </div>
  );
}
