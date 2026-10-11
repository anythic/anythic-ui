import Link from "next/link";
import { ChatDemo } from "./components/chat-demo";
import { CodeDiffDemo } from "./components/code-diff-demo";
import { MarkdownDemo } from "./components/markdown-demo";
import { PlanDemo } from "./components/plan-demo";
import { ReasoningBlockDemo } from "./components/reasoning-block-demo";
import { SourcesDemo } from "./components/sources-demo";
import { StreamingTextDemo } from "./components/streaming-text-demo";
import { ToolApprovalDemo } from "./components/tool-approval-demo";
import { TerminalDemo } from "./components/terminal-demo";
import { ThemePicker } from "./components/theme-picker";
import { ToolCallDemo } from "./components/tool-call-demo";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">anythic/ui</h1>
      <p className="mt-2 text-muted-foreground">
        AI-native UI primitives for autonomous agents, streaming reasoning, and developer
        interfaces.
      </p>
      <Link
        href="/live"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-2 hover:no-underline"
      >
        Try them with a real model →
      </Link>
      <div className="mt-8">
        <ThemePicker />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-medium">StreamingText</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Text that grows as tokens arrive, fed by <code>useTextStream</code>.
        </p>
        <div className="mt-4">
          <StreamingTextDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Markdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Model output as markdown, with highlighted code. Syntax cut off mid-stream is closed, so
          bold text and code never flash as raw markers.
        </p>
        <div className="mt-4">
          <MarkdownDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Citation, Sources</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pass <code>sources</code> to <code>Markdown</code> and the model&apos;s <code>[1]</code>{" "}
          markers become citations. Hover or focus one to preview the source.
        </p>
        <div className="mt-4">
          <SourcesDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ReasoningBlock</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shows the model thinking, then collapses to a summary once the answer starts.
        </p>
        <div className="mt-4">
          <ReasoningBlockDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ToolCall</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A tool the agent called, with its status. Open one to see the input and output, or the
          error.
        </p>
        <div className="mt-4">
          <ToolCallDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The agent&apos;s plan as a checklist, with progress. Statuses match the todo states agents
          report: <code>pending</code>, <code>in_progress</code>, <code>completed</code>, plus{" "}
          <code>failed</code>.
        </p>
        <div className="mt-4">
          <PlanDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">CodeDiff</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A file change, line by line, from old and new code or a unified patch. Unchanged stretches
          fold; click one to expand it.
        </p>
        <div className="mt-4">
          <CodeDiffDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Terminal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A command and its streaming output, with ANSI colors, progress bars that redraw their
          line, the exit code and how long it took.
        </p>
        <div className="mt-4">
          <TerminalDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ToolApproval</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lets the user approve or deny an action before the agent runs it.
        </p>
        <div className="mt-4">
          <ToolApprovalDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Conversation, Message, PromptInput</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A whole chat. The conversation follows the reply while you are at the bottom and stays put
          when you scroll up. The send button becomes a stop button while a reply streams.
        </p>
        <div className="mt-4">
          <ChatDemo />
        </div>
      </section>
    </main>
  );
}
