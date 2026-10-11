# @anythic/ui

AI-native UI primitives and components built for autonomous agents, streaming reasoning, and developer interfaces. React, TypeScript and Tailwind CSS v4.

Works with any model: components take plain props, and `useTextStream` reads any stream.

## Components

| Component                                       | What it shows                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `StreamingText`                                 | Plain text that grows as tokens arrive                                   |
| `Markdown`, `CodeBlock`                         | Model output as markdown, with highlighted code                          |
| `Citation`, `Sources`                           | Inline `[1]` citations with previews, and the source list                |
| `ReasoningBlock`                                | The model's thinking, collapsing when done                               |
| `ToolCall`                                      | A tool the agent called, with status, input, output                      |
| `ToolApproval`                                  | Approve or deny an action before the agent runs it                       |
| `Plan`                                          | The agent's plan as a checklist, with progress                           |
| `CodeDiff`                                      | A file change line by line, with accept and reject                       |
| `Terminal`                                      | A command's streaming output with ANSI colors and exit code              |
| `Message`, `MessageAction`, `MessageCopyButton` | One turn in a chat, with actions under it                                |
| `Conversation`                                  | A message list that follows new content                                  |
| `PromptInput`                                   | Where the user types, with attachments and a stop button while streaming |
| `AttachmentList`                                | Files as chips: image thumbnails, or name and size                       |
| `useTextStream`                                 | Reads a stream into text, with `stop()`                                  |

## Quick start

```sh
npm install @anythic/ui
```

Import the theme after Tailwind in your stylesheet. It brings the color tokens and tells Tailwind where the components' classes are:

```css
@import "tailwindcss";
@import "@anythic/ui/theme.css";
```

Colors are CSS variables with the same names as shadcn/ui (`--primary`, `--muted`, `--border`, ...), so you can rebrand by overriding them, and a shadcn theme applies as is.

```tsx
"use client";

import { Markdown, useTextStream } from "@anythic/ui";

export function Reply({ response }: { response: Response }) {
  const { text, status } = useTextStream(response.body);
  return <Markdown streaming={status === "streaming"}>{text}</Markdown>;
}
```

See the [repository](https://github.com/anythic/anythic-ui) for demos and the full guide.

## License

[MIT](LICENSE)
