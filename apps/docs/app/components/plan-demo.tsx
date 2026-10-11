"use client";

import { Plan, type PlanTask } from "@anythic/ui";
import { useEffect, useRef, useState } from "react";

// Each frame is the whole plan at one moment, like an agent's todo updates.
const FRAMES: PlanTask[][] = [
  [
    { id: "read", title: "Read the failing login test", status: "in_progress" },
    { id: "find", title: "Find where tokens are refreshed", status: "pending" },
    { id: "fix", title: "Fix the expiry check", status: "pending" },
    { id: "test", title: "Run the test suite", status: "pending" },
  ],
  [
    { id: "read", title: "Read the failing login test", status: "completed" },
    {
      id: "find",
      title: "Find where tokens are refreshed",
      status: "in_progress",
      description: "src/auth/session.ts",
    },
    { id: "fix", title: "Fix the expiry check", status: "pending" },
    { id: "test", title: "Run the test suite", status: "pending" },
  ],
  [
    { id: "read", title: "Read the failing login test", status: "completed" },
    {
      id: "find",
      title: "Find where tokens are refreshed",
      status: "completed",
      description: "src/auth/session.ts",
    },
    { id: "fix", title: "Fix the expiry check", status: "in_progress" },
    { id: "test", title: "Run the test suite", status: "pending" },
  ],
  [
    { id: "read", title: "Read the failing login test", status: "completed" },
    {
      id: "find",
      title: "Find where tokens are refreshed",
      status: "completed",
      description: "src/auth/session.ts",
    },
    { id: "fix", title: "Fix the expiry check", status: "completed" },
    {
      id: "test",
      title: "Run the test suite",
      status: "failed",
      description: "1 failed: refreshes a token that expires exactly now",
    },
    { id: "edge", title: "Handle tokens expiring at the boundary", status: "in_progress" },
    { id: "retest", title: "Run the test suite again", status: "pending" },
  ],
  [
    { id: "read", title: "Read the failing login test", status: "completed" },
    {
      id: "find",
      title: "Find where tokens are refreshed",
      status: "completed",
      description: "src/auth/session.ts",
    },
    { id: "fix", title: "Fix the expiry check", status: "completed" },
    {
      id: "test",
      title: "Run the test suite",
      status: "failed",
      description: "1 failed: refreshes a token that expires exactly now",
    },
    { id: "edge", title: "Handle tokens expiring at the boundary", status: "completed" },
    { id: "retest", title: "Run the test suite again", status: "in_progress" },
  ],
  [
    { id: "read", title: "Read the failing login test", status: "completed" },
    {
      id: "find",
      title: "Find where tokens are refreshed",
      status: "completed",
      description: "src/auth/session.ts",
    },
    { id: "fix", title: "Fix the expiry check", status: "completed" },
    {
      id: "test",
      title: "Run the test suite",
      status: "failed",
      description: "1 failed: refreshes a token that expires exactly now",
    },
    { id: "edge", title: "Handle tokens expiring at the boundary", status: "completed" },
    {
      id: "retest",
      title: "Run the test suite again",
      status: "completed",
      description: "128 passed",
    },
  ],
];

export function PlanDemo() {
  const [frame, setFrame] = useState(-1);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  const run = () => {
    clearInterval(timer.current);
    setFrame(0);
    timer.current = setInterval(() => {
      setFrame((current) => {
        if (current >= FRAMES.length - 1) {
          clearInterval(timer.current);
          return current;
        }
        return current + 1;
      });
    }, 1200);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium">The login test is failing, can you fix it?</p>
      {frame >= 0 && (
        <Plan title="Fix the failing login test" tasks={FRAMES[frame]!} className="mt-3" />
      )}
      <button
        type="button"
        onClick={run}
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {frame < 0 ? "Run agent" : "Run again"}
      </button>
    </div>
  );
}
