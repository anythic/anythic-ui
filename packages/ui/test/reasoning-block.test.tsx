import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReasoningBlock } from "../src";

const toggle = () => screen.getByRole("button");

describe("ReasoningBlock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is open and says it is thinking while streaming", () => {
    render(<ReasoningBlock text="Let me check" streaming />);
    expect(toggle()).toHaveTextContent("Thinking…");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Let me check")).toBeVisible();
  });

  it("collapses and reports the duration when thinking ends", () => {
    const { rerender } = render(<ReasoningBlock text="Hmm" streaming />);
    act(() => vi.advanceTimersByTime(4200));
    rerender(<ReasoningBlock text="Hmm" streaming={false} />);

    expect(toggle()).toHaveTextContent("Thought for 4s");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Hmm")).not.toBeVisible();
  });

  it("stays open if the user toggled it while thinking", () => {
    const { rerender } = render(<ReasoningBlock text="Hmm" streaming />);
    fireEvent.click(toggle()); // close
    fireEvent.click(toggle()); // reopen
    rerender(<ReasoningBlock text="Hmm" streaming={false} />);
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("starts collapsed for a finished block from history", () => {
    render(<ReasoningBlock text="Old thoughts" duration={12} />);
    expect(toggle()).toHaveTextContent("Thought for 12s");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle());
    expect(screen.getByText("Old thoughts")).toBeVisible();
  });

  it("supports controlled open state", () => {
    const onOpenChange = vi.fn();
    render(<ReasoningBlock text="x" open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(toggle());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("accepts a custom label", () => {
    const { rerender } = render(
      <ReasoningBlock
        text="x"
        streaming
        label={({ streaming, duration }) =>
          streaming ? "O'ylanmoqda…" : `${duration} soniya o'yladi`
        }
      />,
    );
    expect(toggle()).toHaveTextContent("O'ylanmoqda…");
    act(() => vi.advanceTimersByTime(3000));
    rerender(
      <ReasoningBlock
        text="x"
        label={({ streaming, duration }) =>
          streaming ? "O'ylanmoqda…" : `${duration} soniya o'yladi`
        }
      />,
    );
    expect(toggle()).toHaveTextContent("3 soniya o'yladi");
  });
});
