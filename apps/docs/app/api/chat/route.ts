import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { chatModel, hasApiKey, providerOptions } from "./model";
import { SYSTEM_PROMPT, tools } from "./tools";

// The key is yours and this route is public once deployed, so keep each
// request small. Add real rate limiting before sharing a deployment widely.
const MAX_MESSAGES = 20;
const MAX_TEXT_LENGTH = 4000;

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "The live demo is not configured: set GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 503 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const recent = messages.slice(-MAX_MESSAGES);
  const tooLong = recent.some((message) =>
    message.parts.some((part) => part.type === "text" && part.text.length > MAX_TEXT_LENGTH),
  );
  if (tooLong) {
    return Response.json(
      { error: `Messages are limited to ${MAX_TEXT_LENGTH} characters in this demo.` },
      { status: 413 },
    );
  }

  const result = streamText({
    model: chatModel(),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(recent),
    tools,
    toolApproval: { delete_file: "user-approval" },
    stopWhen: isStepCount(6),
    providerOptions,
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Show provider errors such as an invalid key instead of a generic
      // message; they say nothing about this server worth hiding.
      onError: (error) => (error instanceof Error ? error.message : "Something went wrong."),
    }),
  });
}
