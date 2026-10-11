import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown, Sources, type Source } from "../src";

const SOURCES: Source[] = [
  {
    url: "https://www.example.com/rayleigh",
    title: "Rayleigh scattering",
    snippet: "Short wavelengths scatter more.",
  },
  { url: "https://science.example.org/sky", title: "Why the sky is blue" },
];

describe("Markdown citations", () => {
  it("turns [n] into a citation that links to the source and describes it", () => {
    render(<Markdown sources={SOURCES}>{"Blue light scatters more [1]."}</Markdown>);
    const link = screen.getByRole("link", { name: "1" });
    expect(link).toHaveAttribute("href", "https://www.example.com/rayleigh");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleDescription(/example\.com.*Rayleigh scattering/);
  });

  it("splits a list like [1, 2] into one citation each", () => {
    render(<Markdown sources={SOURCES}>{"Both agree [1, 2]."}</Markdown>);
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2" })).toBeInTheDocument();
  });

  it("leaves numbers without a source, code, and link text alone", () => {
    render(
      <Markdown sources={SOURCES}>
        {"See [7], `arr[1]` and [docs [1]](https://example.com/docs)."}
      </Markdown>,
    );
    expect(screen.getByText(/See \[7\]/)).toBeInTheDocument();
    expect(screen.getByText("arr[1]").tagName).toBe("CODE");
    expect(screen.getByRole("link", { name: "docs [1]" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "1" })).not.toBeInTheDocument();
  });

  it("does not touch [n] when no sources are given", () => {
    render(<Markdown>{"Plain [1] text"}</Markdown>);
    expect(screen.getByText("Plain [1] text")).toBeInTheDocument();
  });

  it("never links a source with an unsafe URL", () => {
    render(
      <Markdown sources={[{ url: "javascript:alert(1)", title: "Bad" }]}>{"Hm [1]"}</Markdown>,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("1")).toHaveAccessibleDescription(/Bad/);
  });

  it("holds back a citation that is still arriving", () => {
    const { rerender } = render(
      <Markdown sources={SOURCES} streaming>
        {"Blue light [1"}
      </Markdown>,
    );
    expect(screen.queryByText(/\[1/)).not.toBeInTheDocument();
    rerender(
      <Markdown sources={SOURCES} streaming>
        {"Blue light [1]"}
      </Markdown>,
    );
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
  });
});

describe("Sources", () => {
  it("lists numbered sources behind a toggle", () => {
    render(<Sources sources={SOURCES} />);
    const toggle = screen.getByRole("button", { name: "2 sources" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("link", { name: "Rayleigh scattering", hidden: true }),
    ).not.toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const first = screen.getByRole("link", { name: "Rayleigh scattering" });
    expect(first).toBeVisible();
    expect(first).toHaveAttribute("href", "https://www.example.com/rayleigh");
    expect(screen.getByText("science.example.org")).toBeInTheDocument();
  });

  it("falls back to the site name and does not link unsafe URLs", () => {
    render(
      <Sources
        defaultOpen
        sources={[
          { url: "https://docs.example.com/a" },
          { url: "data:text/html,hi", title: "Inline" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "docs.example.com" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Inline" })).not.toBeInTheDocument();
    expect(screen.getByText("Inline")).toBeInTheDocument();
  });

  it("renders nothing without sources and accepts a custom label", () => {
    const { container, rerender } = render(<Sources sources={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Sources sources={SOURCES} label={(n) => `${n} ta manba`} />);
    expect(screen.getByRole("button", { name: "2 ta manba" })).toBeInTheDocument();
  });
});
