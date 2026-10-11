# anythic/ui

[![CI](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/anythic/anythic-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI-native UI primitives and components built for autonomous agents, streaming reasoning, and developer interfaces.

## Packages

| Path                         | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| [`packages/ui`](packages/ui) | `@anythic/ui`, the component library (React, TypeScript, Tailwind CSS) |
| [`apps/docs`](apps/docs)     | Docs and live demos (Next.js)                                          |

## Usage

```tsx
"use client";

import { StreamingText, useTextStream } from "@anythic/ui";

export function Reply({ response }: { response: Response }) {
  const { text, status } = useTextStream(response.body);
  return <StreamingText text={text} streaming={status === "streaming"} />;
}
```

`useTextStream` accepts an async iterable of strings or a `ReadableStream` of strings or bytes, such as a fetch response body.

For markdown replies, swap `StreamingText` for `Markdown`. While `streaming` is true it closes syntax the stream cut off, such as an open code fence or `**bold`, so partial output renders cleanly:

```tsx
<Markdown streaming={status === "streaming"}>{text}</Markdown>
```

Code blocks are highlighted with [Shiki](https://shiki.style), which is loaded on first use.

Components are styled with Tailwind CSS v4. Tell Tailwind to scan the package from your stylesheet:

```css
@import "tailwindcss";
@source "../node_modules/@anythic/ui/dist";
```

## Live demo

`apps/docs` has a live chat at `/live` that streams a real model through the [AI SDK](https://ai-sdk.dev): reasoning, tool calls with approval, and the answer all render with these components. It uses Gemini by default; the model is picked in one function in `apps/docs/app/api/chat/model.ts`, so any AI SDK provider works without touching the UI.

To run it, copy `apps/docs/.env.example` to `apps/docs/.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` (get one at [Google AI Studio](https://aistudio.google.com/apikey)). The route caps message size, but has no rate limiting: anyone who can reach a deployment can spend your key.

## Development

Requires Node 20+ and pnpm 10.

```sh
pnpm install
pnpm dev        # library in watch mode + docs at http://localhost:3000
pnpm test
pnpm typecheck
pnpm build
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines, and [SECURITY.md](SECURITY.md) to report a vulnerability privately.

## License

[MIT](LICENSE) © anythic
