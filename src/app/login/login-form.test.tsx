import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks,
  useSearchParams: () => ({ get: () => null }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { role: "admin" } }),
      }),
    );
  });

  it("submits the custom remember-me checkbox state", async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Remember me on this browser" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in securely" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      rememberMe: true,
    });
  });
});
