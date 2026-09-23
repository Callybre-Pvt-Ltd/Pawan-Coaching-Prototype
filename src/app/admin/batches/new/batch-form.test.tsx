import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BatchForm } from "./batch-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const tutors = [{ id: "tutor-1", name: "Asha Sharma", code: "PSC-TUT-0001" }];

describe("BatchForm", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it("uses the shared control style for batch and schedule fields", () => {
    render(<BatchForm tutors={tutors} />);

    for (const label of [
      "Batch name",
      "Subject",
      "Start date",
      "End date (optional)",
      "Warning capacity (optional)",
      "Day",
      "Starts",
      "Ends",
    ]) {
      expect(screen.getByLabelText(label)).toHaveClass("input");
    }
    expect(screen.getByLabelText("Day").closest(".slot-fields")).not.toBeNull();
  });

  it("reveals capacity guidance and supports adding and removing slots", () => {
    render(<BatchForm tutors={tutors} />);

    fireEvent.click(
      screen.getByRole("button", { name: "What is warning capacity?" }),
    );
    expect(document.getElementById("capacity-help")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Add slot" }));
    expect(screen.getByText("Slot 2")).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove slot" })[1]);
    expect(screen.queryByText("Slot 2")).not.toBeInTheDocument();
  });

  it("selects and deselects tutors through the custom checkbox card", () => {
    render(<BatchForm tutors={tutors} />);

    const tutor = screen.getByRole("checkbox", { name: /Asha Sharma/i });
    expect(tutor).not.toBeChecked();
    fireEvent.click(tutor);
    expect(tutor).toBeChecked();
    fireEvent.click(tutor);
    expect(tutor).not.toBeChecked();
  });
});
