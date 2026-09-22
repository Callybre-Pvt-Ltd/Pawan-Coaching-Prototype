import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

const animationFrames: FrameRequestCallback[] = [];

beforeEach(() => {
  animationFrames.length = 0;
  document.documentElement.classList.remove("dark");
  localStorage.clear();
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    }),
  );
});

afterEach(() => {
  cleanup();
  document.head
    .querySelectorAll("style[data-theme-transition-override]")
    .forEach((style) => {
      style.remove();
    });
  vi.unstubAllGlobals();
});

describe("ThemeToggle", () => {
  it("persists the new theme without animating the page-wide transition", () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("psc-theme")).toBe("dark");
    expect(
      document.head.querySelector("style[data-theme-transition-override]"),
    ).toHaveTextContent("transition:none !important");

    act(() => animationFrames.shift()?.(0));
    expect(
      document.head.querySelector("style[data-theme-transition-override]"),
    ).toBeInTheDocument();

    act(() => animationFrames.shift()?.(0));
    expect(
      document.head.querySelector("style[data-theme-transition-override]"),
    ).not.toBeInTheDocument();
  });
});
