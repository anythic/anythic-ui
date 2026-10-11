import { useId, useState, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface ContextUsageBreakdown {
  input?: number;
  output?: number;
  reasoning?: number;
  cachedInput?: number;
}

export interface ContextUsageLabels {
  title: string;
  /** Spoken and shown summary, e.g. "45.2K of 200K tokens". */
  summary: (used: string, limit: string) => string;
  input: string;
  output: string;
  reasoning: string;
  cachedInput: string;
  cost: string;
}

export interface ContextUsageProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Tokens currently in the context window. */
  used: number;
  /** The model's context window, in tokens. */
  limit: number;
  /** Where the tokens went, shown in the details. Only given entries show. */
  breakdown?: ContextUsageBreakdown;
  /** What the conversation has cost so far, in `currency`. */
  cost?: number;
  /** ISO currency code for `cost`. Defaults to USD. */
  currency?: string;
  /** Locale for numbers and money, e.g. `uz-UZ`. Defaults to the browser's. */
  locale?: string;
  /** Share of the window (0 to 1) from which the meter turns to a warning. Defaults to 0.8. */
  warnAt?: number;
  /** Share of the window from which the meter turns to danger. Defaults to 0.95. */
  dangerAt?: number;
  /** Which side of the meter the details open on. Defaults to top. */
  side?: "top" | "bottom";
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<ContextUsageLabels>;
}

const DEFAULT_LABELS: ContextUsageLabels = {
  title: "Context window",
  summary: (used, limit) => `${used} of ${limit} tokens`,
  input: "Input",
  output: "Output",
  reasoning: "Reasoning",
  cachedInput: "Cached input",
  cost: "Cost",
};

const BREAKDOWN_KEYS = ["input", "cachedInput", "output", "reasoning"] as const;

/**
 * How full the model's context window is: a small ring and percentage that
 * open into details (tokens by kind, and cost) on hover or keyboard focus,
 * or stay open after a click or tap.
 * It turns to a warning, then danger, as the window fills.
 */
export function ContextUsage({
  used,
  limit,
  breakdown,
  cost,
  currency = "USD",
  locale,
  warnAt = 0.8,
  dangerAt = 0.95,
  side = "top",
  labels: labelsProp,
  className,
  ...props
}: ContextUsageProps) {
  const detailsId = useId();
  // Hover and focus show the details; a click pins them open, which is how
  // touch screens, with no hover, get to see them.
  const [pinned, setPinned] = useState(false);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const share = limit > 0 ? Math.min(1, Math.max(0, used / limit)) : 0;
  const percent = Math.round(share * 100);
  const level = share >= dangerAt ? "danger" : share >= warnAt ? "warning" : "normal";

  const tokens = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const summary = labels.summary(tokens.format(used), tokens.format(limit));
  const money =
    cost === undefined
      ? undefined
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          // Agent turns often cost fractions of a cent; keep them visible.
          maximumFractionDigits: cost > 0 && cost < 1 ? 4 : 2,
        }).format(cost);

  const tone = {
    normal: "text-foreground",
    warning: "text-warning",
    danger: "text-destructive",
  }[level];
  const barTone = { normal: "bg-foreground", warning: "bg-warning", danger: "bg-destructive" }[
    level
  ];
  const rows = BREAKDOWN_KEYS.filter((key) => breakdown?.[key] !== undefined);

  return (
    <span className={cn("group/usage relative inline-flex", className)} {...props}>
      <button
        type="button"
        aria-label={`${labels.title}: ${summary}, ${percent}%`}
        aria-expanded={pinned}
        aria-controls={detailsId}
        onClick={() => setPinned(!pinned)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPinned(false);
        }}
        data-level={level}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs tabular-nums text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 -rotate-90">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            strokeWidth="2"
            className="stroke-current opacity-20"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${percent} 100`}
            className={cn("stroke-current", tone)}
          />
        </svg>
        <span className={cn(level !== "normal" && tone)}>{percent}%</span>
      </button>
      <span
        id={detailsId}
        className={cn(
          pinned ? "block" : "hidden",
          "pointer-events-none absolute right-0 z-10 w-64 rounded-lg border border-border bg-background p-3 text-left text-xs text-foreground shadow-lg group-focus-within/usage:block group-hover/usage:block",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{labels.title}</span>
          <span className={cn("tabular-nums", level !== "normal" && tone)}>{percent}%</span>
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className={cn("block h-full rounded-full", barTone)}
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="mt-1.5 block text-muted-foreground">{summary}</span>
        {(rows.length > 0 || money !== undefined) && (
          <span className="mt-3 block space-y-1 border-t border-border pt-2">
            {rows.map((key) => (
              <span key={key} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{labels[key]}</span>
                <span className="tabular-nums">{tokens.format(breakdown![key]!)}</span>
              </span>
            ))}
            {money !== undefined && (
              <span className="flex justify-between gap-2">
                <span className="text-muted-foreground">{labels.cost}</span>
                <span className="tabular-nums">{money}</span>
              </span>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
