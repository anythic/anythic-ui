import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PromptInput } from "../src";

const box = () => screen.getByRole("textbox");
const type = (text: string) => fireEvent.change(box(), { target: { value: text } });

describe("PromptInput", () => {
  it("sends trimmed text on Enter and clears", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    type("  hello  ");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("hello");
    expect(box()).toHaveValue("");
  });

  it("does not send on Shift+Enter or while composing with an IME", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    type("hi");
    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    fireEvent.keyDown(box(), { key: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables sending empty or whitespace-only text", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    type("   ");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sends with the button", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    type("hi");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith("hi");
  });

  it("shows a stop button while streaming and does not send", () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    render(<PromptInput onSubmit={onSubmit} streaming onStop={onStop} />);
    type("next question");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(box()).toHaveValue("next question");

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("restores the text when an async submit fails", async () => {
    const failure = new Error("offline");
    let reject!: (error: Error) => void;
    const onSubmit = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<PromptInput onSubmit={onSubmit} />);
    type("important message");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(box()).toHaveValue("");

    const unhandled = new Promise((r) => process.once("unhandledRejection", r));
    await act(async () => reject(failure));
    expect(await unhandled).toBe(failure);
    expect(box()).toHaveValue("important message");
  });

  it("works controlled", () => {
    const onSubmit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("draft");
      return (
        <PromptInput
          value={value}
          onValueChange={setValue}
          onSubmit={(text) => {
            onSubmit(text);
            setValue("");
          }}
        />
      );
    }
    render(<Controlled />);
    expect(box()).toHaveValue("draft");
    type("draft 2");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("draft 2");
    expect(box()).toHaveValue("");
  });

  it("lets a custom onKeyDown take over Enter", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} onKeyDown={(e) => e.preventDefault()} />);
    type("hi");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts translated labels and extra actions", () => {
    render(
      <PromptInput
        onSubmit={() => {}}
        labels={{ placeholder: "Xabar yozing…", send: "Yuborish" }}
        actions={<button type="button">Attach</button>}
      />,
    );
    expect(screen.getByPlaceholderText("Xabar yozing…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yuborish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attach" })).toBeInTheDocument();
  });
});
