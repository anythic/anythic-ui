import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatValue } from "../lib/format-value";
import { CheckIcon, CrossIcon, SpinnerIcon } from "../lib/icons";

export type ToolApprovalStatus = "pending" | "approved" | "denied";

export interface ToolApprovalLabels {
  heading: string;
  approve: string;
  deny: string;
  approved: string;
  denied: string;
}

export interface ToolApprovalProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "title"
> {
  /** The tool's name as the model called it, e.g. `delete_file`. */
  name: string;
  /** Whether the user has decided yet. You own this state. */
  status: ToolApprovalStatus;
  /** Human-friendly summary of the action, e.g. "Delete report.pdf". */
  title?: ReactNode;
  /** Why the agent wants this, or what could go wrong. */
  description?: ReactNode;
  /** Arguments the model passed. Strings show as-is, the rest as JSON. */
  input?: unknown;
  /**
   * Called when the user approves. If it returns a promise, both buttons
   * stay disabled until it settles, so a slow request cannot be sent twice.
   */
  onApprove?: () => void | Promise<void>;
  /** Called when the user denies. Same promise handling as `onApprove`. */
  onDeny?: () => void | Promise<void>;
  /** Marks the action as dangerous, giving the approve button a warning style. */
  destructive?: boolean;
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<ToolApprovalLabels>;
}

const DEFAULT_LABELS: ToolApprovalLabels = {
  heading: "Approval needed",
  approve: "Approve",
  deny: "Deny",
  approved: "Approved",
  denied: "Denied",
};

/**
 * Asks the user to approve or deny a tool call before the agent runs it.
 * After a decision, the buttons give way to the outcome.
 */
export function ToolApproval({
  name,
  status,
  title,
  description,
  input,
  onApprove,
  onDeny,
  destructive = false,
  labels: labelsProp,
  className,
  ...props
}: ToolApprovalProps) {
  const headingId = useId();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);

  const decide = (choice: "approve" | "deny") => {
    const result = (choice === "approve" ? onApprove : onDeny)?.();
    if (!result) return;
    setBusy(choice);
    // A rejection still surfaces to the caller as an unhandled error;
    // the buttons just come back so the user can retry.
    void Promise.resolve(result).finally(() => setBusy(null));
  };

  const pending = status === "pending";

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-status={status}
      className={cn(
        "rounded-lg border p-3 text-sm",
        pending
          ? "border-amber-300 bg-amber-50/50 dark:border-amber-700/60 dark:bg-amber-950/20"
          : "border-zinc-200 dark:border-zinc-800",
        className,
      )}
      {...props}
    >
      <div id={headingId}>
        {pending && (
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-500">
            {labels.heading}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 font-medium">{title ?? name}</span>
          {title != null && (
            <code className="hidden font-mono text-xs text-zinc-500 sm:inline">{name}</code>
          )}
        </div>
      </div>
      {description != null && (
        <div className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</div>
      )}
      {input !== undefined && (
        <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900">
          {formatValue(input)}
        </div>
      )}
      {pending ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            aria-busy={busy === "approve"}
            onClick={() => decide("approve")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60",
              destructive
                ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
                : "bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
            )}
          >
            {busy === "approve" && <BusyIcon />}
            {labels.approve}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            aria-busy={busy === "deny"}
            onClick={() => decide("deny")}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {busy === "deny" && <BusyIcon />}
            {labels.deny}
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "mt-3 flex items-center gap-1.5 font-medium",
            status === "approved"
              ? "text-emerald-700 dark:text-emerald-500"
              : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {status === "approved" ? (
            <CheckIcon className="size-4" />
          ) : (
            <CrossIcon className="size-4" />
          )}
          {status === "approved" ? labels.approved : labels.denied}
        </div>
      )}
    </div>
  );
}

function BusyIcon() {
  return <SpinnerIcon className="size-3.5 animate-spin motion-reduce:animate-none" />;
}
