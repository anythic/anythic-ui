const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Closes markdown that a stream cut off mid-construct, so partial text
 * renders the way the finished text will instead of flashing raw syntax:
 * an open code fence, inline code, `**bold**` or `~~strikethrough~~`.
 * A marker with nothing after it yet is dropped rather than closed.
 *
 * Only meant for text that is still streaming; finished text should be
 * rendered as-is.
 */
export function completeMarkdown(text: string): string {
  const openFence = findOpenFence(text);
  if (openFence) return `${text}${text.endsWith("\n") ? "" : "\n"}${openFence}`;

  // Inline markers cannot span a blank line, so only the last block matters.
  const blockStart = text.lastIndexOf("\n\n") + 1;
  const head = text.slice(0, blockStart);
  let block = text.slice(blockStart).trimEnd();
  let closers = "";

  if (count(block, "`") % 2 === 1) {
    if (block.endsWith("`")) block = block.slice(0, -1);
    else closers = "`" + closers;
  }

  // Emphasis inside an open code span is literal, so ignore code spans,
  // including the one just closed.
  const prose = (block + closers).replace(/`[^`]*`/g, "");
  for (const marker of ["**", "~~"]) {
    if (count(prose, marker) % 2 === 0) continue;
    if (block.endsWith(marker)) {
      block = block.slice(0, -marker.length).trimEnd();
    } else {
      closers += marker;
    }
  }

  return head + block + closers;
}

/** The fence that would close a code block left open, if there is one. */
function findOpenFence(text: string): string | undefined {
  let open: { char: string; length: number } | undefined;
  for (const line of text.split("\n")) {
    const match = FENCE.exec(line);
    if (!match) continue;
    const [, fence = "", info = ""] = match;
    if (!open) {
      // Backtick fences cannot have backticks in their info string.
      if (fence[0] === "`" && info.includes("`")) continue;
      open = { char: fence[0]!, length: fence.length };
    } else if (fence[0] === open.char && fence.length >= open.length && info.trim() === "") {
      open = undefined;
    }
  }
  return open && open.char.repeat(open.length);
}

function count(text: string, marker: string): number {
  return text.split(marker).length - 1;
}
