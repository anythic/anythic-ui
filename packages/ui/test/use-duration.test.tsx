import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDuration } from "../src/hooks/use-duration";

describe("useDuration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("measures from turning on to turning off, and resets on the next run", () => {
    const { result, rerender } = renderHook(({ active }) => useDuration(active), {
      initialProps: { active: false },
    });
    expect(result.current).toBeUndefined();

    rerender({ active: true });
    act(() => vi.advanceTimersByTime(1500));
    rerender({ active: false });
    expect(result.current).toBe(1500);

    rerender({ active: true });
    expect(result.current).toBeUndefined();
    act(() => vi.advanceTimersByTime(300));
    rerender({ active: false });
    expect(result.current).toBe(300);
  });

  it("starts the clock at mount when mounted while active", () => {
    const { result, rerender } = renderHook(({ active }) => useDuration(active), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(700));
    rerender({ active: false });
    expect(result.current).toBe(700);
  });
});
