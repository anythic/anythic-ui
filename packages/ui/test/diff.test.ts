import { describe, expect, it } from "vitest";
import { diffLines, foldContext, parsePatch, splitLines } from "../src/lib/diff";

/** Length of the longest common subsequence: the most lines a diff can keep. */
function lcs(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] =
        a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
  return dp[a.length]![b.length]!;
}

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

describe("diffLines", () => {
  it("marks added, removed and unchanged lines with both line numbers", () => {
    expect(diffLines("a\nb\nc\n", "a\nB\nc\nd\n")).toEqual([
      { type: "context", oldNumber: 1, newNumber: 1, text: "a" },
      { type: "remove", oldNumber: 2, text: "b" },
      { type: "add", newNumber: 2, text: "B" },
      { type: "context", oldNumber: 3, newNumber: 3, text: "c" },
      { type: "add", newNumber: 4, text: "d" },
    ]);
  });

  it("handles empty sides", () => {
    expect(diffLines("", "x\n")).toEqual([{ type: "add", newNumber: 1, text: "x" }]);
    expect(diffLines("x", "")).toEqual([{ type: "remove", oldNumber: 1, text: "x" }]);
    expect(diffLines("", "")).toEqual([]);
  });

  it("rebuilds both texts and keeps as many lines as possible (fuzz)", () => {
    const random = seeded(42);
    for (let round = 0; round < 300; round++) {
      const pick = () =>
        Array.from({ length: Math.floor(random() * 12) }, () => "abcd"[Math.floor(random() * 4)]!);
      const a = pick();
      const b = pick();
      const lines = diffLines(a.join("\n"), b.join("\n"));
      expect(lines.filter((l) => l.type !== "add").map((l) => l.text)).toEqual(a);
      expect(lines.filter((l) => l.type !== "remove").map((l) => l.text)).toEqual(b);
      expect(lines.filter((l) => l.type === "context")).toHaveLength(lcs(a, b));
    }
  });
});

describe("parsePatch", () => {
  const patch = [
    "diff --git a/src/auth.ts b/src/auth.ts",
    "index 1a2b3c4..5d6e7f8 100644",
    "--- a/src/auth.ts",
    "+++ b/src/auth.ts",
    "@@ -10,3 +10,3 @@ export function refresh() {",
    "   const now = Date.now();",
    "-  if (token.expiresAt < now) {",
    "+  if (token.expiresAt <= now) {",
    "     return renew(token);",
    "@@ -40,2 +40,3 @@",
    " }",
    "+// end",
    "\\ No newline at end of file",
  ].join("\n");

  it("reads hunks with line numbers and marks skipped regions", () => {
    const rows = parsePatch(patch);
    expect(rows[0]).toEqual({ type: "gap" });
    expect(rows[1]).toEqual({
      type: "context",
      oldNumber: 10,
      newNumber: 10,
      text: "  const now = Date.now();",
    });
    expect(rows[2]).toMatchObject({ type: "remove", oldNumber: 11 });
    expect(rows[3]).toMatchObject({ type: "add", newNumber: 11 });
    expect(rows[5]).toEqual({ type: "gap" });
    expect(rows.at(-1)).toEqual({ type: "add", newNumber: 41, text: "// end" });
  });
});

describe("foldContext", () => {
  it("keeps context around changes and folds the rest into expandable gaps", () => {
    const old = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const changed = [...old];
    changed[9] = "changed";
    const rows = foldContext(diffLines(old.join("\n"), changed.join("\n")), 2);
    expect(rows[0]).toMatchObject({ type: "gap" });
    expect((rows[0] as { lines: unknown[] }).lines).toHaveLength(7);
    expect(rows.filter((r) => r.type !== "gap")).toHaveLength(6); // 2 + remove + add + 2
    expect(rows.at(-1)).toMatchObject({ type: "gap" });
  });

  it("does not fold a single line", () => {
    const rows = foldContext(diffLines("a\nb\nc\nd", "a\nb\nc\nD"), 2);
    expect(rows.some((r) => r.type === "gap")).toBe(false);
  });
});

describe("splitLines", () => {
  it("ignores one trailing newline", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\n\n")).toEqual(["a", ""]);
  });
});
