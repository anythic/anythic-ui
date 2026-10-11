"use client";

import {
  Markdown,
  ReasoningBlock,
  ToolApproval,
  ToolCall,
  type ToolCallStatus,
} from "@anythic/ui";
import {
  getToolName,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import type { ReactNode } from "react";

type ToolPart = ToolUIPart | DynamicToolUIPart;

export interface PartRenderOptions {
  /** Friendly header for a tool call, e.g. "Checking the weather in Paris". */
  toolTitle?: (name: string, input: unknown) => string | undefined;
  /** Tools whose approval should be styled as dangerous. */
  destructiveTools?: string[];
  onApprovalResponse: (response: { id: string; approved: boolean }) => void;
}

/**
 * Maps one AI SDK message part onto anythic/ui components. Parts the UI has
 * no use for (step boundaries, sources, files) render nothing.
 */
export function renderPart(
  part: UIMessage["parts"][number],
  key: string,
  options: PartRenderOptions,
): ReactNode {
  if (isTextUIPart(part)) {
    return (
      <Markdown key={key} streaming={part.state === "streaming"}>
        {part.text}
      </Markdown>
    );
  }
  if (isReasoningUIPart(part)) {
    if (!part.text) return null;
    return <ReasoningBlock key={key} text={part.text} streaming={part.state === "streaming"} />;
  }
  if (isToolUIPart(part)) {
    return <ToolPartView key={key} part={part} options={options} />;
  }
  return null;
}

function ToolPartView({ part, options }: { part: ToolPart; options: PartRenderOptions }) {
  const name = getToolName(part);
  const title = options.toolTitle?.(name, part.input);
  const manualApproval = part.approval && !part.approval.isAutomatic ? part.approval : undefined;

  const approval = manualApproval && (
    <ToolApproval
      name={name}
      title={title}
      input={part.input}
      description={manualApproval.requestReason}
      destructive={options.destructiveTools?.includes(name)}
      status={
        part.state === "approval-requested"
          ? "pending"
          : manualApproval.approved
            ? "approved"
            : "denied"
      }
      onApprove={() => options.onApprovalResponse({ id: manualApproval.id, approved: true })}
      onDeny={() => options.onApprovalResponse({ id: manualApproval.id, approved: false })}
    />
  );

  // Until the user decides, and after they deny, the approval is the whole story.
  if (part.state === "approval-requested" && manualApproval) return approval;
  if (part.state === "output-denied" && manualApproval) return approval;

  return (
    <>
      {approval}
      <ToolCall
        name={name}
        title={title}
        status={toolStatus(part)}
        input={part.state === "input-streaming" ? undefined : part.input}
        output={part.state === "output-available" ? part.output : undefined}
        error={
          part.state === "output-error"
            ? part.errorText
            : part.state === "output-denied"
              ? (part.approval.reason ?? "Denied")
              : undefined
        }
      />
    </>
  );
}

function toolStatus(part: ToolPart): ToolCallStatus {
  switch (part.state) {
    case "input-streaming":
      return "pending";
    case "output-available":
      return part.preliminary ? "running" : "success";
    case "output-error":
    case "output-denied":
      return "error";
    default:
      // input-available, approval-requested (automatic), approval-responded
      return "running";
  }
}

/** All the text an assistant message said, for copying. */
export function messageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n\n");
}
