import {
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import { ArrowUpIcon, StopIcon } from "../lib/icons";
import { useIsomorphicLayoutEffect } from "../lib/use-isomorphic-layout-effect";

export interface PromptInputLabels {
  placeholder: string;
  send: string;
  stop: string;
}

export interface PromptInputProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "defaultValue" | "onChange" | "onSubmit" | "placeholder" | "className"
  > {
  /** Controlled text. Pair with `onValueChange`; you clear it after submit. */
  value?: string;
  /** Initial text when uncontrolled. Uncontrolled input clears on submit. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Called with the trimmed text on Enter or the send button. If it returns
   * a promise that rejects, uncontrolled input gets the text back so the
   * message is not lost, and the rejection still propagates.
   */
  onSubmit: (value: string) => void | Promise<void>;
  /** While true, the send button becomes a stop button and Enter does not send. */
  streaming?: boolean;
  /** Called by the stop button while streaming. */
  onStop?: () => void;
  /** Extra controls next to the send button, such as an attach button. */
  actions?: ReactNode;
  /** Classes for the outer container. */
  className?: string;
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<PromptInputLabels>;
}

const DEFAULT_LABELS: PromptInputLabels = {
  placeholder: "Send a message…",
  send: "Send",
  stop: "Stop",
};

/**
 * The box a user types prompts into. Enter sends, Shift+Enter adds a line,
 * and the box grows with its content up to a limit. While a reply streams,
 * the send button turns into a stop button.
 */
export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  actions,
  disabled = false,
  className,
  labels: labelsProp,
  onKeyDown,
  ...props
}: PromptInputProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;

  const setValue = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  // Grow with the content; max-h on the textarea caps it and scrolls.
  useIsomorphicLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const canSend = !disabled && !streaming && value.trim() !== "";

  const submit = () => {
    if (!canSend) return;
    const text = value.trim();
    if (valueProp === undefined) setUncontrolled("");
    const result = onSubmit(text);
    if (result && valueProp === undefined) {
      void Promise.resolve(result).catch((error: unknown) => {
        // Give the text back unless the user has already typed something new,
        // then let the failure surface as it would have without us.
        setUncontrolled((current) => (current === "" ? value : current));
        throw error;
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // isComposing: Enter confirms an IME candidate rather than sending.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      data-streaming={streaming || undefined}
      className={cn(
        "flex items-end gap-2 rounded-xl border border-zinc-300 bg-white p-2 shadow-sm focus-within:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-500",
        disabled && "opacity-60",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={labels.placeholder}
        aria-label={props["aria-label"] ?? labels.placeholder}
        className="max-h-60 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
        {...props}
      />
      {actions}
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label={labels.stop}
          title={labels.stop}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <StopIcon className="size-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label={labels.send}
          title={labels.send}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
        >
          <ArrowUpIcon className="size-4" />
        </button>
      )}
    </form>
  );
}
