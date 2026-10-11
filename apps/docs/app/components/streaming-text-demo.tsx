"use client";

import { StreamingText, useTextStream, type TextStreamSource } from "@anythic/ui";
import { useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

const REPLY =
  "Streaming responses feel faster because the first words appear right away. " +
  "This demo fakes a model by yielding one word at a time; in a real app the " +
  "source would be a fetch response body.";

export function StreamingTextDemo() {
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status } = useTextStream(source);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <StreamingText
        text={text || "Press Stream to start."}
        streaming={status === "streaming"}
        className="min-h-24 leading-relaxed"
      />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSource(fakeStream(REPLY, 40))}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {status === "idle" ? "Stream" : "Restart"}
        </button>
        <span className="text-xs text-zinc-500">status: {status}</span>
      </div>
    </div>
  );
}
