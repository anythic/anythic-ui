import { useEffect, useState } from "react";

/** Anything that yields text chunks: an async generator, or a fetch body. */
export type TextStreamSource =
  | AsyncIterable<string>
  | ReadableStream<string>
  | ReadableStream<Uint8Array>;

export type TextStreamStatus = "idle" | "streaming" | "done" | "error";

export interface TextStreamState {
  /** All text received so far. */
  text: string;
  status: TextStreamStatus;
  error: unknown;
}

const IDLE: TextStreamState = { text: "", status: "idle", error: undefined };

/**
 * Consumes a text stream and returns the accumulated text.
 *
 * Passing a new source restarts from empty; passing `null` resets to idle.
 * The previous source is cancelled when it is replaced or on unmount.
 */
export function useTextStream(
  source: TextStreamSource | null | undefined,
): TextStreamState {
  const [state, setState] = useState<TextStreamState>(IDLE);

  useEffect(() => {
    if (!source) {
      setState(IDLE);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const chunks = readChunks(source, controller.signal);
    setState({ text: "", status: "streaming", error: undefined });

    (async () => {
      try {
        for await (const chunk of chunks) {
          if (cancelled) return;
          setState((prev) => ({ ...prev, text: prev.text + chunk }));
        }
        if (!cancelled) setState((prev) => ({ ...prev, status: "done" }));
      } catch (error) {
        if (!cancelled) setState((prev) => ({ ...prev, status: "error", error }));
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      void chunks.return(undefined);
    };
  }, [source]);

  return state;
}

/** Normalises every supported source into an async generator of strings. */
async function* readChunks(
  source: TextStreamSource,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (!(source instanceof ReadableStream)) {
    yield* source;
    return;
  }

  // Read via a reader rather than `for await`, which older Safari lacks.
  const reader = (source as ReadableStream<string | Uint8Array>).getReader();
  // Cancelling the reader settles a pending read(), which `return()` alone
  // cannot interrupt.
  const cancel = () => void reader.cancel().catch(() => {});
  signal.addEventListener("abort", cancel, { once: true });
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield typeof value === "string"
        ? value
        : decoder.decode(value, { stream: true });
    }
    const tail = decoder.decode();
    if (tail) yield tail;
  } finally {
    signal.removeEventListener("abort", cancel);
    // Runs on early exit too, so an abandoned fetch body is released.
    cancel();
  }
}
