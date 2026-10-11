# @anythic/ui

AI-native UI primitives and components built for autonomous agents, streaming reasoning, and developer interfaces. React, TypeScript and Tailwind CSS v4.

Works with any model: components take plain props, and `useTextStream` reads any stream.

## Components

| Component                                       | What it shows                                            |
| ----------------------------------------------- | -------------------------------------------------------- |
| `StreamingText`                                 | Plain text that grows as tokens arrive                   |
| `Markdown`, `CodeBlock`                         | Model output as markdown, with highlighted code          |
| `ReasoningBlock`                                | The model's thinking, collapsing when done               |
| `ToolCall`                                      | A tool the agent called, with status, input, output      |
| `ToolApproval`                                  | Approve or deny an action before the agent runs it       |
| `Message`, `MessageAction`, `MessageCopyButton` | One turn in a chat, with actions under it                |
| `Conversation`                                  | A message list that follows new content                  |
| `PromptInput`                                   | Where the user types, with a stop button while streaming |
| `useTextStream`                                 | Reads a stream into text, with `stop()`                  |

## Quick start

```sh
npm install @anythic/ui
```

Point Tailwind at the package from your stylesheet:

```css
@import "tailwindcss";
@source "../node_modules/@anythic/ui/dist";
```

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
