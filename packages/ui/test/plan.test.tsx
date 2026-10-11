import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Plan, type PlanTask } from "../src";

const TASKS: PlanTask[] = [
  { id: "read", title: "Read the failing test", status: "completed" },
  {
    id: "find",
    title: "Find the bug in auth.ts",
    status: "in_progress",
    description: "src/auth.ts",
  },
  { id: "fix", title: "Fix token refresh", status: "pending" },
  { id: "run", title: "Run the test suite", status: "failed", description: "2 tests failed" },
];

describe("Plan", () => {
  it("shows the title and progress, open by default", () => {
    render(<Plan title="Fix the login bug" tasks={TASKS} />);
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveTextContent("Fix the login bug");
    expect(toggle).toHaveTextContent("1 of 4 done");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("gives every task an accessible status and its description", () => {
    render(<Plan tasks={TASKS} />);
    const [read, find, fix, run] = screen.getAllByRole("listitem");
    expect(read).toHaveTextContent("Completed: Read the failing test");
    expect(find).toHaveTextContent("In progress: Find the bug in auth.ts");
    expect(find).toHaveTextContent("src/auth.ts");
    expect(fix).toHaveTextContent("Pending: Fix token refresh");
    expect(run).toHaveTextContent("Failed: Run the test suite");
    expect(run).toHaveAttribute("data-status", "failed");
  });

  it("collapses and supports controlled state", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Plan tasks={TASKS} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("list", { hidden: true })).not.toBeVisible();

    rerender(<Plan tasks={TASKS} open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("list")).toBeVisible();
  });

  it("renders nothing without tasks", () => {
    const { container } = render(<Plan tasks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("accepts translated labels", () => {
    render(
      <Plan
        tasks={TASKS}
        progressLabel={(done, total) => `${total} tadan ${done} tasi bajarildi`}
        statusLabels={{ completed: "Bajarildi" }}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("4 tadan 1 tasi bajarildi");
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "Bajarildi: Read the failing test",
    );
  });
});
