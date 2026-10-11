"use client";

import { ToolCall, type ToolCallProps } from "@anythic/ui";
import { useEffect, useRef, useState } from "react";

type Call = Pick<ToolCallProps, "name" | "title" | "input" | "output" | "error"> & {
  fails?: boolean;
};

const CALLS: Call[] = [
  {
    name: "web_search",
    title: "Searching the web",
    input: { query: "Tashkent weather tomorrow" },
    output: [
      { title: "Tashkent forecast", url: "https://example.com/tashkent" },
      { title: "Uzbekistan weather", url: "https://example.com/uz" },
    ],
  },
  {
    name: "fetch_page",
    title: "Reading example.com/tashkent",
    input: { url: "https://example.com/tashkent" },
    error: "Request timed out after 10s",
    fails: true,
  },
  {
    name: "fetch_page",
    title: "Reading example.com/uz",
    input: { url: "https://example.com/uz" },
    output: "Tomorrow: sunny, high of 24°C, low of 12°C.",
  },
];

/** -1 before the run, CALLS.length when every call has finished. */
type Progress = { current: number; running: boolean };

export function ToolCallDemo() {
  const [progress, setProgress] = useState<Progress>({ current: -1, running: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = () => {
    clear();
    CALLS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setProgress({ current: i, running: true }), i * 1600));
      timers.current.push(
        setTimeout(() => setProgress({ current: i, running: false }), i * 1600 + 1200),
      );
    });
  };

  const statusOf = (i: number): ToolCallProps["status"] => {
    if (i < progress.current || (i === progress.current && !progress.running)) {
      return CALLS[i]!.fails ? "error" : "success";
    }
    return i === progress.current ? "running" : "pending";
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium">What's the weather in Tashkent tomorrow?</p>
      {progress.current >= 0 && (
        <div className="mt-3 space-y-2">
          {CALLS.map(({ fails: _fails, ...call }, i) => {
            const status = statusOf(i);
            const finished = status === "success" || status === "error";
            return (
              <ToolCall
                key={i}
                {...call}
                status={status}
                output={finished ? call.output : undefined}
              />
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={run}
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {progress.current < 0 ? "Run agent" : "Run again"}
      </button>
    </div>
  );
}
