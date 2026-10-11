export interface AnsiStyle {
  /** CSS color, e.g. `#cd3131` or `rgb(1, 2, 3)`. */
  color?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
}

export interface AnsiSegment {
  text: string;
  style: AnsiStyle;
}

/** The 16 standard colors, as VS Code's dark terminal draws them. */
const PALETTE = [
  "#000000",
  "#cd3131",
  "#0dbc79",
  "#e5e510",
  "#2472c8",
  "#bc3fbc",
  "#11a8cd",
  "#e5e5e5",
  "#666666",
  "#f14c4c",
  "#23d18b",
  "#f5f543",
  "#3b8eea",
  "#d670d6",
  "#29b8db",
  "#ffffff",
];

/** The xterm 256-color table: 16 standard, a 6×6×6 cube, then 24 grays. */
function color256(n: number): string | undefined {
  if (n < 0 || n > 255) return undefined;
  if (n < 16) return PALETTE[n];
  if (n < 232) {
    const i = n - 16;
    const level = (v: number) => (v === 0 ? 0 : 55 + v * 40);
    return `rgb(${level(Math.floor(i / 36))}, ${level(Math.floor(i / 6) % 6)}, ${level(i % 6)})`;
  }
  const gray = 8 + (n - 232) * 10;
  return `rgb(${gray}, ${gray}, ${gray})`;
}

/**
 * Splits terminal output into lines of styled segments. Handles SGR codes
 * (colors, including 256-color and truecolor, bold, dim, italic, underline,
 * inverse) and carriage returns, which redraw the line (progress bars).
 * Other escape sequences, such as cursor movement, are dropped.
 */
export function parseAnsi(input: string): AnsiSegment[][] {
  // Streamed output can end mid-sequence ("\x1b[3"); hide the fragment until
  // the rest arrives instead of showing it as text for a moment.
  const text = input.replace(/\x1b(?:\[[0-9;?]*|\][^\x07\x1b]*)?$/, "");
  const lines: AnsiSegment[][] = [[]];
  let style: AnsiStyle = {};
  // Escape sequences: CSI (ESC [ ... final byte) and OSC (ESC ] ... BEL or ST).
  const pattern = /\x1b\[([0-9;?]*)([@-~])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-_]|\r\n|\r|\n/g;
  let last = 0;

  const push = (chunk: string) => {
    if (chunk) lines.at(-1)!.push({ text: chunk, style });
  };

  for (const match of text.matchAll(pattern)) {
    push(text.slice(last, match.index));
    last = match.index + match[0].length;
    const token = match[0];
    if (token === "\n" || token === "\r\n") lines.push([]);
    else if (token === "\r") lines[lines.length - 1] = [];
    else if (match[2] === "m") style = applySgr(style, match[1] ?? "");
  }
  push(text.slice(last));

  // A trailing newline ends the last line rather than starting an empty one.
  if (lines.length > 1 && lines.at(-1)!.length === 0 && /\n$/.test(text)) lines.pop();
  return lines;
}

function applySgr(current: AnsiStyle, params: string): AnsiStyle {
  const codes = params === "" ? [0] : params.split(";").map((p) => (p === "" ? 0 : Number(p)));
  let style = { ...current };
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]!;
    if (code === 0) style = {};
    else if (code === 1) style.bold = true;
    else if (code === 2) style.dim = true;
    else if (code === 3) style.italic = true;
    else if (code === 4) style.underline = true;
    else if (code === 7) style.inverse = true;
    else if (code === 22) style.bold = style.dim = undefined;
    else if (code === 23) style.italic = undefined;
    else if (code === 24) style.underline = undefined;
    else if (code === 27) style.inverse = undefined;
    else if (code >= 30 && code <= 37) style.color = PALETTE[code - 30];
    else if (code >= 90 && code <= 97) style.color = PALETTE[code - 90 + 8];
    else if (code === 39) style.color = undefined;
    else if (code >= 40 && code <= 47) style.background = PALETTE[code - 40];
    else if (code >= 100 && code <= 107) style.background = PALETTE[code - 100 + 8];
    else if (code === 49) style.background = undefined;
    else if (code === 38 || code === 48) {
      const key = code === 38 ? "color" : "background";
      if (codes[i + 1] === 5) {
        style[key] = color256(codes[i + 2] ?? -1);
        i += 2;
      } else if (codes[i + 1] === 2) {
        const [r, g, b] = [codes[i + 2], codes[i + 3], codes[i + 4]].map((v) =>
          Math.min(255, Math.max(0, v ?? 0)),
        );
        style[key] = `rgb(${r}, ${g}, ${b})`;
        i += 4;
      }
    }
  }
  return style;
}

/** Terminal output as plain text, e.g. for copying. */
export function stripAnsi(text: string): string {
  return parseAnsi(text)
    .map((line) => line.map((segment) => segment.text).join(""))
    .join("\n");
}
