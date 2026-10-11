import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Terminal } from "../src";

const ESC = "\x1b";

describe("Terminal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the command, colored output and a running state", () => {
    const { container } = render(
      <Terminal command="pnpm test" output={`${ESC}[32m✓${ESC}[0m auth.test.ts\n`} running />,
    );
    expect(screen.getByRole("button", { name: /pnpm test/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Running")).toBeInTheDocument();
    const check = screen.getByText("✓");
    expect(check).toHaveStyle({ color: "#0dbc79" });
    expect(container).not.toHaveTextContent("[32m");
  });

  it("reports the exit code and the measured duration when it finishes", () => {
    const { rerender } = render(<Terminal command="pnpm build" output="" running />);
    act(() => vi.advanceTimersByTime(2400));
    rerender(<Terminal command="pnpm build" output="done" exitCode={0} />);
    expect(screen.getByText("exit 0")).toBeInTheDocument();
    expect(screen.getByText("2.4s")).toBeInTheDocument();

    rerender(<Terminal command="pnpm build" output="boom" exitCode={1} duration={65_000} />);
    expect(screen.getByText("exit 1")).toHaveClass("text-destructive");
    expect(screen.getByText("1m 5s")).toBeInTheDocument();
  });

  it("only renders the last maxLines lines", () => {
    const output = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join("\n");
    render(<Terminal output={output} maxLines={10} />);
    expect(screen.getByText("… 40 earlier lines not shown")).toBeInTheDocument();
    expect(screen.queryByText("line 40")).not.toBeInTheDocument();
    expect(screen.getByText("line 41")).toBeInTheDocument();
  });

  it("copies the output without escape codes", async () => {
    vi.useRealTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Terminal output={`${ESC}[31merror${ESC}[0m\n50%\r100%`} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy output" }));
    expect(writeText).toHaveBeenCalledWith("error\n100%");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("collapses and translates", () => {
    render(
      <Terminal
        command="ls"
        output="a"
        exitCode={2}
        labels={{ exitCode: (code) => `chiqish kodi ${code}` }}
      />,
    );
    expect(screen.getByText("chiqish kodi 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ls/ }));
    expect(screen.getByText("a")).not.toBeVisible();
  });
});
