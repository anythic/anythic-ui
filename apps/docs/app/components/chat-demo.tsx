"use client";

import {
  Conversation,
  Markdown,
  Message,
  MessageAction,
  MessageCopyButton,
  PromptInput,
  RetryIcon,
  useTextStream,
  type TextStreamSource,
} from "@anythic/ui";
import { useEffect, useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

type Turn = { from: "user" | "assistant"; text: string };

function reply(prompt: string) {
  return (
    `You asked: *${prompt}*\n\n` +
    "There is no model behind this demo, so each reply streams a word at a " +
    "time. Send a few messages and the conversation scrolls with the reply; " +
    "scroll up while one streams and it stays put, with a button to jump back.\n\n" +
    "- **Enter** sends, **Shift+Enter** adds a line\n" +
    "- The stop button keeps what has arrived so far\n" +
    "- Copy and retry sit under each reply"
  );
}

export function ChatDemo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status, stop } = useTextStream(source);
  const streaming = status === "streaming";

  // Move the finished (or stopped) reply into the history.
  useEffect(() => {
    if (status !== "done" && status !== "stopped") return;
    setTurns((prev) => [...prev, { from: "assistant", text }]);
    setSource(null);
  }, [status, text]);

  const send = (prompt: string) => {
    setTurns((prev) => [...prev, { from: "user", text: prompt }]);
    setSource(fakeStream(reply(prompt), 40));
  };

  const retry = () => {
    const lastPrompt = [...turns].reverse().find((turn) => turn.from === "user");
    if (!lastPrompt) return;
    setTurns((prev) => prev.slice(0, -1));
    setSource(fakeStream(reply(lastPrompt.text), 40));
  };

  return (
    <div className="flex h-[480px] flex-col rounded-lg border border-border">
      <Conversation className="flex-1">
        {turns.length === 0 && !streaming && (
          <p className="text-sm text-muted-foreground">Say something to start.</p>
        )}
        {turns.map((turn, i) =>
          turn.from === "user" ? (
            <Message key={i} from="user">
              {turn.text}
            </Message>
          ) : (
            <Message
              key={i}
              from="assistant"
              actions={
                <>
                  <MessageCopyButton text={turn.text} />
                  {i === turns.length - 1 && !streaming && (
                    <MessageAction label="Retry" onClick={retry}>
                      <RetryIcon />
                    </MessageAction>
                  )}
                </>
              }
            >
              <Markdown>{turn.text}</Markdown>
            </Message>
          ),
        )}
        {streaming && (
          <Message from="assistant">
            <Markdown streaming>{text}</Markdown>
          </Message>
        )}
      </Conversation>
      <div className="p-3 pt-0">
        <PromptInput onSubmit={send} streaming={streaming} onStop={stop} />
      </div>
    </div>
  );
}
