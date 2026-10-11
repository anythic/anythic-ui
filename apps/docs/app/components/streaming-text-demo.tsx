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
    <div className="rounded-lg border border-border p-4">
      <StreamingText
        text={text || "Press Stream to start."}
        streaming={status === "streaming"}
        className="min-h-24 leading-relaxed"
      />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSource(fakeStream(REPLY, 40))}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {status === "idle" ? "Stream" : "Restart"}
        </button>
        <span className="text-xs text-muted-foreground">status: {status}</span>
      </div>
    </div>
  );
}
