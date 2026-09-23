import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdCardForm } from "./id-card-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("IdCardForm", () => {
  it("uses the shared control style and visible labels for every field", () => {
    render(
      <IdCardForm
        people={[
          {
            userId: "student-1",
            role: "student",
            name: "Ravi Kumar",
            code: "PSC-STU-0001",
          },
        ]}
      />,
    );

    for (const label of ["Student or tutor", "Issue date", "Expiry date"]) {
      expect(screen.getByLabelText(label)).toHaveClass("input");
    }
  });
});
