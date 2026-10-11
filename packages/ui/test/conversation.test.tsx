import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Conversation } from "../src";

let resize: () => void = () => {};
const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockClear();
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Fakes a 1000px-tall log in a 200px viewport, scrolled to `top`. */
function scrollLogTo(top: number) {
  const log = screen.getByRole("log");
  Object.defineProperty(log, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(log, "clientHeight", { value: 200, configurable: true });
  Object.defineProperty(log, "scrollTop", { value: top, configurable: true });
  fireEvent.scroll(log);
}

const jumpButton = () => screen.queryByRole("button", { name: "Scroll to bottom" });

describe("Conversation", () => {
  it("renders messages in a log and starts at the bottom", () => {
    render(<Conversation>hello</Conversation>);
    expect(screen.getByRole("log")).toHaveTextContent("hello");
    expect(scrollTo).toHaveBeenCalled();
    expect(jumpButton()).not.toBeInTheDocument();
  });

  it("follows growing content while at the bottom", () => {
    render(<Conversation>hello</Conversation>);
    scrollLogTo(800);
    scrollTo.mockClear();
    act(() => resize());
    expect(scrollTo).toHaveBeenCalledOnce();
  });

  it("stops following when the user scrolls up, even slightly", () => {
    render(<Conversation>hello</Conversation>);
    scrollLogTo(800);
    scrollLogTo(790);
    expect(jumpButton()).toBeInTheDocument();

    scrollTo.mockClear();
    act(() => resize());
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("follows again once the user scrolls back down", () => {
    render(<Conversation>hello</Conversation>);
    scrollLogTo(800);
    scrollLogTo(400);
    scrollLogTo(790);
    expect(jumpButton()).not.toBeInTheDocument();
  });

  it("jumps back down with the button", () => {
    render(<Conversation labels={{ scrollToBottom: "Pastga" }}>hello</Conversation>);
    scrollLogTo(800);
    scrollLogTo(300);
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Pastga" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: "smooth" });
    expect(screen.queryByRole("button", { name: "Pastga" })).not.toBeInTheDocument();

    // Positions passed through during the smooth scroll do not unstick it.
    scrollLogTo(500);
    expect(screen.queryByRole("button", { name: "Pastga" })).not.toBeInTheDocument();
  });
});

describe("Conversation when content shrinks", () => {
  it("stays stuck when the browser clamps scrollTop to the new bottom", () => {
    render(<Conversation>hello</Conversation>);
    scrollLogTo(800);
    const log = screen.getByRole("log");
    Object.defineProperty(log, "scrollHeight", { value: 900, configurable: true });
    Object.defineProperty(log, "scrollTop", { value: 700, configurable: true });
    fireEvent.scroll(log);
    expect(jumpButton()).not.toBeInTheDocument();
  });
});
