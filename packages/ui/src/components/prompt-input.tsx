import {
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import { checkFiles, type FileRejection, type FileRules } from "../lib/files";
import { ArrowUpIcon, PaperclipIcon, StopIcon } from "../icons";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { AttachmentList } from "./attachments";

export interface PromptInputLabels {
  placeholder: string;
  send: string;
  stop: string;
  attach: string;
  dropFiles: string;
  removeAttachment: (name: string) => string;
}

export interface PromptInputAttachmentOptions extends FileRules {
  /** Called with files that were dropped, pasted or picked but broke a rule. */
  onReject?: (rejections: FileRejection[]) => void;
}

export interface PromptInputProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange" | "onSubmit" | "placeholder" | "className"
> {
  /** Controlled text. Pair with `onValueChange`; you clear it after submit. */
  value?: string;
  /** Initial text when uncontrolled. Uncontrolled input clears on submit. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Called with the trimmed text and any attached files on Enter or the send
   * button. If it returns a promise that rejects, the files (and uncontrolled
   * text) come back so nothing is lost, and the rejection still propagates.
   */
  onSubmit: (value: string, files: File[]) => void | Promise<void>;
  /**
   * Lets the user attach files: an attach button, dropping files on the box,
   * and pasting images. Pass rules such as `{ accept: "image/*", maxFiles: 4 }`
   * to limit what is allowed.
   */
  attachments?: boolean | PromptInputAttachmentOptions;
  /** While true, the send button becomes a stop button and Enter does not send. */
  streaming?: boolean;
  /** Called by the stop button while streaming. */
  onStop?: () => void;
  /** Extra controls next to the send button. */
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
  attach: "Attach files",
  dropFiles: "Drop files to attach",
  removeAttachment: (name) => `Remove ${name}`,
};

/**
 * The box a user types prompts into. Enter sends, Shift+Enter adds a line,
 * and the box grows with its content up to a limit. While a reply streams,
 * the send button turns into a stop button. With `attachments`, files can
 * be picked, dropped or pasted, and show as chips above the text.
 */
export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  attachments,
  streaming = false,
  onStop,
  actions,
  disabled = false,
  className,
  labels: labelsProp,
  onKeyDown,
  onPaste,
  ...props
}: PromptInputProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const fileOptions: PromptInputAttachmentOptions | undefined =
    attachments === true ? {} : attachments || undefined;
  const canAttach = fileOptions !== undefined && !disabled;

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

  const addFiles = (incoming: File[]) => {
    if (!fileOptions || disabled || incoming.length === 0) return;
    const { accepted, rejected } = checkFiles(incoming, files.length, fileOptions);
    if (accepted.length > 0) setFiles((current) => [...current, ...accepted]);
    if (rejected.length > 0) fileOptions.onReject?.(rejected);
  };

  const canSend = !disabled && !streaming && (value.trim() !== "" || files.length > 0);

  const submit = () => {
    if (!canSend) return;
    const text = value.trim();
    const sentFiles = files;
    if (valueProp === undefined) setUncontrolled("");
    setFiles([]);
    const result = onSubmit(text, sentFiles);
    if (result) {
      void Promise.resolve(result).catch((error: unknown) => {
        // Give the message back unless the user has already started a new
        // one, then let the failure surface as it would have without us.
        if (valueProp === undefined)
          setUncontrolled((current) => (current === "" ? value : current));
        setFiles((current) => (current.length === 0 ? sentFiles : current));
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

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented || !canAttach) return;
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length === 0) return;
    addFiles(pasted);
    // Keep any text that came along (e.g. copied from a document); only a
    // bare file paste should leave the text box untouched.
    if (!event.clipboardData.getData("text/plain")) event.preventDefault();
  };

  const isFileDrag = (event: DragEvent) =>
    canAttach && Array.from(event.dataTransfer.types).includes("Files");

  // Enter/leave fire for every child the pointer crosses, so count depth
  // rather than toggling, or the overlay flickers.
  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLFormElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLFormElement>) => {
      if (isFileDrag(event)) event.preventDefault();
    },
    onDragLeave: (event: DragEvent<HTMLFormElement>) => {
      if (!isFileDrag(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (event: DragEvent<HTMLFormElement>) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      addFiles(Array.from(event.dataTransfer.files));
    },
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      {...dragHandlers}
      data-streaming={streaming || undefined}
      data-dragging={dragging || undefined}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-border bg-background p-2 shadow-sm focus-within:border-ring",
        disabled && "opacity-60",
        className,
      )}
    >
      {files.length > 0 && (
        <AttachmentList
          items={files}
          onRemove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
          removeLabel={labels.removeAttachment}
          className="px-1 pt-1"
        />
      )}
      <div className="flex items-end gap-2">
        {fileOptions && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAttach}
              aria-label={labels.attach}
              title={labels.attach}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
            >
              <PaperclipIcon className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              tabIndex={-1}
              accept={fileOptions.accept}
              multiple={fileOptions.maxFiles !== 1}
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                // Allow picking the same file again after removing it.
                event.target.value = "";
              }}
            />
          </>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={labels.placeholder}
          aria-label={props["aria-label"] ?? labels.placeholder}
          className="max-h-60 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          {...props}
        />
        {actions}
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={labels.stop}
            title={labels.stop}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <StopIcon className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={labels.send}
            title={labels.send}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        )}
      </div>
      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-ring bg-background/90 text-sm font-medium text-muted-foreground">
          {labels.dropFiles}
        </div>
      )}
    </form>
  );
}
