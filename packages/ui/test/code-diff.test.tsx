import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeDiff } from "../src";

const OLD = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
const NEW = OLD.replace("line 15", "line fifteen").replace("line 30", "line 30\nline 31");

const rowsOf = (container: HTMLElement, type: string) =>
  container.querySelectorAll(`[data-type="${type}"]`);

describe("CodeDiff", () => {
  it("shows the file, stats, and changed lines with screen-reader labels", () => {
    const { container } = render(<CodeDiff filename="src/app.ts" oldCode={OLD} newCode={NEW} />);
    const toggle = screen.getByRole("button", { name: /src\/app\.ts/ });
    expect(toggle).toHaveTextContent("+2");
    expect(toggle).toHaveTextContent("−1");
    expect(rowsOf(container, "remove")).toHaveLength(1);
    expect(rowsOf(container, "add")).toHaveLength(2);
    expect(screen.getByText("line fifteen").parentElement).toHaveTextContent("Added: line fifteen");
  });

  it("folds long unchanged runs and expands them on click", () => {
    const { container } = render(<CodeDiff oldCode={OLD} newCode={NEW} />);
    const before = rowsOf(container, "context").length;
    fireEvent.click(screen.getByRole("button", { name: "11 unchanged lines" }));
    expect(rowsOf(container, "context").length).toBe(before + 11);
    expect(screen.queryByRole("button", { name: "11 unchanged lines" })).not.toBeInTheDocument();
  });

  it("renders a unified patch, marking omitted regions", () => {
    const patch = "--- a/x.ts\n+++ b/x.ts\n@@ -5,2 +5,2 @@\n keep\n-old\n+new\n";
    const { container } = render(<CodeDiff filename="x.ts" patch={patch} />);
    expect(screen.getByText("Unchanged lines omitted", { exact: false })).toBeInTheDocument();
    expect(rowsOf(container, "context")[0]).toHaveTextContent("55keep");
  });

  it("collapses the body", () => {
    render(<CodeDiff filename="a.ts" oldCode="a" newCode="b" />);
    fireEvent.click(screen.getByRole("button", { name: /a\.ts/ }));
    expect(screen.getByText("b")).not.toBeVisible();
  });

  it("offers accept and reject while pending, then shows the outcome", async () => {
    let resolve!: () => void;
    const onAccept = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const onReject = vi.fn();
    const { rerender } = render(
      <CodeDiff oldCode="a" newCode="b" status="pending" onAccept={onAccept} onReject={onReject} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    await act(async () => resolve());

    rerender(<CodeDiff oldCode="a" newCode="b" status="accepted" onAccept={onAccept} />);
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  it("accepts translated labels", () => {
    render(
      <CodeDiff
        oldCode={OLD}
        newCode={NEW}
        status="pending"
        onAccept={() => {}}
        labels={{ accept: "Qabul qilish", unchanged: (n) => `${n} ta o'zgarmagan qator` }}
      />,
    );
    expect(screen.getByRole("button", { name: "Qabul qilish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11 ta o'zgarmagan qator" })).toBeInTheDocument();
  });
});
