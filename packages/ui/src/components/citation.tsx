import { useId, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { hostname, safeHref } from "../lib/url";

/** Something the model drew on: a web page, a document, a search result. */
export interface Source {
  url: string;
  title?: string;
  /** A short excerpt, shown in the citation's preview. */
  snippet?: string;
}

export interface CitationProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  source: Source;
  /** The source's number, shown in the chip. */
  index: number;
}

/**
 * An inline reference to a source, such as the `[1]` after a claim. It links
 * to the source, and shows a preview card on hover and on keyboard focus.
 */
export function Citation({ source, index, className, ...props }: CitationProps) {
  const previewId = useId();
  const href = safeHref(source.url);
  const site = hostname(source.url);
  const chipClass =
    "inline-flex h-[1.4em] min-w-[1.4em] items-center justify-center rounded-md bg-muted px-1 align-[0.1em] text-[0.7em] font-medium tabular-nums text-muted-foreground no-underline";

  return (
    <span className={cn("group/cite relative mx-0.5 inline-block", className)} {...props}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-describedby={previewId}
          className={cn(
            chipClass,
            "hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring",
          )}
        >
          {index}
        </a>
      ) : (
        // No safe link to follow, but still focusable so keyboard users get the preview.
        <button
          type="button"
          aria-describedby={previewId}
          className={cn(chipClass, "focus-visible:outline-2 focus-visible:outline-ring")}
        >
          {index}
        </button>
      )}
      <span
        id={previewId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-72 -translate-x-1/2 rounded-lg border border-border bg-background p-3 text-left text-sm font-normal leading-snug text-foreground shadow-lg group-focus-within/cite:block group-hover/cite:block"
      >
        <span className="block text-xs text-muted-foreground">{site}</span>
        {source.title && <span className="mt-0.5 block font-medium">{source.title}</span>}
        {source.snippet && (
          <span className="mt-1 line-clamp-3 block text-muted-foreground">{source.snippet}</span>
        )}
      </span>
    </span>
  );
}
