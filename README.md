# anythic/ui

**The interface layer for AI agents.**

Composable React components for streaming AI chats, agent workflows, and coding assistants. Build interfaces for reasoning, tool calls, approvals, plans, diffs, and terminals—without tying your UI to a particular model or backend.

[![npm version](https://img.shields.io/npm/v/@anythic/ui?color=0a7)](https://www.npmjs.com/package/@anythic/ui)
[![npm downloads](https://img.shields.io/npm/dm/@anythic/ui)](https://www.npmjs.com/package/@anythic/ui)
[![CI](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/hero-dark.png" />
  <img alt="Coding agent interface showing reasoning, plan progress, terminal output, and a file diff" src="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/hero-light.png" width="860" />
</picture>

## Why anythic/ui?

- **Built for streaming.** Render token-by-token replies with a cursor and handle incomplete Markdown—including partially streamed code fences—without flashing raw syntax.
- **Made for agent workflows.** Present reasoning, tool calls and results, approval requests, plans, code diffs, terminal output, and context usage.
- **Model-agnostic.** Use GPT, Claude, Gemini, local models, the [AI SDK](https://ai-sdk.dev), or your own backend. Components accept plain props; `useTextStream` reads a standard stream.
- **Easy to theme.** Semantic CSS variables compatible with [shadcn/ui](https://ui.shadcn.com/) conventions; light and dark themes are included.
- **Accessible and adaptable.** Keyboard interactions, screen-reader labels, reduced-motion support, and replaceable built-in strings.

## Quick start

**Requirements:** React and Tailwind CSS v4.

### 1. Install

```bash
npm install @anythic/ui
```

### 2. Import the theme

After your Tailwind import, add the component theme to your global stylesheet:

```css
@import "tailwindcss";
@import "@anythic/ui/theme.css";
```

### 3. Render a streaming reply

```tsx
"use client";

import { Markdown, useTextStream } from "@anythic/ui";

export function Reply({ response }: { response: Response }) {
  const { text, status } = useTextStream(response.body);

  return <Markdown streaming={status === "streaming"}>{text}</Markdown>;
}
```

`useTextStream` consumes the response body; `Markdown` renders the content while it arrives.

## Compose an agent interface

Combine components to show what your assistant is doing—not just its final message.

```tsx
<Message from="assistant">
  <ReasoningBlock text={reasoning} streaming={thinking} />
  <ToolCall
    name="web_search"
    title="Searching the web"
    status="success"
    input={{ query }}
    output={results}
  />
  <Markdown sources={sources}>{answer}</Markdown>
  <Sources sources={sources} />
</Message>
```

The values in this example (`reasoning`, `thinking`, `query`, `results`, `sources`, and `answer`) come from your application.

## Component reference

| Category | Components | Use case |
| --- | --- | --- |
| Conversation | `Conversation`, `Message`, `MessageAction`, `MessageCopyButton` | Organize chat turns and actions |
| Input | `PromptInput`, `AttachmentList` | Compose prompts and display attachments |
| Responses | `StreamingText`, `Markdown`, `CodeBlock` | Display streamed text, Markdown, and code |
| Sources | `Citation`, `Sources` | Attribute answers to source material |
| Agents | `ReasoningBlock`, `ToolCall`, `ToolApproval`, `Plan` | Visualize multi-step agent work |
| Coding | `CodeDiff`, `Terminal`, `ContextUsage` | Show edits, execution, and context usage |
| Hooks | `useTextStream` | Consume streamed text |

Each component has a demo in the documentation app. The `/showcase` route combines them in a complete interface.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/chat-dark.png" />
  <img alt="AI assistant conversation with tool calls, citations, sources, and an approval request" src="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/chat-light.png" width="860" />
</picture>

## Theming

Components use semantic CSS color tokens rather than hard-coded colors. To customize your brand, override tokens such as `--primary` and `--primary-foreground`:

```css
:root {
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.985 0 0);
}
```

Tokens follow shadcn/ui naming conventions, including `background`, `foreground`, `muted`, `border`, `ring`, `destructive`, `success`, and `warning`. Default values live in a cascade layer so application-level overrides can take precedence.

Dark mode follows the system preference, or a `.dark` class / `data-theme="dark"` attribute on an ancestor. A `.light` class or `data-theme="light"` can force light mode. If your app switches themes using classes or attributes, align Tailwind's dark variant:

```css
@custom-variant dark (&:where(.dark *, [data-theme="dark"] *));
```

## Run the examples locally

This repository includes a Next.js documentation app with individual component demos, a showcase, and a live AI example.

**Development requirements:** Node.js 20.9+ (`.nvmrc` pins Node 22) and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the docs, or [http://localhost:3000/showcase](http://localhost:3000/showcase) for the complete showcase.

### Live model demo

The documentation app's `/live` route streams a model response through the [AI SDK](https://ai-sdk.dev), including reasoning, tool calls, approvals, and the final answer. Gemini is configured by default.

1. Copy `apps/docs/.env.example` to `apps/docs/.env.local`.
2. Set `GOOGLE_GENERATIVE_AI_API_KEY` using a key from [Google AI Studio](https://aistudio.google.com/apikey).
3. Start the app with `pnpm dev` and open `/live`.

You can change the AI SDK provider in `apps/docs/app/api/chat/model.ts` without changing the UI.

> **Deployment warning:** The demo route limits message size but does not implement rate limiting. Add authentication, abuse protection, and rate limits before exposing it publicly with a paid API key.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`packages/ui`](packages/ui) | Publishable `@anythic/ui` components |
| [`apps/docs`](apps/docs) | Documentation, demos, showcase, and live example |
| [`packages/eslint-config`](packages/eslint-config) | Shared ESLint configuration |
| [`scripts`](scripts) | Release and README screenshot tooling |

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Contributing and security

Contributions and bug reports are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

To report a security vulnerability, follow [SECURITY.md](SECURITY.md) instead of posting sensitive details in a public issue.

## License

Released under the [MIT License](LICENSE). © anythic.
