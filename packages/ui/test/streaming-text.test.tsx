import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreamingText } from "../src";

describe("StreamingText", () => {
  it("shows a cursor and marks itself busy while streaming", () => {
    const { container } = render(<StreamingText text="Thinking" streaming />);
    expect(screen.getByText("Thinking")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector('[data-slot="cursor"]')).not.toBeNull();
  });

  it("hides the cursor once the stream is done", () => {
    const { container } = render(<StreamingText text="Done" />);
    expect(screen.getByText("Done")).toHaveAttribute("aria-busy", "false");
    expect(container.querySelector('[data-slot="cursor"]')).toBeNull();
  });

  it("can hide the cursor while streaming", () => {
    const { container } = render(<StreamingText text="x" streaming cursor={false} />);
    expect(container.querySelector('[data-slot="cursor"]')).toBeNull();
  });

  it("merges a custom className over the defaults", () => {
    render(<StreamingText text="styled" className="whitespace-normal text-sm" />);
    const el = screen.getByText("styled");
    expect(el).toHaveClass("text-sm", "whitespace-normal");
    expect(el).not.toHaveClass("whitespace-pre-wrap");
  });
});
