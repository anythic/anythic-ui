import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolApproval } from "../src";

const button = (name: string) => screen.getByRole("button", { name });

describe("ToolApproval", () => {
  it("asks for a decision and shows what the agent wants to do", () => {
    render(
      <ToolApproval
        name="delete_file"
        title="Delete report.pdf"
        description="This cannot be undone."
        input={{ path: "/docs/report.pdf" }}
        status="pending"
      />,
    );
    expect(screen.getByRole("group", { name: /Delete report.pdf/ })).toBeInTheDocument();
    expect(screen.getByText("Approval needed")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByText(/"path": "\/docs\/report.pdf"/)).toBeInTheDocument();
    expect(button("Approve")).toBeEnabled();
    expect(button("Deny")).toBeEnabled();
  });

  it("calls the matching handler", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(
      <ToolApproval name="x" status="pending" onApprove={onApprove} onDeny={onDeny} />,
    );
    fireEvent.click(button("Deny"));
    expect(onDeny).toHaveBeenCalledOnce();
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("disables both buttons while an async handler runs", async () => {
    let resolve!: () => void;
    const onApprove = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<ToolApproval name="x" status="pending" onApprove={onApprove} />);

    fireEvent.click(button("Approve"));
    expect(button("Approve")).toBeDisabled();
    expect(button("Approve")).toHaveAttribute("aria-busy", "true");
    expect(button("Deny")).toBeDisabled();

    fireEvent.click(button("Approve"));
    expect(onApprove).toHaveBeenCalledOnce();

    await act(async () => resolve());
    expect(button("Approve")).toBeEnabled();
  });

  it("re-enables the buttons when an async handler fails", async () => {
    const failure = new Error("network");
    let reject!: (error: Error) => void;
    const onDeny = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<ToolApproval name="x" status="pending" onDeny={onDeny} />);

    fireEvent.click(button("Deny"));
    expect(button("Deny")).toBeDisabled();

    const unhandled = new Promise((r) => process.once("unhandledRejection", r));
    await act(async () => reject(failure));
    expect(await unhandled).toBe(failure);
    expect(button("Deny")).toBeEnabled();
  });

  it("replaces the buttons with the outcome once decided", () => {
    const { rerender } = render(<ToolApproval name="x" status="approved" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText("Approval needed")).not.toBeInTheDocument();

    rerender(<ToolApproval name="x" status="denied" />);
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });

  it("accepts translated labels", () => {
    render(
      <ToolApproval
        name="x"
        status="pending"
        labels={{ heading: "Ruxsat kerak", approve: "Ruxsat berish", deny: "Rad etish" }}
      />,
    );
    expect(screen.getByText("Ruxsat kerak")).toBeInTheDocument();
    expect(button("Ruxsat berish")).toBeInTheDocument();
    expect(button("Rad etish")).toBeInTheDocument();
  });
});
