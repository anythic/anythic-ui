"use client";

import {
  AttachmentList,
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
import { useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

type Turn = { from: "user" | "assistant"; text: string; files?: File[] };

function reply(prompt: string, files: File[]) {
  const attached = files.length
    ? `I can see ${files.length === 1 ? "the file" : `${files.length} files`} you attached: ` +
      files.map((file) => `\`${file.name}\``).join(", ") +
      ". This demo does not read them, but a real backend would get them from `onSubmit`.\n\n"
    : "";
  return (
    (prompt ? `You asked: *${prompt}*\n\n` : "") +
    attached +
    "There is no model behind this demo, so each reply streams a word at a " +
    "time. Send a few messages and the conversation scrolls with the reply; " +
    "scroll up while one streams and it stays put, with a button to jump back.\n\n" +
    "- **Enter** sends, **Shift+Enter** adds a line\n" +
    "- The stop button keeps what has arrived so far\n" +
    "- Copy and retry sit under each reply\n" +
    "- Attach files with the clip, by dropping them, or by pasting an image"
  );
}

const REJECTION_TEXT = {
  type: "type not allowed",
  size: "larger than 10 MB",
  count: "only 4 files at a time",
} as const;

export function ChatDemo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status, stop } = useTextStream(source);
  const streaming = status === "streaming";

  // The latest reply lives in the stream; it joins `turns` when the next
  // message is sent, so there is nothing to copy over when a stream ends.
  const send = (prompt: string, files: File[]) => {
    setNotice("");
    const latest: Turn[] = status === "idle" ? [] : [{ from: "assistant", text }];
    setTurns((prev) => [...prev, ...latest, { from: "user", text: prompt, files }]);
    setSource(fakeStream(reply(prompt, files), 40));
  };

  // turns always ends with the prompt the latest reply answers.
  const retry = () => {
    const prompt = turns.at(-1);
    if (prompt) setSource(fakeStream(reply(prompt.text, prompt.files ?? []), 40));
  };

  return (
    <div className="flex h-[480px] flex-col rounded-lg border border-border">
      <Conversation className="flex-1">
        {turns.length === 0 && status === "idle" && (
          <p className="text-sm text-muted-foreground">Say something to start.</p>
        )}
        {turns.map((turn, i) =>
          turn.from === "user" ? (
            <Message key={i} from="user">
              {turn.files && turn.files.length > 0 && (
                <AttachmentList items={turn.files} className={turn.text ? "mb-2" : undefined} />
              )}
              {turn.text}
            </Message>
          ) : (
            <Message key={i} from="assistant" actions={<MessageCopyButton text={turn.text} />}>
              <Markdown>{turn.text}</Markdown>
            </Message>
          ),
        )}
        {status !== "idle" && (
          <Message
            from="assistant"
            actions={
              !streaming && (
                <>
                  <MessageCopyButton text={text} />
                  <MessageAction label="Retry" onClick={retry}>
                    <RetryIcon />
                  </MessageAction>
                </>
              )
            }
          >
            <Markdown streaming={streaming}>{text}</Markdown>
          </Message>
        )}
      </Conversation>
      <div className="p-3 pt-0">
        <PromptInput
          onSubmit={send}
          streaming={streaming}
          onStop={stop}
          attachments={{
            maxFiles: 4,
            maxSize: 10 * 1024 * 1024,
            onReject: (rejections) =>
              setNotice(
                rejections
                  .map(({ file, reason }) => `${file.name}: ${REJECTION_TEXT[reason]}`)
                  .join(" · "),
              ),
          }}
        />
        {notice && (
          <p role="status" className="mt-2 text-xs text-destructive">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}
