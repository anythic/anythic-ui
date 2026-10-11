export type DiffLine =
  | { type: "context"; oldNumber: number; newNumber: number; text: string }
  | { type: "add"; newNumber: number; text: string }
  | { type: "remove"; oldNumber: number; text: string };

/**
 * A run of lines between changes. `lines` holds them when they are known
 * (a diff of two texts), so they can be expanded; a patch omits them.
 */
export interface DiffGap {
  type: "gap";
  lines?: DiffLine[];
}

export type DiffRow = DiffLine | DiffGap;

/** Above this many differing lines, a line-by-line diff costs too much memory. */
const MAX_DIFF_LINES = 2000;

export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/** A line diff of two texts (Myers' algorithm, as git uses by default). */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = splitLines(oldText);
  const b = splitLines(newText);

  // Common head and tail are cheap to find and usually most of the file.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const lines: DiffLine[] = [];
  let oldNumber = 1;
  let newNumber = 1;
  const context = (text: string) =>
    lines.push({ type: "context", oldNumber: oldNumber++, newNumber: newNumber++, text });

  for (let i = 0; i < start; i++) context(a[i]!);
  const middleA = a.slice(start, endA);
  const middleB = b.slice(start, endB);
  const ops =
    middleA.length + middleB.length > MAX_DIFF_LINES
      ? // Too big to diff line by line: show it as replaced wholesale.
        [...middleA.map(() => "-" as const), ...middleB.map(() => "+" as const)]
      : myers(middleA, middleB);
  let i = 0;
  let j = 0;
  for (const op of ops) {
    if (op === "=") {
      context(middleA[i++]!);
      j++;
    } else if (op === "-") {
      lines.push({ type: "remove", oldNumber: oldNumber++, text: middleA[i++]! });
    } else {
      lines.push({ type: "add", newNumber: newNumber++, text: middleB[j++]! });
    }
  }
  for (let k = endA; k < a.length; k++) context(a[k]!);
  return lines;
}

/** Edit script from a to b: "=" keep, "-" remove from a, "+" add from b. */
function myers(a: string[], b: string[]): ("=" | "-" | "+")[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  // trace[d] is v as it was before round d, kept only for diagonals -d-1..d+1.
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1]! < v[offset + k + 1]!)
          ? v[offset + k + 1]!
          : v[offset + k - 1]! + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, n, m);
    }
  }
  return backtrack(trace, n, m);
}

function backtrack(trace: Int32Array[], n: number, m: number): ("=" | "-" | "+")[] {
  const ops: ("=" | "-" | "+")[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d]!;
    const at = (k: number) => v[k + d + 1]!;
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push("=");
      x--;
      y--;
    }
    if (d > 0) {
      ops.push(x === prevX ? "+" : "-");
      x = prevX;
      y = prevY;
    }
  }
  return ops.reverse();
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/** Reads the hunks of a unified diff (`git diff` output) for one file. */
export function parsePatch(patch: string): DiffRow[] {
  const rows: DiffRow[] = [];
  let oldNumber = 0;
  let newNumber = 0;
  let inHunk = false;

  for (const line of splitLines(patch)) {
    const hunk = HUNK.exec(line);
    if (hunk) {
      const oldStart = Number(hunk[1]);
      const newStart = Number(hunk[2]);
      // Lines skipped before this hunk, or between it and the previous one.
      if (oldStart > oldNumber + 1 || (!inHunk && oldStart > 1)) rows.push({ type: "gap" });
      oldNumber = oldStart - 1;
      newNumber = newStart - 1;
      inHunk = true;
      continue;
    }
    if (!inHunk) continue; // file headers: diff --git, index, ---, +++
    if (line.startsWith("+")) {
      rows.push({ type: "add", newNumber: ++newNumber, text: line.slice(1) });
    } else if (line.startsWith("-")) {
      rows.push({ type: "remove", oldNumber: ++oldNumber, text: line.slice(1) });
    } else if (line.startsWith(" ") || line === "") {
      rows.push({
        type: "context",
        oldNumber: ++oldNumber,
        newNumber: ++newNumber,
        text: line.slice(1),
      });
    } else if (line.startsWith("diff ")) {
      break; // the next file starts; this reads one
    }
    // "\ No newline at end of file" and anything else is skipped.
  }
  return rows;
}

/**
 * Keeps `context` unchanged lines around each change and folds longer runs
 * of unchanged lines into gaps that remember what they hide.
 */
export function foldContext(lines: DiffLine[], context: number): DiffRow[] {
  const changed = lines.map((line) => line.type !== "context");
  const keep = lines.map((_, i) => {
    for (let j = Math.max(0, i - context); j <= Math.min(lines.length - 1, i + context); j++) {
      if (changed[j]) return true;
    }
    return false;
  });

  const rows: DiffRow[] = [];
  let hidden: DiffLine[] = [];
  const flush = () => {
    // Folding a single line saves nothing; show it instead.
    if (hidden.length === 1) rows.push(hidden[0]!);
    else if (hidden.length > 1) rows.push({ type: "gap", lines: hidden });
    hidden = [];
  };
  lines.forEach((line, i) => {
    if (keep[i]) {
      flush();
      rows.push(line);
    } else {
      hidden.push(line);
    }
  });
  flush();
  return rows;
}
