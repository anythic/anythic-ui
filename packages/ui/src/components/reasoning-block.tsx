import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { ChevronRightIcon } from "../lib/icons";
import { useControllableOpen } from "../lib/use-controllable-open";
import { StreamingText } from "./streaming-text";

export interface ReasoningLabelState {
  streaming: boolean;
  /** Seconds spent thinking, once known. */
  duration: number | undefined;
}

export interface ReasoningBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The reasoning text received so far. */
  text: string;
  /** Whether the model is still thinking. */
  streaming?: boolean;
  /**
   * Seconds spent thinking. Measured automatically while `streaming` is
   * observed; pass it when rendering a finished block from history.
   */
  duration?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to `streaming`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Replaces the header text, e.g. for translation. */
  label?: (state: ReasoningLabelState) => ReactNode;
}

function defaultLabel({ streaming, duration }: ReasoningLabelState): ReactNode {
  if (streaming) return "Thinking…";
  if (duration === undefined) return "Thought";
  return duration < 1 ? "Thought for a moment" : `Thought for ${duration}s`;
}

/**
 * A collapsible view of a model's reasoning. Opens while the model thinks,
 * then collapses to a one-line summary when it finishes, unless the user
 * toggled it in the meantime.
 */
export function ReasoningBlock({
  text,
  streaming = false,
  duration: durationProp,
  open: openProp,
  defaultOpen,
  onOpenChange,
  label = defaultLabel,
  className,
  ...props
}: ReasoningBlockProps) {
  const contentId = useId();
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen ?? streaming, onOpenChange);

  const [measured, setMeasured] = useState<number>();
  const startedAt = useRef<number | null>(null);
  const userToggled = useRef(false);
  // Starts false so a block mounted mid-stream starts its clock too.
  const wasStreaming = useRef(false);

  useEffect(() => {
    if (streaming && !wasStreaming.current) {
      // A new thinking phase: restart the clock and reopen.
      startedAt.current = Date.now();
      userToggled.current = false;
      setMeasured(undefined);
      if (!open) setOpen(true);
    } else if (!streaming && wasStreaming.current) {
      if (startedAt.current !== null) {
        setMeasured(Math.round((Date.now() - startedAt.current) / 1000));
      }
      if (!userToggled.current && open) setOpen(false);
    }
    wasStreaming.current = streaming;
    // Only a change in `streaming` should open, close or time the block; `open`
    // and `setOpen` are read fresh from the render that changed it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const duration = durationProp ?? measured;

  return (
    <div
      data-state={open ? "open" : "closed"}
      data-streaming={streaming || undefined}
      className={cn("text-sm", className)}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => {
          userToggled.current = true;
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className={cn(streaming && "animate-pulse motion-reduce:animate-none")}>
          {label({ streaming, duration })}
        </span>
        <ChevronRightIcon className={cn("size-3.5 transition-transform", open && "rotate-90")} />
      </button>
      <div
        id={contentId}
        hidden={!open}
        className="mt-2 border-l-2 border-border pl-3 text-muted-foreground"
      >
        <StreamingText text={text} streaming={streaming} cursor={false} />
      </div>
    </div>
  );
}
