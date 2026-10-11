# anythic/ui

[![npm](https://img.shields.io/npm/v/@anythic/ui?color=0a7)](https://www.npmjs.com/package/@anythic/ui)
[![npm downloads](https://img.shields.io/npm/dm/@anythic/ui)](https://www.npmjs.com/package/@anythic/ui)
[![CI](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/anythic/anythic-ui/blob/main/LICENSE)

React components for AI interfaces: streaming replies, reasoning, tool calls, approvals, plans, diffs and terminals. Works with any model, styled with Tailwind CSS v4.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/hero-dark.png" />
  <img alt="A coding agent built with anythic/ui: a collapsed reasoning block, a plan with progress, a failing test run in a terminal, and a code diff waiting to be accepted" src="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/hero-light.png" width="860" />
</picture>

## Why anythic/ui

- **Streaming first.** Text grows token by token with a cursor; markdown cut off mid-stream (an open code fence, a half-written `**bold`) is closed so it never flashes as raw syntax; a stream can stop and keep what arrived.
- **Built for agents.** Reasoning that collapses when done, tool calls with status and output, approvals before risky actions, plans, file diffs with accept and reject, terminals with ANSI colors, and context usage.
- **Any model, any backend.** Components take plain props and `useTextStream` reads any stream, so they work with Claude, GPT, Gemini, local models, the [AI SDK](https://ai-sdk.dev) or your own server.
- **Yours to theme.** Colors are CSS variables with [shadcn/ui](https://ui.shadcn.com)'s names, so a shadcn theme applies as is, and light and dark mode work out of the box.
- **Accessible and translatable.** Real buttons, keyboard support, screen-reader text and reduced motion, and every built-in string can be replaced.

## Quick start

```sh
npm install @anythic/ui
```

Import the theme after Tailwind in your stylesheet. It brings the color tokens and tells Tailwind where the components' classes are:

```css
@import "tailwindcss";
@import "@anythic/ui/theme.css";
```

Then render a streamed reply:

```tsx
"use client";

import { Markdown, useTextStream } from "@anythic/ui";

export function Reply({ response }: { response: Response }) {
  const { text, status } = useTextStream(response.body);
  return <Markdown streaming={status === "streaming"}>{text}</Markdown>;
}
```

Components compose: an agent's turn is a `Message` with whatever happened in it.

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

## Components

| Group   | Components                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| Chat    | `Conversation`, `Message`, `MessageAction`, `MessageCopyButton`, `PromptInput` (with attachments), `AttachmentList` |
| Replies | `StreamingText`, `Markdown`, `CodeBlock`, `Citation`, `Sources`                                                     |
| Agents  | `ReasoningBlock`, `ToolCall`, `ToolApproval`, `Plan`                                                                |
| Coding  | `CodeDiff`, `Terminal`, `ContextUsage`                                                                              |
| Hooks   | `useTextStream`                                                                                                     |

Every component has a demo in the docs app (`pnpm dev`, then http://localhost:3000), and `/showcase` shows them together as in the pictures here.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/chat-dark.png" />
  <img alt="An assistant built with anythic/ui: tool calls, an answer with numbered citations, its sources, and an approval request for a rollback" src="https://raw.githubusercontent.com/anythic/anythic-ui/main/.github/assets/chat-light.png" width="860" />
</picture>

## Theming

Components use semantic color tokens instead of fixed colors: `background`, `foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `primary`, `primary-foreground`, `border`, `ring`, `destructive`, `destructive-foreground`, `success` and `warning`. `theme.css` defines light and dark defaults; override any of them to match your brand:

```css
:root {
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.985 0 0);
}
```

The names match [shadcn/ui](https://ui.shadcn.com), so in an app with a shadcn theme these components pick it up automatically. The defaults sit in a cascade layer, so your own values always win.

Dark mode follows the system setting, or a `dark` class or `data-theme="dark"` on an ancestor; put `light` or `data-theme="light"` on `<html>` to force light. Code highlighting uses Tailwind's `dark:` variant, so if you switch modes with a class or attribute, point the variant at the same rules:

```css
@custom-variant dark (&:where(.dark *, [data-theme="dark"] *));
```

## Live demo

`apps/docs` has a live chat at `/live` that streams a real model through the [AI SDK](https://ai-sdk.dev): reasoning, tool calls with approval, and the answer all render with these components. It uses Gemini by default; the model is picked in one function in `apps/docs/app/api/chat/model.ts`, so any AI SDK provider works without touching the UI.

To run it, copy `apps/docs/.env.example` to `apps/docs/.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` (get one at [Google AI Studio](https://aistudio.google.com/apikey)). The route caps message size, but has no rate limiting: anyone who can reach a deployment can spend your key.

## Repository

| Path                                               | What lives there                                      |
| -------------------------------------------------- | ----------------------------------------------------- |
| [`packages/ui`](packages/ui)                       | `@anythic/ui`, the component library                  |
| [`apps/docs`](apps/docs)                           | Docs, demos, the live demo and the showcase (Next.js) |
| [`packages/eslint-config`](packages/eslint-config) | Shared ESLint configs                                 |
| [`scripts`](scripts)                               | Release tagging and README screenshots                |

## Development

Requires Node 20.9+ (`.nvmrc` pins 22) and pnpm 10.

```sh
pnpm install
pnpm dev          # library in watch mode + docs at http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines, and [SECURITY.md](SECURITY.md) to report a vulnerability privately.

## License

[MIT](LICENSE) © anythic
