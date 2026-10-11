"use client";

import {
  Conversation,
  Message,
  MessageAction,
  MessageCopyButton,
  PromptInput,
  RetryIcon,
} from "@anythic/ui";
import { useChat } from "@ai-sdk/react";
import { isToolUIPart, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { messageText, renderPart, type PartRenderOptions } from "../../lib/ai-sdk-parts";

const SUGGESTIONS = [
  "What's the weather in Tashkent and Samarkand?",
  "Clean up the old drafts in my workspace",
  "Write a TypeScript debounce function",
];

function toolTitle(name: string, input: unknown): string | undefined {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "get_weather":
      return args.city ? `Checking the weather in ${args.city}` : "Checking the weather";
    case "list_files":
      return "Listing files";
    case "delete_file":
      return args.path ? `Delete ${args.path}` : "Delete a file";
  }
}

export function LiveChat() {
  const { messages, sendMessage, status, stop, error, regenerate, addToolApprovalResponse } =
    useChat({
      // After the user approves or denies a tool, send the decision back so
      // the agent can carry on.
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });
  const busy = status === "submitted" || status === "streaming";

  const options: PartRenderOptions = {
    toolTitle,
    destructiveTools: ["delete_file"],
    onApprovalResponse: (response) => void addToolApprovalResponse(response),
  };

  const send = (text: string) => void sendMessage({ text });
  const lastMessage = messages.at(-1);

  return (
    <div className="flex h-[640px] flex-col rounded-lg border border-border">
      <Conversation className="flex-1">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <Message key={message.id} from="user">
                {messageText(message)}
              </Message>
            );
          }
          const isLast = message === lastMessage;
          const text = messageText(message);
          // Retry would throw away a pending approval, so hold actions until it is answered.
          const awaitingApproval = message.parts.some(
            (part) => isToolUIPart(part) && part.state === "approval-requested",
          );
          return (
            <Message
              key={message.id}
              from="assistant"
              actions={
                !(isLast && (busy || awaitingApproval)) && (
                  <>
                    {text && <MessageCopyButton text={text} />}
                    {isLast && (
                      <MessageAction label="Retry" onClick={() => void regenerate()}>
                        <RetryIcon />
                      </MessageAction>
                    )}
                  </>
                )
              }
            >
              {message.parts.map((part, i) => renderPart(part, `${message.id}-${i}`, options))}
            </Message>
          );
        })}
        {status === "submitted" && lastMessage?.role === "user" && (
          <Message from="assistant">
            <span className="animate-pulse text-muted-foreground motion-reduce:animate-none">
              Thinking…
            </span>
          </Message>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {readableError(error)}{" "}
            <button
              type="button"
              onClick={() => void regenerate()}
              className="font-medium underline"
            >
              Try again
            </button>
          </div>
        )}
      </Conversation>
      <div className="p-3 pt-0">
        <PromptInput onSubmit={send} streaming={busy} onStop={() => void stop()} />
      </div>
    </div>
  );
}

/** The route answers setup problems as JSON `{ error }`; show that text. */
function readableError(error: Error): string {
  try {
    const body = JSON.parse(error.message) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Not JSON: a stream error, already readable.
  }
  return error.message || "Something went wrong.";
}
