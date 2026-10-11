import { describe, expect, it } from "vitest";
import { parseAnsi, stripAnsi } from "../src/lib/ansi";

const ESC = "\x1b";

describe("parseAnsi", () => {
  it("splits plain text into lines, ignoring one trailing newline", () => {
    expect(parseAnsi("a\nb\n")).toEqual([[{ text: "a", style: {} }], [{ text: "b", style: {} }]]);
    expect(parseAnsi("")).toEqual([[]]);
  });

  it("applies colors and resets", () => {
    const [line] = parseAnsi(`${ESC}[31merror${ESC}[0m: ${ESC}[1;32mok${ESC}[39m!`);
    expect(line).toEqual([
      { text: "error", style: { color: "#cd3131" } },
      { text: ": ", style: {} },
      { text: "ok", style: { bold: true, color: "#0dbc79" } },
      { text: "!", style: { bold: true } },
    ]);
  });

  it("supports bright, 256-color and truecolor", () => {
    const [line] = parseAnsi(`${ESC}[91ma${ESC}[38;5;196mb${ESC}[38;5;244mc${ESC}[48;2;10;20;30md`);
    expect(line!.map((s) => [s.style.color, s.style.background])).toEqual([
      ["#f14c4c", undefined],
      ["rgb(255, 0, 0)", undefined],
      ["rgb(128, 128, 128)", undefined],
      ["rgb(128, 128, 128)", "rgb(10, 20, 30)"],
    ]);
  });

  it("keeps style across lines until reset", () => {
    const lines = parseAnsi(`${ESC}[33mone\ntwo${ESC}[0m\nthree`);
    expect(lines.map((l) => l[0]!.style.color)).toEqual(["#e5e510", "#e5e510", undefined]);
  });

  it("redraws the line on a carriage return, like a progress bar", () => {
    expect(stripAnsi("Downloading 10%\rDownloading 55%\rDownloading 100%\ndone")).toBe(
      "Downloading 100%\ndone",
    );
    expect(stripAnsi("windows\r\nline")).toBe("windows\nline");
  });

  it("drops cursor movement, OSC titles and unknown escapes", () => {
    expect(stripAnsi(`${ESC}[2K${ESC}[1Gclean${ESC}]0;title\x07 text${ESC}[?25h`)).toBe(
      "clean text",
    );
  });

  it("hides an escape sequence cut off at the end of streamed output", () => {
    expect(stripAnsi(`ok${ESC}[3`)).toBe("ok");
    expect(stripAnsi(`ok${ESC}`)).toBe("ok");
    expect(stripAnsi(`ok${ESC}]0;tit`)).toBe("ok");
    const [line] = parseAnsi(`ok${ESC}[31mred`);
    expect(line!.at(-1)).toEqual({ text: "red", style: { color: "#cd3131" } });
  });
});
