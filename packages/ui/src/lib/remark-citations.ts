// Just enough of the mdast shape for this plugin, to avoid a types dependency.
interface Node {
  type: string;
  value?: string;
  children?: Node[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

/** `[1]`, or a list like `[1, 3]`. */
const CITATION = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/**
 * Turns `[n]` markers in prose into citation nodes for sources that exist
 * (1 to `count`), rendered as `<sup data-citation="n">`. Code, and text
 * inside links, is left alone; so are numbers with no matching source.
 */
export function remarkCitations(count: number) {
  return () => (tree: Node) => visit(tree, count);
}

function visit(node: Node, count: number): void {
  if (!node.children || node.type === "link" || node.type === "linkReference") return;
  node.children = node.children.flatMap((child) =>
    child.type === "text" && child.value
      ? split(child.value, count)
      : (visit(child, count), [child]),
  );
}

function split(text: string, count: number): Node[] {
  const nodes: Node[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    const numbers = match[1]!.split(",").map((n) => Number(n.trim()));
    if (!numbers.every((n) => n >= 1 && n <= count)) continue;
    if (match.index > last) nodes.push({ type: "text", value: text.slice(last, match.index) });
    for (const n of numbers) {
      nodes.push({
        type: "citation",
        data: { hName: "sup", hProperties: { dataCitation: n } },
        children: [{ type: "text", value: String(n) }],
      });
    }
    last = match.index + match[0].length;
  }
  if (last === 0) return [{ type: "text", value: text }];
  if (last < text.length) nodes.push({ type: "text", value: text.slice(last) });
  return nodes;
}
