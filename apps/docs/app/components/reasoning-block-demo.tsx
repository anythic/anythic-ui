"use client";

import {
  ReasoningBlock,
  StreamingText,
  useTextStream,
  type TextStreamSource,
} from "@anythic/ui";
import { useEffect, useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

const REASONING =
  "The user wants to know why the sky is blue. Sunlight contains every " +
  "wavelength. Air molecules scatter short wavelengths far more than long " +
  "ones (Rayleigh scattering), so blue light reaches the eye from every " +
  "direction. Violet scatters even more, but the sun emits less of it and " +
  "our eyes are less sensitive to it. I'll keep the answer short.";

const ANSWER =
  "Air scatters blue sunlight much more than red, so blue reaches your eyes " +
  "from all over the sky. That effect is called Rayleigh scattering.";

export function ReasoningBlockDemo() {
  const [reasoningSource, setReasoningSource] = useState<TextStreamSource | null>(null);
  const [answerSource, setAnswerSource] = useState<TextStreamSource | null>(null);
  const reasoning = useTextStream(reasoningSource);
  const answer = useTextStream(answerSource);

  // Like a real model: the answer starts once thinking is finished.
  useEffect(() => {
    if (reasoning.status === "done") setAnswerSource(fakeStream(ANSWER, 40));
  }, [reasoning.status]);

  const start = () => {
    setAnswerSource(null);
    setReasoningSource(fakeStream(REASONING, 50));
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium">Why is the sky blue?</p>
      {reasoning.status !== "idle" && (
        <ReasoningBlock
          text={reasoning.text}
          streaming={reasoning.status === "streaming"}
          className="mt-3"
        />
      )}
      {answer.status !== "idle" && (
        <StreamingText
          text={answer.text}
          streaming={answer.status === "streaming"}
          className="mt-3 leading-relaxed"
        />
      )}
      <button
        type="button"
        onClick={start}
        className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {reasoning.status === "idle" ? "Ask" : "Ask again"}
      </button>
    </div>
  );
}
