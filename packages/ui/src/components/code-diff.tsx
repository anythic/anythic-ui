import { useId, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { diffLines, foldContext, parsePatch, type DiffLine, type DiffRow } from "../lib/diff";
import { CheckIcon, ChevronRightIcon, CrossIcon, SpinnerIcon } from "../icons";
import { useControllableOpen } from "../hooks/use-controllable-open";

export type CodeDiffStatus = "pending" | "accepted" | "rejected";

export interface CodeDiffLabels {
  accept: string;
  reject: string;
  accepted: string;
  rejected: string;
  added: string;
  removed: string;
  /** Text of a folded run of unchanged lines. */
  unchanged: (count: number) => string;
  /** Text of a region a patch leaves out. */
  omitted: string;
}

export interface CodeDiffProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The file before the change. Pair with `newCode`, or pass `patch` instead. */
  oldCode?: string;
  /** The file after the change. */
  newCode?: string;
  /** A unified diff (`git diff` output) for one file, used when `oldCode`/`newCode` are not given. */
  patch?: string;
  /** Shown in the header, e.g. `src/auth.ts`. */
  filename?: string;
  /** Unchanged lines kept around each change; longer runs fold. Defaults to 3. */
  contextLines?: number;
  /** Where the user's review stands. Accept/reject buttons show while `"pending"`. */
  status?: CodeDiffStatus;
  /** Called by the accept button. A returned promise disables both buttons until it settles. */
  onAccept?: () => void | Promise<void>;
  /** Called by the reject button. Same promise handling as `onAccept`. */
  onReject?: () => void | Promise<void>;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to open. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<CodeDiffLabels>;
}

const DEFAULT_LABELS: CodeDiffLabels = {
  accept: "Accept",
  reject: "Reject",
  accepted: "Accepted",
  rejected: "Rejected",
  added: "Added",
  removed: "Removed",
  unchanged: (count) => `${count} unchanged lines`,
  omitted: "Unchanged lines omitted",
};

/**
 * A file change an agent made, line by line: removals in red, additions in
 * green, with old and new line numbers. Long unchanged stretches fold and
 * expand on click. Optional accept and reject buttons let the user review it.
 */
export function CodeDiff({
  oldCode,
  newCode,
  patch,
  filename,
  contextLines = 3,
  status,
  onAccept,
  onReject,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: CodeDiffProps) {
  const bodyId = useId();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);

  const rows = useMemo(() => {
    if (oldCode !== undefined || newCode !== undefined) {
      return foldContext(diffLines(oldCode ?? "", newCode ?? ""), contextLines);
    }
    return patch ? parsePatch(patch) : [];
  }, [oldCode, newCode, patch, contextLines]);

  // Expanded gaps belong to one set of rows; new input starts folded again.
  const [expanded, setExpanded] = useState<{ rows: DiffRow[]; gaps: Set<number> }>({
    rows,
    gaps: new Set(),
  });
  const expandedGaps = expanded.rows === rows ? expanded.gaps : new Set<number>();

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    const count = (line: DiffLine) => {
      if (line.type === "add") added++;
      else if (line.type === "remove") removed++;
    };
    for (const row of rows) {
      if (row.type !== "gap") count(row);
    }
    return { added, removed };
  }, [rows]);

  const decide = (choice: "accept" | "reject") => {
    const result = (choice === "accept" ? onAccept : onReject)?.();
    if (!result) return;
    setBusy(choice);
    // A rejection still surfaces to the caller; the buttons come back for a retry.
    void Promise.resolve(result).finally(() => setBusy(null));
  };

  const showButtons = status === "pending" && (onAccept || onReject);

  return (
    <div
      data-state={open ? "open" : "closed"}
      data-status={status}
      className={cn("overflow-hidden rounded-lg border border-border text-sm", className)}
      {...props}
    >
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          <span className="min-w-0 truncate font-mono text-xs font-medium">
            {filename ?? "Changes"}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums">
            <span className="text-success">+{stats.added}</span>{" "}
            <span className="text-destructive">−{stats.removed}</span>
          </span>
        </button>
        {showButtons ? (
          <span className="flex shrink-0 gap-1.5">
            {onReject && (
              <ReviewButton
                busy={busy === "reject"}
                disabled={busy !== null}
                onClick={() => decide("reject")}
              >
                {labels.reject}
              </ReviewButton>
            )}
            {onAccept && (
              <ReviewButton
                primary
                busy={busy === "accept"}
                disabled={busy !== null}
                onClick={() => decide("accept")}
              >
                {labels.accept}
              </ReviewButton>
            )}
          </span>
        ) : status === "accepted" || status === "rejected" ? (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs font-medium",
              status === "accepted" ? "text-success" : "text-muted-foreground",
            )}
          >
            {status === "accepted" ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <CrossIcon className="size-3.5" />
            )}
            {status === "accepted" ? labels.accepted : labels.rejected}
          </span>
        ) : null}
      </div>
      <div id={bodyId} hidden={!open} className="overflow-x-auto border-t border-border">
        <div className="w-max min-w-full py-1 font-mono text-xs leading-5">
          {rows.map((row, i) =>
            row.type === "gap" ? (
              row.lines && expandedGaps.has(i) ? (
                row.lines.map((line, j) => <Line key={`${i}-${j}`} line={line} labels={labels} />)
              ) : (
                <GapRow
                  key={i}
                  label={row.lines ? labels.unchanged(row.lines.length) : labels.omitted}
                  onExpand={
                    row.lines && (() => setExpanded({ rows, gaps: new Set(expandedGaps).add(i) }))
                  }
                />
              )
            ) : (
              <Line key={i} line={row} labels={labels} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ line, labels }: { line: DiffLine; labels: CodeDiffLabels }) {
  const oldNumber = line.type === "add" ? "" : line.oldNumber;
  const newNumber = line.type === "remove" ? "" : line.newNumber;
  return (
    <div
      data-type={line.type}
      className={cn(
        "flex",
        line.type === "add" && "bg-success/10",
        line.type === "remove" && "bg-destructive/10",
      )}
    >
      <span
        aria-hidden="true"
        className="w-10 shrink-0 select-none pr-2 text-right text-muted-foreground/70"
      >
        {oldNumber}
      </span>
      <span
        aria-hidden="true"
        className="w-10 shrink-0 select-none pr-2 text-right text-muted-foreground/70"
      >
        {newNumber}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "w-5 shrink-0 select-none text-center",
          line.type === "add" && "text-success",
          line.type === "remove" && "text-destructive",
        )}
      >
        {line.type === "add" ? "+" : line.type === "remove" ? "−" : ""}
      </span>
      <span className="whitespace-pre pr-4">
        {line.type !== "context" && (
          <span className="sr-only">{line.type === "add" ? labels.added : labels.removed}: </span>
        )}
        {line.text}
      </span>
    </div>
  );
}

function GapRow({ label, onExpand }: { label: string; onExpand?: () => void }) {
  const className =
    "flex w-full items-center gap-2 bg-muted/40 py-0.5 pl-[6.25rem] text-left text-muted-foreground";
  return onExpand ? (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        className,
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring",
      )}
    >
      <span aria-hidden="true">⋯</span> {label}
    </button>
  ) : (
    <div className={className}>
      <span aria-hidden="true">⋯</span> {label}
    </div>
  );
}

function ReviewButton({
  primary,
  busy,
  children,
  ...props
}: {
  primary?: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-busy={busy}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
      )}
      {...props}
    >
      {busy && <SpinnerIcon className="size-3 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}
