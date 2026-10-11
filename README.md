# anythic/ui

AI-native UI primitives and components built for autonomous agents, streaming reasoning, and developer interfaces.

## Packages

| Path | Description |
| --- | --- |
| [`packages/ui`](packages/ui) | `@anythic/ui`, the component library (React, TypeScript, Tailwind CSS) |
| [`apps/docs`](apps/docs) | Docs and live demos (Next.js) |

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

## Development

Requires Node 20+ and pnpm 10.

```sh
pnpm install
pnpm dev        # library in watch mode + docs at http://localhost:3000
pnpm test
pnpm typecheck
pnpm build
```
