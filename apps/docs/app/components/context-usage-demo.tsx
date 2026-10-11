"use client";

import { ContextUsage, PromptInput } from "@anythic/ui";
import { useState } from "react";

const LIMIT = 200_000;
// Example prices per million tokens; real ones depend on the model.
const INPUT_PRICE = 3;
const OUTPUT_PRICE = 15;

const START = { input: 31_000, output: 2_400, turns: 0 };

export function ContextUsageDemo() {
  const [usage, setUsage] = useState(START);
  // Controlled and never cleared, so the sample message can be sent again and again.
  const [draft, setDraft] = useState("Here is another log file to look at…");
  const used = usage.input + usage.output;
  const cost = (usage.input * INPUT_PRICE + usage.output * OUTPUT_PRICE) / 1_000_000;

  // Each turn sends the conversation so far plus a big file the user "pasted".
  const send = () =>
    setUsage((current) => ({
      input: current.input + 26_000 + Math.round(Math.random() * 8_000),
      output: current.output + 1_500 + Math.round(Math.random() * 2_000),
      turns: current.turns + 1,
    }));

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Send a few messages and watch the window fill. Hover or focus the meter for details.
        {usage.turns > 0 && ` ${usage.turns} sent.`}
      </p>
      <PromptInput
        className="mt-3"
        value={draft}
        onValueChange={setDraft}
        onSubmit={send}
        disabled={used >= LIMIT}
        actions={
          <ContextUsage
            used={used}
            limit={LIMIT}
            breakdown={{
              input: usage.input,
              output: usage.output,
              cachedInput: Math.round(usage.input * 0.6),
            }}
            cost={cost}
            className="mb-1"
          />
        }
      />
      <button
        type="button"
        onClick={() => setUsage(START)}
        className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
      >
        Reset
      </button>
    </div>
  );
}
