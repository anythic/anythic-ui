import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolCall } from "../src";

describe("ToolCall", () => {
  it("shows the name and an accessible status", () => {
    render(<ToolCall name="web_search" status="running" input={{ q: "x" }} />);
    const header = screen.getByRole("button");
    expect(header).toHaveTextContent("Running:");
    expect(header).toHaveTextContent("web_search");
  });

  it("prefers a friendly title and keeps the raw name alongside", () => {
    render(<ToolCall name="web_search" title="Searching the web" status="pending" />);
    expect(screen.getByText("Searching the web")).toBeInTheDocument();
    expect(screen.getByText("web_search")).toBeInTheDocument();
  });

  it("reveals input as JSON and string output as-is when opened", () => {
    render(
      <ToolCall
        name="web_search"
        status="success"
        input={{ query: "weather" }}
        output="Sunny, 24°C"
      />,
    );
    const header = screen.getByRole("button");
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Sunny, 24°C")).not.toBeVisible();

    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Sunny, 24°C")).toBeVisible();
    expect(screen.getByText(/"query": "weather"/)).toBeVisible();
  });

  it("shows the error instead of the output when it failed", () => {
    render(
      <ToolCall
        name="read_file"
        status="error"
        output="stale"
        error="ENOENT: no such file"
        defaultOpen
      />,
    );
    expect(screen.getByText("ENOENT: no such file")).toBeVisible();
    expect(screen.queryByText("stale")).not.toBeInTheDocument();
  });

  it("is not expandable when there is nothing to show", () => {
    render(<ToolCall name="ping" status="pending" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("ping")).toBeInTheDocument();
  });

  it("does not throw on values JSON cannot serialise", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    render(<ToolCall name="x" status="success" output={circular} defaultOpen />);
    expect(screen.getByText("[object Object]")).toBeVisible();
  });

  it("supports controlled open state and translated status labels", () => {
    const onOpenChange = vi.fn();
    render(
      <ToolCall
        name="x"
        status="success"
        output="ok"
        open={false}
        onOpenChange={onOpenChange}
        statusLabels={{ success: "Bajarildi" }}
      />,
    );
    const header = screen.getByRole("button");
    expect(header).toHaveTextContent("Bajarildi:");
    fireEvent.click(header);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });
});
