import { MarkdownDemo } from "./components/markdown-demo";
import { ReasoningBlockDemo } from "./components/reasoning-block-demo";
import { StreamingTextDemo } from "./components/streaming-text-demo";
import { ToolApprovalDemo } from "./components/tool-approval-demo";
import { ToolCallDemo } from "./components/tool-call-demo";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">anythic/ui</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        AI-native UI primitives for autonomous agents, streaming reasoning, and
        developer interfaces.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-medium">StreamingText</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Text that grows as tokens arrive, fed by <code>useTextStream</code>.
        </p>
        <div className="mt-4">
          <StreamingTextDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Markdown</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Model output as markdown, with highlighted code. Syntax cut off
          mid-stream is closed, so bold text and code never flash as raw
          markers.
        </p>
        <div className="mt-4">
          <MarkdownDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ReasoningBlock</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Shows the model thinking, then collapses to a summary once the answer
          starts.
        </p>
        <div className="mt-4">
          <ReasoningBlockDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ToolCall</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          A tool the agent called, with its status. Open one to see the input
          and output, or the error.
        </p>
        <div className="mt-4">
          <ToolCallDemo />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">ToolApproval</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Lets the user approve or deny an action before the agent runs it.
        </p>
        <div className="mt-4">
          <ToolApprovalDemo />
        </div>
      </section>
    </main>
  );
}
