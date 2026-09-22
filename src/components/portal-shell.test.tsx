import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalShell } from "./portal-shell";

const mocks = vi.hoisted(() => ({
  pathname: "/admin",
  pending: false,
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: mocks.pending }),
}));

let desktopMedia: MediaQueryList;
let desktopListener: ((event: MediaQueryListEvent) => void) | undefined;

beforeEach(() => {
  mocks.pathname = "/admin";
  mocks.pending = false;
  mocks.replace.mockReset();
  mocks.refresh.mockReset();
  desktopListener = undefined;

  desktopMedia = {
    matches: false,
    media: "(min-width: 901px)",
    onchange: null,
    addEventListener: vi.fn((_, listener) => {
      desktopListener = listener as (event: MediaQueryListEvent) => void;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => desktopMedia),
  });
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

function renderShell(
  role: "admin" | "tutor" | "student",
  email = `${role}@example.com`,
) {
  return render(
    <PortalShell
      portalRole={role}
      email={email}
      expiresAt="2099-01-01T00:00:00.000Z"
    >
      <p>Page content</p>
    </PortalShell>,
  );
}

function openMore(role: "admin" | "tutor" | "student") {
  const mobileNav = screen.getByRole("navigation", {
    name: `${role} mobile navigation`,
  });
  const trigger = within(mobileNav).getByRole("button", { name: "More" });
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "More options" });
  return { dialog, mobileNav, trigger };
}

describe("PortalShell mobile navigation", () => {
  it("provides a skip link and main landmark", () => {
    renderShell("admin");

    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#portal-main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "portal-main");
  });

  it("keeps collapsed navigation labels available to assistive technology", () => {
    renderShell("admin");
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    const desktopNav = screen.getByRole("navigation", {
      name: "admin navigation",
    });
    expect(
      within(desktopNav).getByRole("link", { name: "Home" }),
    ).toHaveTextContent("Home");
    expect(within(desktopNav).getByText("Home")).toHaveClass("sr-only");
    expect(screen.getByRole("button", { name: "Sign out" })).toHaveTextContent(
      "Sign out",
    );
  });

  it("keeps active mobile destinations programmatically marked", () => {
    renderShell("admin");

    const mobileNav = screen.getByRole("navigation", {
      name: "admin mobile navigation",
    });
    expect(within(mobileNav).getByRole("link", { name: "Home" })).toHaveClass(
      "active",
    );
    expect(
      within(mobileNav).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("shows four primary Admin links and all remaining options in More", () => {
    renderShell("admin");
    const { dialog, mobileNav } = openMore("admin");

    expect(
      within(mobileNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Home", "Students", "Attendance", "Fees"]);
    expect(within(mobileNav).getAllByRole("button")).toHaveLength(1);

    const additionalNav = within(dialog).getByRole("navigation", {
      name: "admin additional navigation",
    });
    expect(
      within(additionalNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Tutors", "Batches", "ID cards", "Birthdays", "Settings"]);
    expect(within(dialog).queryByRole("link", { name: "Home" })).toBeNull();
    expect(within(dialog).getByText("admin@example.com")).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  it("puts Schedule and ID card in the Student More sheet", () => {
    mocks.pathname = "/student";
    renderShell("student");
    const { dialog, mobileNav } = openMore("student");

    expect(
      within(mobileNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Home", "Attendance", "Fees", "Profile"]);
    const additionalNav = within(dialog).getByRole("navigation", {
      name: "student additional navigation",
    });
    expect(
      within(additionalNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Schedule", "ID card"]);
  });

  it("keeps account actions in Tutor More when there are no overflow links", () => {
    mocks.pathname = "/tutor";
    renderShell("tutor", "teacher@example.com");
    const { dialog, mobileNav } = openMore("tutor");

    expect(within(mobileNav).getAllByRole("link")).toHaveLength(4);
    expect(
      within(dialog).queryByRole("navigation", {
        name: "tutor additional navigation",
      }),
    ).toBeNull();
    expect(within(dialog).getByText("teacher@example.com")).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  it("marks More and its nested destination active on an overflow route", () => {
    mocks.pathname = "/admin/settings/setup";
    renderShell("admin");
    const { dialog, trigger } = openMore("admin");

    expect(trigger).toHaveClass("active");
    expect(
      within(dialog).getByRole("link", { name: "Settings" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("closes by button, backdrop, Escape, and desktop viewport change", () => {
    renderShell("admin");
    let result = openMore("admin");
    expect(result.trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(
      within(result.dialog).getByRole("button", {
        name: "Close more options",
      }),
    );
    expect(result.dialog).not.toHaveAttribute("open");
    expect(result.trigger).toHaveAttribute("aria-expanded", "false");
    expect(result.trigger).toHaveFocus();

    result = openMore("admin");
    fireEvent.click(result.dialog);
    expect(result.dialog).not.toHaveAttribute("open");

    result = openMore("admin");
    fireEvent(result.dialog, new Event("cancel", { cancelable: true }));
    expect(result.dialog).not.toHaveAttribute("open");

    result = openMore("admin");
    Object.defineProperty(desktopMedia, "matches", { value: true });
    act(() => desktopListener?.({ matches: true } as MediaQueryListEvent));
    expect(result.dialog).not.toHaveAttribute("open");
  });

  it("keeps pending feedback visible until navigation commits, then closes", () => {
    mocks.pending = true;
    const view = renderShell("admin");
    const { dialog } = openMore("admin");
    expect(within(dialog).getAllByText("Loading").length).toBeGreaterThan(0);

    mocks.pending = false;
    mocks.pathname = "/admin/tutors";
    view.rerender(
      <PortalShell
        portalRole="admin"
        email="admin@example.com"
        expiresAt="2099-01-01T00:00:00.000Z"
      >
        <p>Page content</p>
      </PortalShell>,
    );
    expect(dialog).not.toHaveAttribute("open");
  });
});
