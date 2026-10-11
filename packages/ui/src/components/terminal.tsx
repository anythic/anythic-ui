import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { parseAnsi, stripAnsi, type AnsiSegment } from "../lib/ansi";
import { cn } from "../lib/cn";
import { CheckIcon, ChevronRightIcon, CopyIcon, CrossIcon, SpinnerIcon } from "../lib/icons";
import { useControllableOpen } from "../lib/use-controllable-open";
import { useCopy } from "../lib/use-copy";
import { useIsomorphicLayoutEffect } from "../lib/use-isomorphic-layout-effect";

export interface TerminalLabels {
  running: string;
  exitCode: (code: number) => string;
  copy: string;
  copied: string;
  hiddenLines: (count: number) => string;
}

export interface TerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The command that was run, shown after a `$` prompt. */
  command?: string;
  /** Everything the command printed so far, ANSI colors included. */
  output: string;
  /** Whether the command is still running. */
  running?: boolean;
  /** Exit code once finished: 0 shows as success, anything else as failure. */
  exitCode?: number;
  /** How long it took, in milliseconds. Measured automatically while `running` is observed. */
  duration?: number;
  /** Only the last this many lines render, so huge logs stay fast. Defaults to 1000. */
  maxLines?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to open. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<TerminalLabels>;
}

const DEFAULT_LABELS: TerminalLabels = {
  running: "Running",
  exitCode: (code) => `exit ${code}`,
  copy: "Copy output",
  copied: "Copied",
  hiddenLines: (count) => `${count} earlier lines not shown`,
};

/**
 * A command an agent ran and what it printed: ANSI colors, progress bars
 * that redraw their line, the exit code and how long it took. The output
 * follows new lines while it streams, unless the user scrolls up to read.
 */
export function Terminal({
  command,
  output,
  running = false,
  exitCode,
  duration: durationProp,
  maxLines = 1000,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: TerminalProps) {
  const bodyId = useId();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  const { copied, copy } = useCopy();
  const measured = useDuration(running);
  const duration = durationProp ?? measured;

  const lines = useMemo(() => parseAnsi(output), [output]);
  const hidden = Math.max(0, lines.length - maxLines);
  const shown = hidden > 0 ? lines.slice(hidden) : lines;
  const hasOutput = output !== "";

  // Follow the output while the user is at the bottom.
  const bodyRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  useIsomorphicLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [output, open]);

  const failed = exitCode !== undefined && exitCode !== 0;

  return (
    <div
      data-state={open ? "open" : "closed"}
      data-running={running || undefined}
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
          <span className="min-w-0 truncate font-mono text-xs">
            <span aria-hidden="true" className="select-none text-muted-foreground">
              ${" "}
            </span>
            {command ?? ""}
          </span>
        </button>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs",
            failed ? "text-destructive" : exitCode === 0 ? "text-success" : "text-muted-foreground",
          )}
        >
          {running ? (
            <>
              <SpinnerIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
              {labels.running}
            </>
          ) : exitCode !== undefined ? (
            <>
              {failed ? <CrossIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
              {labels.exitCode(exitCode)}
            </>
          ) : null}
        </span>
        {duration !== undefined && !running && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
        )}
        {hasOutput && (
          <button
            type="button"
            onClick={() => copy(stripAnsi(output))}
            aria-label={copied ? labels.copied : labels.copy}
            title={copied ? labels.copied : labels.copy}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          </button>
        )}
      </div>
      <div
        id={bodyId}
        ref={bodyRef}
        hidden={!open}
        onScroll={(event) => {
          const el = event.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        }}
        className="max-h-80 overflow-auto border-t border-border bg-terminal p-3 font-mono text-xs leading-5 text-terminal-foreground"
      >
        {hidden > 0 && <div className="mb-1 opacity-60">… {labels.hiddenLines(hidden)}</div>}
        {hasOutput
          ? shown.map((line, i) => (
              <div key={hidden + i} className="min-h-5 whitespace-pre-wrap break-all">
                {line.map((segment, j) => (
                  <span key={j} style={segmentStyle(segment)}>
                    {segment.text}
                  </span>
                ))}
              </div>
            ))
          : running && (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-current motion-reduce:animate-none"
              />
            )}
      </div>
    </div>
  );
}

function segmentStyle({ style }: AnsiSegment): CSSProperties | undefined {
  if (Object.keys(style).length === 0) return undefined;
  const color = style.inverse ? (style.background ?? "var(--terminal)") : style.color;
  const background = style.inverse
    ? (style.color ?? "var(--terminal-foreground)")
    : style.background;
  return {
    color,
    backgroundColor: background,
    fontWeight: style.bold ? 600 : undefined,
    opacity: style.dim ? 0.7 : undefined,
    fontStyle: style.italic ? "italic" : undefined,
    textDecoration: style.underline ? "underline" : undefined,
  };
}

/** Milliseconds between `running` turning on and off, once it has. */
function useDuration(running: boolean): number | undefined {
  const [duration, setDuration] = useState<number>();
  const startedAt = useRef<number | null>(null);
  const wasRunning = useRef(false);
  useEffect(() => {
    if (running && !wasRunning.current) {
      startedAt.current = Date.now();
      setDuration(undefined);
    } else if (!running && wasRunning.current && startedAt.current !== null) {
      setDuration(Date.now() - startedAt.current);
    }
    wasRunning.current = running;
  }, [running]);
  return duration;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}
