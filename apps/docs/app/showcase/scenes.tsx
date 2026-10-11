"use client";

import {
  CodeDiff,
  ContextUsage,
  Markdown,
  Message,
  Plan,
  PromptInput,
  ReasoningBlock,
  Sources,
  Terminal,
  ToolApproval,
  ToolCall,
  type Source,
} from "@anythic/ui";

// Frozen, finished states of every component, for screenshots and a quick
// overview. Everything here is made up: logs, files and links are examples.

const noop = () => {};

const E = "\x1b";
const TEST_OUTPUT = [
  `${E}[1mRUN${E}[22m ${E}[2mv3.2.7 /app${E}[22m`,
  "",
  ` ${E}[32m✓${E}[39m src/auth/token.test.ts ${E}[2m(8 tests) 18ms${E}[22m`,
  ` ${E}[31m✗${E}[39m src/auth/session.test.ts ${E}[2m(12 tests | 1 failed) 44ms${E}[22m`,
  `   ${E}[31m→ renews a token that expires within 30s${E}[39m`,
  "",
  ` ${E}[1mTests${E}[22m  ${E}[31m1 failed${E}[39m | ${E}[32m19 passed${E}[39m (20)`,
].join("\n");

const BEFORE = `export async function fresh(token: Token): Promise<Token> {
  const now = Date.now();
  if (token.expiresAt < now) {
    return renew(token);
  }
  return token;
}
`;

const AFTER = `export async function fresh(token: Token): Promise<Token> {
  const now = Date.now();
  // Renew a little early, so a token never expires mid-request.
  if (token.expiresAt - SKEW_MS <= now) {
    return renew(token);
  }
  return token;
}
`;

export function CodingAgentScene() {
  return (
    <div
      data-shot="hero"
      className="w-[860px] space-y-6 rounded-2xl border border-border bg-background p-6"
    >
      <Message from="user">The login test fails on CI. Can you fix it?</Message>
      <Message from="assistant">
        <ReasoningBlock
          text="The failing test renews a token that expires within 30 seconds. The check compares expiresAt with now, so a token about to expire is still treated as valid."
          duration={6}
        />
        <Plan
          title="Fix the failing login test"
          tasks={[
            { title: "Run the auth tests", status: "completed" },
            {
              title: "Find where tokens are renewed",
              status: "completed",
              description: "src/auth/session.ts",
            },
            { title: "Renew tokens before they expire", status: "in_progress" },
            { title: "Run the test suite again", status: "pending" },
          ]}
        />
        <Terminal command="pnpm test src/auth" output={TEST_OUTPUT} exitCode={1} duration={2400} />
        <Markdown>
          {
            "Tokens were renewed only **after** they expired, so a request could start with a token that dies mid-flight. Renewing 30 seconds early fixes it:"
          }
        </Markdown>
        <CodeDiff
          filename="src/auth/session.ts"
          oldCode={BEFORE}
          newCode={AFTER}
          status="pending"
          onAccept={noop}
          onReject={noop}
        />
      </Message>
      <PromptInput
        onSubmit={noop}
        attachments
        labels={{ placeholder: "Ask a follow-up…" }}
        actions={
          <ContextUsage
            used={46_800}
            limit={200_000}
            breakdown={{ input: 41_200, cachedInput: 30_500, output: 5_600 }}
            cost={0.21}
            className="mb-1"
          />
        }
      />
    </div>
  );
}

const SOURCES: Source[] = [
  {
    url: "https://status.example.com/incidents/checkout-0912",
    title: "Incident: elevated checkout errors",
    snippet: "Error rates rose after the 14:05 deploy of payments-api v2.15.0.",
  },
  {
    url: "https://docs.example.com/runbooks/payments-rollback",
    title: "Runbook: rolling back payments-api",
    snippet: "Roll back to the last healthy version, then re-run the smoke tests.",
  },
];

export function AssistantScene() {
  return (
    <div
      data-shot="chat"
      className="w-[860px] space-y-6 rounded-2xl border border-border bg-background p-6"
    >
      <Message from="user">Why did checkout errors spike yesterday afternoon?</Message>
      <Message from="assistant">
        <ReasoningBlock
          text="Look at error logs around the spike, then the deploys and incident notes from the same window."
          duration={4}
        />
        <ToolCall
          name="search_logs"
          title="Searching payments logs, 13:00–16:00"
          status="success"
          input={{ service: "payments-api", level: "error" }}
          output={{ matches: 1284 }}
        />
        <ToolCall
          name="list_deploys"
          title="Listing deploys around the spike"
          status="success"
          input={{ service: "payments-api", since: "13:00" }}
          output={[{ version: "v2.15.0", at: "14:05" }]}
        />
        <Markdown sources={SOURCES}>
          {
            "Errors started at **14:06**, a minute after `payments-api` **v2.15.0** went out [1]. Almost all of them are timeouts calling the card processor, which the new retry settings make worse.\n\nThe runbook says to roll back to the last healthy version [2]. I can do that now:"
          }
        </Markdown>
        <Sources sources={SOURCES} defaultOpen />
        <ToolApproval
          name="rollback_service"
          title="Roll back payments-api to v2.14.1"
          description="Production traffic will move to the previous version within about two minutes."
          input={{ service: "payments-api", to: "v2.14.1" }}
          status="pending"
          destructive
          onApprove={noop}
          onDeny={noop}
        />
      </Message>
    </div>
  );
}

/** GitHub's social preview card: 1280×640, shown when the repository is shared. */
export function SocialCard() {
  return (
    <div
      data-shot="social"
      className="flex h-[640px] w-[1280px] items-center gap-12 overflow-hidden bg-background px-16"
    >
      <div className="w-[480px] shrink-0">
        <p className="font-mono text-sm text-muted-foreground">@anythic/ui</p>
        <h1 className="mt-3 text-6xl font-semibold tracking-tight">anythic/ui</h1>
        <p className="mt-5 text-2xl leading-snug text-muted-foreground">
          React components for AI interfaces: streaming replies, reasoning, tool calls, approvals
          and coding agents.
        </p>
        <p className="mt-8 inline-block rounded-lg border border-border bg-muted px-4 py-2 font-mono text-lg">
          npm i @anythic/ui
        </p>
      </div>
      <div className="w-[640px] shrink-0 space-y-4 rounded-2xl border border-border p-6 shadow-xl">
        <ReasoningBlock text="" duration={6} />
        <Plan
          title="Fix the failing login test"
          tasks={[
            { title: "Run the auth tests", status: "completed" },
            { title: "Renew tokens before they expire", status: "in_progress" },
            { title: "Run the test suite again", status: "pending" },
          ]}
        />
        <ToolCall
          name="read_file"
          title="Reading src/auth/session.ts"
          status="success"
          input={{ path: "src/auth/session.ts" }}
        />
        <ToolApproval
          name="run_command"
          title="Run pnpm test"
          input="pnpm test src/auth"
          status="pending"
          onApprove={noop}
          onDeny={noop}
        />
      </div>
    </div>
  );
}
