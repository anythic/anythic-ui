"use client";

import { ToolApproval, ToolCall, type ToolApprovalStatus } from "@anythic/ui";
import { useState } from "react";

const INPUT = { path: "~/reports/2025-draft.pdf" };

type Run = "idle" | "running" | "done";

export function ToolApprovalDemo() {
  const [status, setStatus] = useState<ToolApprovalStatus>("pending");
  const [run, setRun] = useState<Run>("idle");

  const approve = async () => {
    // Stands in for telling the agent backend about the decision.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("approved");
    setRun("running");
    setTimeout(() => setRun("done"), 1200);
  };

  const reset = () => {
    setStatus("pending");
    setRun("idle");
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Clean up my old report drafts.</p>
      <ToolApproval
        name="delete_file"
        title="Delete 2025-draft.pdf"
        description="The file will be removed permanently."
        input={INPUT}
        status={status}
        destructive
        onApprove={approve}
        onDeny={() => setStatus("denied")}
        className="mt-3"
      />
      {run !== "idle" && (
        <ToolCall
          name="delete_file"
          title="Deleting 2025-draft.pdf"
          status={run === "running" ? "running" : "success"}
          input={INPUT}
          output={run === "done" ? { deleted: true } : undefined}
          className="mt-2"
        />
      )}
      {status === "denied" && <p className="mt-3 text-sm">Okay, I left the file alone.</p>}
      {status !== "pending" && (
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Reset
        </button>
      )}
    </div>
  );
}
