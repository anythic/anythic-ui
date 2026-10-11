import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatValue } from "../lib/format-value";
import { CheckIcon, ChevronRightIcon, CircleIcon, CrossIcon, SpinnerIcon } from "../lib/icons";
import { useControllableOpen } from "../lib/use-controllable-open";

export type ToolCallStatus = "pending" | "running" | "success" | "error";

export interface ToolCallProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  /** The tool's name as the model called it, e.g. `web_search`. */
  name: string;
  status: ToolCallStatus;
  /** Human-friendly header, e.g. "Searching the web". Defaults to `name`. */
  title?: ReactNode;
  /** Arguments the model passed. Strings show as-is, the rest as JSON. */
  input?: unknown;
  /** What the tool returned. Strings show as-is, the rest as JSON. */
  output?: unknown;
  /** Shown instead of the output when `status` is `"error"`. */
  error?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to closed. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Screen-reader text for each status, e.g. for translation. */
  statusLabels?: Partial<Record<ToolCallStatus, string>>;
}

const DEFAULT_STATUS_LABELS: Record<ToolCallStatus, string> = {
  pending: "Pending",
  running: "Running",
  success: "Done",
  error: "Failed",
};

const STATUS_ICONS: Record<ToolCallStatus, ReactNode> = {
  pending: <CircleIcon className="size-4 text-zinc-400" />,
  running: <SpinnerIcon className="size-4 animate-spin text-zinc-500 motion-reduce:animate-none" />,
  success: <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-500" />,
  error: <CrossIcon className="size-4 text-red-600 dark:text-red-500" />,
};

/**
 * One tool call made by an agent: its status in the header, with the input
 * and output (or error) behind a disclosure.
 */
export function ToolCall({
  name,
  status,
  title,
  input,
  output,
  error,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  statusLabels,
  className,
  ...props
}: ToolCallProps) {
  const contentId = useId();
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  const statusLabel = { ...DEFAULT_STATUS_LABELS, ...statusLabels }[status];
  const showError = status === "error" && error != null;
  const showOutput = !showError && output !== undefined;
  const hasDetails = input !== undefined || showError || showOutput;

  const header = (
    <>
      {STATUS_ICONS[status]}
      <span className="sr-only">{statusLabel}:</span>
      <span className="min-w-0 flex-1 truncate font-medium">{title ?? name}</span>
      {title != null && (
        <code className="hidden font-mono text-xs text-zinc-500 sm:inline">{name}</code>
      )}
    </>
  );
  const headerClass = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left";

  return (
    <div
      data-state={open ? "open" : "closed"}
      data-status={status}
      className={cn("rounded-lg border border-zinc-200 text-sm dark:border-zinc-800", className)}
      {...props}
    >
      {hasDetails ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen(!open)}
          className={cn(
            headerClass,
            "hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-zinc-900",
          )}
        >
          {header}
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 text-zinc-500 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
      ) : (
        <div className={headerClass}>{header}</div>
      )}
      {hasDetails && (
        <div
          id={contentId}
          hidden={!open}
          className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800"
        >
          {input !== undefined && <Section label="Input">{formatValue(input)}</Section>}
          {showError && (
            <Section label="Error" tone="error">
              {error}
            </Section>
          )}
          {showOutput && <Section label="Output">{formatValue(output)}</Section>}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: "error";
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={cn(
          "max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-50 p-2 font-mono text-xs dark:bg-zinc-900",
          tone === "error" && "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
        )}
      >
        {children}
      </div>
    </div>
  );
}
