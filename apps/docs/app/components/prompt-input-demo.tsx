"use client";

import { Markdown, PromptInput, useTextStream, type TextStreamSource } from "@anythic/ui";
import { useEffect, useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

type Message = { role: "user" | "assistant"; text: string };

function reply(prompt: string) {
  return (
    `You asked: **${prompt}**\n\n` +
    "This is a demo, so there is no model behind it. Each reply streams a word " +
    "at a time, which gives you a moment to press the stop button and see the " +
    "partial reply kept in the conversation.\n\n" +
    "- Enter sends, Shift+Enter adds a line\n" +
    "- The box grows as you type\n" +
    "- Stop keeps what has arrived so far"
  );
}

export function PromptInputDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status, stop } = useTextStream(source);
  const streaming = status === "streaming";

  // Move the finished (or stopped) reply into the history.
  useEffect(() => {
    if (status !== "done" && status !== "stopped") return;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: status === "stopped" ? `${text} …` : text },
    ]);
    setSource(null);
  }, [status, text]);

  const send = (prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setSource(fakeStream(reply(prompt), 50));
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="space-y-4">
        {messages.length === 0 && !streaming && (
          <p className="text-sm text-zinc-500">Say something to start.</p>
        )}
        {messages.map((message, i) =>
          message.role === "user" ? (
            <div
              key={i}
              className="ml-auto w-fit max-w-[80%] whitespace-pre-wrap rounded-2xl bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800"
            >
              {message.text}
            </div>
          ) : (
            <Markdown key={i} className="text-sm">
              {message.text}
            </Markdown>
          ),
        )}
        {streaming && (
          <Markdown streaming className="text-sm">
            {text}
          </Markdown>
        )}
      </div>
      <PromptInput onSubmit={send} streaming={streaming} onStop={stop} className="mt-4" />
    </div>
  );
}
