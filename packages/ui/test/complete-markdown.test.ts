import { describe, expect, it } from "vitest";
import { completeMarkdown } from "../src";

describe("completeMarkdown", () => {
  it.each([
    ["leaves finished text alone", "Hello **world**", "Hello **world**"],
    ["closes bold", "Hello **wor", "Hello **wor**"],
    ["closes strikethrough", "an ~~old", "an ~~old~~"],
    ["closes inline code", "run `npm i", "run `npm i`"],
    ["nests closers in order", "**see `fo", "**see `fo`**"],
    ["ignores bold markers inside code", "use `a ** b", "use `a ** b`"],
    ["drops a marker with nothing after it", "Hello **", "Hello"],
    ["drops a lone backtick", "Run `", "Run "],
    ["closes a code fence", "```ts\nconst a", "```ts\nconst a\n```"],
    ["closes a fence with its own length and char", "~~~~\nx\n", "~~~~\nx\n~~~~"],
    ["leaves a closed fence alone", "```\nx\n```\n\ndone", "```\nx\n```\n\ndone"],
    ["does not touch markers inside an open fence", "```\na **b", "```\na **b\n```"],
    ["only repairs the last block", "**a\n\nb **c", "**a\n\nb **c**"],
  ])("%s", (_, input, expected) => {
    expect(completeMarkdown(input)).toBe(expected);
  });
});
