import type { Metadata } from "next";
import Link from "next/link";
import { LiveChat } from "./live-chat";

export const metadata: Metadata = { title: "Live demo · anythic/ui" };

export default function LivePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Components
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Live demo</h1>
      <p className="mt-2 text-muted-foreground">
        A real model, streamed through the{" "}
        <a href="https://ai-sdk.dev" className="underline underline-offset-2">
          AI SDK
        </a>
        . Reasoning, tool calls, approvals and the answer all render with anythic/ui. Switching
        providers changes one line on the server, not the UI.
      </p>
      <div className="mt-8">
        <LiveChat />
      </div>
    </main>
  );
}
