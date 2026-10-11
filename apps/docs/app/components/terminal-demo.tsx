"use client";

import { Terminal } from "@anythic/ui";
import { useEffect, useRef, useState } from "react";

const E = "\x1b";
const dim = (s: string) => `${E}[2m${s}${E}[22m`;
const green = (s: string) => `${E}[32m${s}${E}[39m`;
const red = (s: string) => `${E}[31m${s}${E}[39m`;
const bold = (s: string) => `${E}[1m${s}${E}[22m`;

// Each chunk is what the process printed next. "\r" redraws the line.
const RUNS = {
  test: {
    command: "pnpm test",
    exitCode: 0,
    chunks: [
      `${bold("RUN")} ${dim("v3.2.7 /app")}\n\n`,
      "Collecting tests 10%",
      "\rCollecting tests 60%",
      "\rCollecting tests 100%\n",
      ` ${green("✓")} src/auth/session.test.ts ${dim("(12 tests) 41ms")}\n`,
      ` ${green("✓")} src/auth/token.test.ts ${dim("(8 tests) 18ms")}\n`,
      ` ${green("✓")} src/api/client.test.ts ${dim("(23 tests) 97ms")}\n`,
      `\n ${bold("Tests")}  ${green("43 passed")} (43)\n`,
    ],
  },
  build: {
    command: "pnpm build",
    exitCode: 1,
    chunks: [
      `${dim("> tsc --noEmit && vite build")}\n\n`,
      `src/auth/session.ts${dim(":")}${E}[33m14${E}[39m${dim(":")}${E}[33m9${E}[39m - ${red("error")} ${dim("TS2322:")} Type 'string' is not assignable to type 'number'.\n\n`,
      `${E}[7m14${E}[27m   return token.expiresAt;\n`,
      `            ${red("~~~~~~~~~~~~~~~~")}\n\n`,
      `Found ${red("1 error")} in src/auth/session.ts${dim(":14")}\n`,
      `${red(`${E}[1mELIFECYCLE${E}[22m`)} Command failed with exit code 1.\n`,
    ],
  },
} as const;

type RunName = keyof typeof RUNS;

export function TerminalDemo() {
  const [name, setName] = useState<RunName | null>(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = (next: RunName) => {
    clear();
    setName(next);
    setOutput("");
    setRunning(true);
    const { chunks } = RUNS[next];
    chunks.forEach((chunk, i) => {
      timers.current.push(setTimeout(() => setOutput((current) => current + chunk), 250 + i * 350));
    });
    timers.current.push(setTimeout(() => setRunning(false), 400 + chunks.length * 350));
  };

  return (
    <div className="rounded-lg border border-border p-4">
      {name && (
        <Terminal
          command={RUNS[name].command}
          output={output}
          running={running}
          exitCode={running ? undefined : RUNS[name].exitCode}
          className="mb-4"
        />
      )}
      <div className="flex gap-2">
        {(Object.keys(RUNS) as RunName[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => run(key)}
            className="rounded-md bg-primary px-3 py-1.5 font-mono text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {RUNS[key].command}
          </button>
        ))}
      </div>
    </div>
  );
}
