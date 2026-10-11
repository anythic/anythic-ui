"use client";

import { Markdown, useTextStream, type TextStreamSource } from "@anythic/ui";
import { useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

const REPLY = `## Debouncing in TypeScript

A **debounce** delays a call until input has *stopped* for a moment, which is
handy for search boxes and resize handlers.

\`\`\`ts
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
\`\`\`

| Technique | Fires | Good for |
| --- | --- | --- |
| Debounce | after input stops | search, autosave |
| Throttle | at most every *n* ms | scroll, resize |

- [x] Works with any argument list
- [ ] Add a \`cancel()\` method next

Read more on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout).`;

export function MarkdownDemo() {
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status } = useTextStream(source);

  return (
    <div className="rounded-lg border border-border p-4">
      {status === "idle" ? (
        <p className="text-sm text-muted-foreground">
          Press Stream to watch a markdown reply arrive.
        </p>
      ) : (
        <Markdown streaming={status === "streaming"}>{text}</Markdown>
      )}
      <button
        type="button"
        onClick={() => setSource(fakeStream(REPLY, 25))}
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {status === "idle" ? "Stream" : "Restart"}
      </button>
    </div>
  );
}
