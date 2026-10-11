"use client";

import { cn } from "@anythic/ui";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

// Brand colors are just CSS variables: setting them on <html> restyles every
// component on the page. These work on both light and dark backgrounds.
const ACCENTS = {
  Default: null,
  Blue: "oklch(0.546 0.245 262.881)",
  Violet: "oklch(0.541 0.281 293.009)",
  Green: "oklch(0.596 0.145 163.225)",
  Orange: "oklch(0.646 0.222 41.116)",
} as const;

type Accent = keyof typeof ACCENTS;

export function ThemePicker() {
  const [mode, setMode] = useState<Mode>("system");
  const [accent, setAccent] = useState<Accent>("Default");

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    const color = ACCENTS[accent];
    for (const name of ["--primary", "--ring"]) {
      if (color) root.style.setProperty(name, color);
      else root.style.removeProperty(name);
    }
    if (color) root.style.setProperty("--primary-foreground", "oklch(0.985 0 0)");
    else root.style.removeProperty("--primary-foreground");
  }, [accent]);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
      <div
        role="radiogroup"
        aria-label="Color mode"
        className="flex rounded-lg border border-border p-0.5"
      >
        {(["system", "light", "dark"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "rounded-md px-2.5 py-1 capitalize text-muted-foreground hover:text-foreground",
              mode === value && "bg-muted text-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Brand color" className="flex items-center gap-2">
        {(Object.keys(ACCENTS) as Accent[]).map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={accent === name}
            aria-label={name}
            title={name}
            onClick={() => setAccent(name)}
            className={cn(
              "size-6 rounded-full border border-border ring-offset-2 ring-offset-background",
              accent === name && "ring-2 ring-ring",
            )}
            style={{ background: ACCENTS[name] ?? "var(--foreground)" }}
          />
        ))}
      </div>
    </div>
  );
}
