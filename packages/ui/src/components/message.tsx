import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { CheckIcon, CopyIcon } from "../icons";
import { useCopy } from "../hooks/use-copy";

export type MessageFrom = "user" | "assistant";

export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  /** Who wrote it. User messages sit in a bubble on the right. */
  from: MessageFrom;
  /** Controls under the message, such as `MessageCopyButton`. */
  actions?: ReactNode;
}

/**
 * One turn in a conversation. Put anything inside: `Markdown`,
 * `ReasoningBlock`, `ToolCall` and friends compose freely.
 */
export function Message({ from, actions, className, children, ...props }: MessageProps) {
  const isUser = from === "user";
  return (
    <div
      data-from={from}
      className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start", className)}
      {...props}
    >
      <div
        className={cn(
          "min-w-0 text-sm",
          isUser
            ? "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-3.5 py-2"
            : "w-full space-y-3",
        )}
      >
        {children}
      </div>
      {actions != null && (
        <div className={cn("flex items-center gap-0.5", !isUser && "-ml-1.5")}>{actions}</div>
      )}
    </div>
  );
}

export interface MessageActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name and tooltip, since the button usually shows only an icon. */
  label: string;
}

/** An icon button for a message's `actions`, e.g. retry or feedback. */
export function MessageAction({ label, className, children, ...props }: MessageActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface MessageCopyButtonProps extends Omit<
  MessageActionProps,
  "label" | "onClick" | "children"
> {
  /** The text to copy, usually the message's markdown source. */
  text: string;
  /** Replaces the built-in text, e.g. for translation. */
  labels?: Partial<{ copy: string; copied: string }>;
}

/** Copies a message's text, confirming with a check mark. */
export function MessageCopyButton({ text, labels, ...props }: MessageCopyButtonProps) {
  const { copied, copy } = useCopy();
  const label = copied ? (labels?.copied ?? "Copied") : (labels?.copy ?? "Copy");
  return (
    <MessageAction label={label} onClick={() => copy(text)} {...props}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </MessageAction>
  );
}
