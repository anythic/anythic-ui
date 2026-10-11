import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { ChevronRightIcon } from "../icons";
import { hostname, safeHref } from "../lib/url";
import { useControllableOpen } from "../hooks/use-controllable-open";
import type { Source } from "./citation";

export interface SourcesProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Numbered in order, starting at 1, matching `[1]`-style citations. */
  sources: Source[];
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to closed. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Replaces the header text, e.g. for translation. */
  label?: (count: number) => ReactNode;
}

function defaultLabel(count: number): ReactNode {
  return count === 1 ? "1 source" : `${count} sources`;
}

/**
 * The sources behind a reply, as a collapsible numbered list. Numbers match
 * the citations `Markdown` renders when given the same `sources`.
 */
export function Sources({
  sources,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = defaultLabel,
  className,
  ...props
}: SourcesProps) {
  const listId = useId();
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  if (sources.length === 0) return null;

  return (
    <div data-state={open ? "open" : "closed"} className={cn("text-sm", className)} {...props}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {label(sources.length)}
        <ChevronRightIcon className={cn("size-3.5 transition-transform", open && "rotate-90")} />
      </button>
      <ol id={listId} hidden={!open} className="mt-2 space-y-1">
        {sources.map((source, i) => {
          const href = safeHref(source.url);
          const title = source.title || hostname(source.url);
          return (
            <li key={i} className="flex items-baseline gap-2">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {i + 1}.
              </span>
              <span className="min-w-0">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {title}
                  </a>
                ) : (
                  <span className="font-medium">{title}</span>
                )}
                <span className="ml-2 text-xs text-muted-foreground">{hostname(source.url)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
