import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("keeps native checkbox behavior and form submission", () => {
    render(
      <form>
        <Checkbox name="rememberMe">Remember me</Checkbox>
      </form>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
    fireEvent.click(screen.getByText("Remember me"));
    expect(checkbox).toBeChecked();
    const form = checkbox.closest("form");
    expect(form).not.toBeNull();
    if (!form) throw new Error("Checkbox form is missing.");
    expect(new FormData(form).get("rememberMe")).toBe("on");
  });

  it("forwards the disabled state", () => {
    render(<Checkbox disabled>Unavailable</Checkbox>);
    expect(
      screen.getByRole("checkbox", { name: "Unavailable" }),
    ).toBeDisabled();
  });
});
