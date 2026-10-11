import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Message, MessageAction, MessageCopyButton } from "../src";

describe("Message", () => {
  it("marks who wrote it and renders any content", () => {
    const { container } = render(
      <>
        <Message from="user">Hi there</Message>
        <Message from="assistant">
          <p>Hello!</p>
        </Message>
      </>,
    );
    const [user, assistant] = container.querySelectorAll("[data-from]");
    expect(user).toHaveAttribute("data-from", "user");
    expect(user).toHaveTextContent("Hi there");
    expect(assistant).toHaveAttribute("data-from", "assistant");
    expect(screen.getByText("Hello!").tagName).toBe("P");
  });

  it("renders actions with accessible names", () => {
    const onRetry = vi.fn();
    render(
      <Message
        from="assistant"
        actions={
          <MessageAction label="Retry" onClick={onRetry}>
            ↻
          </MessageAction>
        }
      >
        Answer
      </Message>,
    );
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry).toHaveAttribute("title", "Retry");
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("copies text and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<MessageCopyButton text="**hi**" labels={{ copy: "Nusxa", copied: "Nusxalandi" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Nusxa" }));
    expect(writeText).toHaveBeenCalledWith("**hi**");
    expect(await screen.findByRole("button", { name: "Nusxalandi" })).toBeInTheDocument();
  });
});
