import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTextStream, type TextStreamSource } from "../src";

async function* fromChunks(chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

function bytesStream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe("useTextStream", () => {
  it("is idle without a source", () => {
    const { result } = renderHook(() => useTextStream(null));
    expect(result.current).toEqual({ text: "", status: "idle", error: undefined });
  });

  it("accumulates an async iterable", async () => {
    const source = fromChunks(["Hello", ", ", "world"]);
    const { result } = renderHook(() => useTextStream(source));
    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.text).toBe("Hello, world");
  });

  it("decodes a byte stream, including characters split across chunks", async () => {
    const bytes = new TextEncoder().encode("Salom, dunyo! 👋");
    // Split inside the 4-byte emoji.
    const source = bytesStream([bytes.slice(0, -2), bytes.slice(-2)]);
    const { result } = renderHook(() => useTextStream(source));
    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.text).toBe("Salom, dunyo! 👋");
  });

  it("reports errors with the text received before them", async () => {
    const failure = new Error("connection lost");
    async function* failing() {
      yield "partial";
      throw failure;
    }
    const source = failing();
    const { result } = renderHook(() => useTextStream(source));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.text).toBe("partial");
    expect(result.current.error).toBe(failure);
  });

  it("cancels a pending stream on unmount", async () => {
    let cancelled = false;
    const source = new ReadableStream<string>({
      start(controller) {
        controller.enqueue("first");
      },
      cancel() {
        cancelled = true;
      },
    });
    const { result, unmount } = renderHook(() => useTextStream(source));
    await waitFor(() => expect(result.current.text).toBe("first"));
    unmount();
    await waitFor(() => expect(cancelled).toBe(true));
  });

  it("restarts from empty when the source changes", async () => {
    const { result, rerender } = renderHook(
      ({ source }: { source: TextStreamSource }) => useTextStream(source),
      { initialProps: { source: fromChunks(["one"]) } },
    );
    await waitFor(() => expect(result.current.text).toBe("one"));

    await act(async () => rerender({ source: fromChunks(["two"]) }));
    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.text).toBe("two");
  });
});
