"use client";

import { CodeDiff, type CodeDiffStatus } from "@anythic/ui";
import { useState } from "react";

const BEFORE = `import { renew, type Token } from "./api";

const SKEW_MS = 30_000;

/** Returns a token that is valid for at least SKEW_MS more. */
export async function fresh(token: Token): Promise<Token> {
  const now = Date.now();
  if (token.expiresAt < now) {
    return renew(token);
  }
  return token;
}

export function isExpired(token: Token): boolean {
  return token.expiresAt < Date.now();
}

export function describe(token: Token): string {
  const seconds = Math.round((token.expiresAt - Date.now()) / 1000);
  return \`expires in \${seconds}s\`;
}
`;

const AFTER = `import { renew, type Token } from "./api";

const SKEW_MS = 30_000;

/** Returns a token that is valid for at least SKEW_MS more. */
export async function fresh(token: Token): Promise<Token> {
  const now = Date.now();
  // Renew a little early, so a token never expires mid-request.
  if (token.expiresAt - SKEW_MS <= now) {
    return renew(token);
  }
  return token;
}

export function isExpired(token: Token): boolean {
  return token.expiresAt <= Date.now();
}

export function describe(token: Token): string {
  const seconds = Math.round((token.expiresAt - Date.now()) / 1000);
  return \`expires in \${seconds}s\`;
}
`;

export function CodeDiffDemo() {
  const [status, setStatus] = useState<CodeDiffStatus>("pending");

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm">
        I found it: tokens were renewed only after they had already expired. Here is the change:
      </p>
      <CodeDiff
        filename="src/auth/session.ts"
        oldCode={BEFORE}
        newCode={AFTER}
        status={status}
        onAccept={() =>
          new Promise<void>((resolve) => setTimeout(() => (setStatus("accepted"), resolve()), 500))
        }
        onReject={() => setStatus("rejected")}
        className="mt-3"
      />
      {status !== "pending" && (
        <button
          type="button"
          onClick={() => setStatus("pending")}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Reset
        </button>
      )}
    </div>
  );
}
