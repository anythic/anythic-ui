import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { formatBytes } from "../lib/files";
import { CrossIcon, FileIcon } from "../icons";

/** A file that already lives somewhere, e.g. one sent in an earlier message. */
export interface Attachment {
  name: string;
  /** MIME type; `image/*` shows a thumbnail when `url` is set. */
  type?: string;
  size?: number;
  url?: string;
}

export interface AttachmentListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  /** Local `File`s (e.g. picked by the user) or already-uploaded attachments. */
  items: (File | Attachment)[];
  /** Shows a remove button on each item when given. */
  onRemove?: (index: number) => void;
  /** Replaces the remove button's label, e.g. for translation. */
  removeLabel?: (name: string) => string;
}

/** Files as compact chips: a thumbnail for images, otherwise name and size. */
export function AttachmentList({
  items,
  onRemove,
  removeLabel = (name) => `Remove ${name}`,
  className,
  ...props
}: AttachmentListProps) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} {...props}>
      {items.map((item, i) => (
        <AttachmentChip
          key={itemKey(item, i)}
          item={item}
          onRemove={onRemove && (() => onRemove(i))}
          removeLabel={removeLabel(item.name)}
        />
      ))}
    </ul>
  );
}

// Files get a stable key so removing one does not remount (and re-create
// the previews of) the ones after it.
const fileKeys = new WeakMap<File, number>();
let nextFileKey = 0;

function itemKey(item: File | Attachment, index: number): string | number {
  if (typeof File !== "undefined" && item instanceof File) {
    let key = fileKeys.get(item);
    if (key === undefined) fileKeys.set(item, (key = nextFileKey++));
    return key;
  }
  return (item as Attachment).url ?? `${item.name}-${index}`;
}

function AttachmentChip({
  item,
  onRemove,
  removeLabel,
}: {
  item: File | Attachment;
  onRemove?: () => void;
  removeLabel: string;
}) {
  const url = usePreviewUrl(item);
  const isImage = item.type?.startsWith("image/") && url;

  return (
    <li
      className={cn(
        "group/chip relative flex items-center gap-2 rounded-lg border border-border bg-background text-xs",
        isImage ? "p-0" : "py-1.5 pl-2 pr-3",
      )}
    >
      {isImage ? (
        <img src={url} alt={item.name} className="size-14 rounded-lg object-cover" />
      ) : (
        <>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileIcon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block max-w-40 truncate font-medium">{item.name}</span>
            {item.size !== undefined && (
              <span className="block text-muted-foreground">{formatBytes(item.size)}</span>
            )}
          </span>
        </>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <CrossIcon className="size-3" />
        </button>
      )}
    </li>
  );
}

/**
 * A URL to preview the item: a blob URL for a local image, revoked when the
 * chip goes away, or the attachment's own URL if it is safe to load.
 */
function usePreviewUrl(item: File | Attachment): string | undefined {
  const isFile = typeof File !== "undefined" && item instanceof File;
  const [blobUrl, setBlobUrl] = useState<string>();

  useEffect(() => {
    if (!isFile || !item.type.startsWith("image/")) return;
    const url = URL.createObjectURL(item);
    // The blob URL is an external resource: it has to be created and revoked
    // with the effect, so it cannot be derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setBlobUrl(undefined);
    };
  }, [item, isFile]);

  if (isFile) return blobUrl;
  return safeMediaUrl((item as Attachment).url);
}

/** Attachment URLs can come from a server or a model; only load ordinary ones. */
function safeMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return ["http:", "https:", "blob:"].includes(protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
