import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock, Markdown } from "../src";

describe("Markdown", () => {
  it("renders GitHub-flavoured markdown", () => {
    render(
      <Markdown>
        {"# Title\n\n- **bold** item\n- ~~gone~~\n\n| a | b |\n| - | - |\n| 1 | 2 |"}
      </Markdown>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("gone").tagName).toBe("DEL");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("does not render raw HTML or unsafe links", () => {
    const { container } = render(
      <Markdown>{'<img src=x onerror="alert(1)">\n\n[click](javascript:alert(1))'}</Markdown>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("click")).not.toHaveAttribute("href", expect.stringContaining("javascript"));
  });

  it("opens links in a new tab without leaking the opener", () => {
    render(<Markdown>{"[docs](https://example.com)"}</Markdown>);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("closes cut-off syntax only while streaming", () => {
    const { rerender } = render(<Markdown streaming>{"Hello **wor"}</Markdown>);
    expect(screen.getByText("wor").tagName).toBe("STRONG");

    rerender(<Markdown>{"Hello **wor"}</Markdown>);
    expect(screen.getByText("Hello **wor")).toBeInTheDocument();
  });

  it("renders fenced code as a highlighted code block", async () => {
    const { container } = render(<Markdown>{"```ts\nconst a = 1;\n```"}</Markdown>);
    expect(screen.getByText("ts")).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector(".shiki")).not.toBeNull(), {
      timeout: 5000,
    });
    expect(container.querySelector(".shiki")).toHaveTextContent("const a = 1;");
  });

  it("lets callers override elements", () => {
    render(
      <Markdown components={{ h1: ({ children }) => <h1 data-custom>{children}</h1> }}>
        {"# Hi"}
      </Markdown>,
    );
    expect(screen.getByRole("heading", { name: "Hi" })).toHaveAttribute("data-custom");
  });
});

describe("CodeBlock", () => {
  it("shows plain code before highlighting finishes", () => {
    render(<CodeBlock code="print('hi')" language="python" />);
    expect(screen.getByText("print('hi')")).toBeInTheDocument();
  });

  it("falls back to plain text for unknown languages", async () => {
    const { container } = render(<CodeBlock code="??" language="not-a-language" />);
    await waitFor(() => expect(container.querySelector(".shiki")).not.toBeNull(), {
      timeout: 5000,
    });
    expect(container.querySelector(".shiki")).toHaveTextContent("??");
  });

  it("copies the code and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CodeBlock code="npm i @anythic/ui" labels={{ copy: "Nusxa", copied: "Nusxalandi" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Nusxa" }));
    expect(writeText).toHaveBeenCalledWith("npm i @anythic/ui");
    expect(await screen.findByRole("button", { name: "Nusxalandi" })).toBeInTheDocument();
  });
});
