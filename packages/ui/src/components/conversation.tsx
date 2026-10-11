import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { ArrowDownIcon } from "../lib/icons";
import { useIsomorphicLayoutEffect } from "../lib/use-isomorphic-layout-effect";

export interface ConversationProps extends HTMLAttributes<HTMLDivElement> {
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<{ scrollToBottom: string }>;
}

/** How close to the bottom, in pixels, still counts as "at the bottom". */
const BOTTOM_THRESHOLD = 40;

/**
 * A scrolling list of messages that follows new content while the user is
 * at the bottom, and stops following the moment they scroll up to read,
 * offering a button to jump back down. Give it a height (for example
 * `h-[600px]` or `flex-1` in a flex column); it scrolls inside that.
 */
export function Conversation({ labels, className, children, ...props }: ConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The ref is what the observer reads; the state only drives the button.
  const stuckRef = useRef(true);
  const [stuck, setStuck] = useState(true);
  const lastScrollTop = useRef(0);

  const setStuckTo = (value: boolean) => {
    stuckRef.current = value;
    setStuck(value);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useIsomorphicLayoutEffect(() => {
    scrollToBottom();
  }, []);

  // Follow content as it grows, e.g. while a reply streams in.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stuckRef.current) scrollToBottom();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const movedUp = el.scrollTop < lastScrollTop.current;
    lastScrollTop.current = el.scrollTop;

    if (movedUp && distance > 1) {
      // Only an upward scroll unsticks: we only ever scroll down, so this is
      // the user, and even a small nudge means they want to stay put. (When
      // content shrinks, the browser also moves scrollTop up, but leaves it
      // at the bottom; distance > 1 tells the two apart.)
      if (stuckRef.current) setStuckTo(false);
    } else if (distance <= BOTTOM_THRESHOLD) {
      if (!stuckRef.current) setStuckTo(true);
    }
  };

  const jumpToBottom = () => {
    // A smooth scroll only moves down, so it never trips the unstick check.
    setStuckTo(true);
    scrollToBottom("smooth");
  };

  return (
    <div className={cn("relative min-h-0", className)} {...props}>
      <div ref={scrollRef} role="log" onScroll={handleScroll} className="h-full overflow-y-auto">
        <div ref={contentRef} className="flex flex-col gap-6 p-4">
          {children}
        </div>
      </div>
      {!stuck && (
        <button
          type="button"
          onClick={jumpToBottom}
          aria-label={labels?.scrollToBottom ?? "Scroll to bottom"}
          title={labels?.scrollToBottom ?? "Scroll to bottom"}
          className="absolute bottom-3 left-1/2 inline-flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md hover:text-zinc-900 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <ArrowDownIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
