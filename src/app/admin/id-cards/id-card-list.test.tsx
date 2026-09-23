import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdCardList } from "./id-card-list";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => {
    // biome-ignore lint/performance/noImgElement: A plain image is sufficient for this framework mock.
    return <img alt={alt} {...props} />;
  },
}));

const cards = [
  {
    id: "student-card",
    name: "Ravi Kumar",
    code: "PSC-STU-0001",
    role: "student" as const,
    issueDate: "2026-09-24",
    expiryDate: "2027-09-24",
    inactive: false,
    expired: false,
  },
  {
    id: "tutor-card",
    name: "Neha Sharma",
    code: "PSC-TUT-0001",
    role: "tutor" as const,
    issueDate: "2025-09-24",
    expiryDate: "2026-09-23",
    inactive: false,
    expired: true,
  },
  {
    id: "inactive-card",
    name: "Aman Singh",
    code: "PSC-STU-0002",
    role: "student" as const,
    issueDate: "2025-09-24",
    expiryDate: "2026-09-23",
    inactive: true,
    expired: true,
  },
];

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(() => cleanup());

function openCard(index = 0) {
  const button = screen.getAllByRole("button", { name: "View card" })[index];
  fireEvent.click(button);
  return {
    button,
    dialog: screen.getByRole("dialog", { name: "ID card preview" }),
  };
}

describe("IdCardList", () => {
  it("opens a selected student card and restores focus after closing", () => {
    render(<IdCardList cards={cards} />);

    const { button, dialog } = openCard();
    expect(within(dialog).getByText("Ravi Kumar")).toBeVisible();
    expect(within(dialog).getByText("PSC-STU-0001")).toBeVisible();
    expect(within(dialog).getByText("student")).toBeVisible();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close ID card preview" }),
    );

    expect(dialog).not.toHaveAttribute("open");
    expect(button).toHaveFocus();
  });

  it("closes through Escape and backdrop clicks", () => {
    render(<IdCardList cards={cards} />);

    let { dialog } = openCard();
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(dialog).not.toHaveAttribute("open");

    ({ dialog } = openCard());
    fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute("open");
  });

  it("previews tutor cards and prioritizes inactive over expired status", () => {
    render(<IdCardList cards={cards} />);

    let { dialog } = openCard(1);
    expect(within(dialog).getByText("Neha Sharma")).toBeVisible();
    expect(within(dialog).getByText("tutor")).toBeVisible();
    expect(within(dialog).getByText("Expired")).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close ID card preview" }),
    );

    ({ dialog } = openCard(2));
    expect(within(dialog).getByText("Inactive")).toBeVisible();
    expect(within(dialog).queryByText("Expired")).toBeNull();
  });
});
