import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * The model behind the live demo. Swap this one function to try another
 * provider; the UI does not change. For example, with `@ai-sdk/anthropic`
 * installed: `return anthropic("claude-sonnet-5-5")`.
 */
export function chatModel(): LanguageModel {
  return google(process.env.GEMINI_MODEL ?? "gemini-3.8-flash");
}

/** Whether the server has a key for the model above. */
export function hasApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Provider settings that ask for thoughts, so the UI can show reasoning. */
export const providerOptions = {
  google: { thinkingConfig: { thinkingLevel: "low", includeThoughts: true } },
};
