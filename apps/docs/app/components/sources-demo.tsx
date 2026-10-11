"use client";

import { Markdown, Sources, useTextStream, type Source, type TextStreamSource } from "@anythic/ui";
import { useState } from "react";
import { fakeStream } from "../../lib/fake-stream";

const SOURCES: Source[] = [
  {
    url: "https://en.wikipedia.org/wiki/Rayleigh_scattering",
    title: "Rayleigh scattering",
    snippet:
      "Rayleigh scattering is the scattering of light by particles much smaller than its wavelength; it is stronger for shorter wavelengths.",
  },
  {
    url: "https://en.wikipedia.org/wiki/Diffuse_sky_radiation",
    title: "Diffuse sky radiation",
    snippet: "Sunlight scattered by the atmosphere is what gives the sky its color.",
  },
  {
    url: "https://en.wikipedia.org/wiki/Color_vision",
    title: "Color vision",
    snippet: "Human eyes are less sensitive to violet than to blue light.",
  },
];

const REPLY =
  "The sky looks blue because air molecules scatter short wavelengths of sunlight " +
  "far more than long ones, an effect called **Rayleigh scattering** [1]. That " +
  "scattered light reaches your eyes from every direction, so the whole sky glows [2].\n\n" +
  "Violet scatters even more than blue, but the sun emits less of it and our eyes " +
  "are less sensitive to it [1, 3].";

export function SourcesDemo() {
  const [source, setSource] = useState<TextStreamSource | null>(null);
  const { text, status } = useTextStream(source);

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Why is the sky blue?</p>
      {status !== "idle" && (
        <div className="mt-3 space-y-3 text-sm">
          <Markdown sources={SOURCES} streaming={status === "streaming"}>
            {text}
          </Markdown>
          {status === "done" && <Sources sources={SOURCES} />}
        </div>
      )}
      <button
        type="button"
        onClick={() => setSource(fakeStream(REPLY, 30))}
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {status === "idle" ? "Ask" : "Ask again"}
      </button>
    </div>
  );
}
