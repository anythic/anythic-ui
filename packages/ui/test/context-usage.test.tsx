import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextUsage } from "../src";

describe("ContextUsage", () => {
  it("is a meter with a readable value", () => {
    render(<ContextUsage used={45_200} limit={200_000} locale="en-US" />);
    const meter = screen.getByRole("meter", { name: "Context window" });
    expect(meter).toHaveAttribute("aria-valuenow", "45200");
    expect(meter).toHaveAttribute("aria-valuemax", "200000");
    expect(meter).toHaveAttribute("aria-valuetext", "45.2K of 200K tokens, 23%");
    expect(meter).toHaveTextContent("23%");
    expect(meter).toHaveAttribute("tabindex", "0");
    expect(meter).toHaveAccessibleDescription(/45\.2K of 200K tokens/);
  });

  it("warns, then signals danger, as the window fills", () => {
    const { rerender } = render(<ContextUsage used={100} limit={1000} />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "normal");
    rerender(<ContextUsage used={850} limit={1000} />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "warning");
    rerender(<ContextUsage used={990} limit={1000} />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "danger");
    rerender(<ContextUsage used={990} limit={1000} dangerAt={1} warnAt={0.5} />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "warning");
  });

  it("caps at 100% and tolerates a zero limit", () => {
    const { rerender } = render(<ContextUsage used={250_000} limit={200_000} />);
    expect(screen.getByRole("meter")).toHaveTextContent("100%");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "200000");
    rerender(<ContextUsage used={10} limit={0} />);
    expect(screen.getByRole("meter")).toHaveTextContent("0%");
  });

  it("lists the given breakdown and cost, small costs with more precision", () => {
    render(
      <ContextUsage
        used={60_000}
        limit={200_000}
        breakdown={{ input: 52_000, output: 6_500, cachedInput: 40_000 }}
        cost={0.0342}
        locale="en-US"
      />,
    );
    const details = screen.getByRole("tooltip", { hidden: true });
    expect(details).toHaveTextContent("Input52K");
    expect(details).toHaveTextContent("Cached input40K");
    expect(details).toHaveTextContent("Output6.5K");
    expect(details).not.toHaveTextContent("Reasoning");
    expect(details).toHaveTextContent("Cost$0.0342");
  });

  it("translates", () => {
    render(
      <ContextUsage
        used={1000}
        limit={4000}
        locale="en-US"
        labels={{ title: "Kontekst oynasi", summary: (u, l) => `${l} tokendan ${u} tasi` }}
      />,
    );
    expect(screen.getByRole("meter", { name: "Kontekst oynasi" })).toHaveAttribute(
      "aria-valuetext",
      "4K tokendan 1K tasi, 25%",
    );
  });
});
