import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { CheckIcon, ChevronRightIcon, CircleIcon, CrossIcon, SpinnerIcon } from "../icons";
import { useControllableOpen } from "../hooks/use-controllable-open";

/** Matches the todo states agents commonly report, plus `failed`. */
export type PlanTaskStatus = "pending" | "in_progress" | "completed" | "failed";

export interface PlanTask {
  /** Stable key; falls back to the position. */
  id?: string;
  title: ReactNode;
  status: PlanTaskStatus;
  /** Extra detail under the title, e.g. which file or why it failed. */
  description?: ReactNode;
}

export interface PlanProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  tasks: PlanTask[];
  /** What the plan is for, e.g. "Fix the login bug". */
  title?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to open. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Replaces the progress text, e.g. for translation. */
  progressLabel?: (completed: number, total: number) => ReactNode;
  /** Screen-reader text for each status, e.g. for translation. */
  statusLabels?: Partial<Record<PlanTaskStatus, string>>;
}

const DEFAULT_STATUS_LABELS: Record<PlanTaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_ICONS: Record<PlanTaskStatus, ReactNode> = {
  pending: <CircleIcon className="size-4 text-muted-foreground" />,
  in_progress: (
    <SpinnerIcon className="size-4 animate-spin text-foreground motion-reduce:animate-none" />
  ),
  completed: <CheckIcon className="size-4 text-success" />,
  failed: <CrossIcon className="size-4 text-destructive" />,
};

function defaultProgressLabel(completed: number, total: number): ReactNode {
  return `${completed} of ${total} done`;
}

/**
 * An agent's plan as a checklist: what is done, what it is working on, and
 * what comes next, with overall progress in the header.
 */
export function Plan({
  tasks,
  title,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  progressLabel = defaultProgressLabel,
  statusLabels,
  className,
  ...props
}: PlanProps) {
  const listId = useId();
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  if (tasks.length === 0) return null;

  const labels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };
  const completed = tasks.filter((task) => task.status === "completed").length;

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn("rounded-lg border border-border text-sm", className)}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1 truncate font-medium">{title ?? "Plan"}</span>
        {/* Announced politely, so progress is heard without reading every step. */}
        <span aria-live="polite" className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {progressLabel(completed, tasks.length)}
        </span>
        {/* Decorative: the text beside it already says the same. */}
        <span
          aria-hidden="true"
          className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:block"
        >
          <span
            className="block h-full rounded-full bg-success transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${(completed / tasks.length) * 100}%` }}
          />
        </span>
        <ChevronRightIcon
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      <ol id={listId} hidden={!open} className="space-y-2 border-t border-border px-3 py-3">
        {tasks.map((task, i) => (
          <li key={task.id ?? i} data-status={task.status} className="flex gap-2.5">
            <span className="mt-0.5 shrink-0">{STATUS_ICONS[task.status]}</span>
            <span className="min-w-0">
              <span className="sr-only">{labels[task.status]}: </span>
              <span
                className={cn(
                  task.status === "completed" && "text-muted-foreground line-through",
                  task.status === "in_progress" && "font-medium",
                  task.status === "failed" && "text-destructive",
                )}
              >
                {task.title}
              </span>
              {task.description != null && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {task.description}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
