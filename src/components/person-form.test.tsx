import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonForm } from "./person-form";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ ...mocks, back: vi.fn() }),
}));

describe("PersonForm tutor subjects", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });
  afterEach(() => cleanup());

  it("adds removable subject chips and sends them when creating a tutor", async () => {
    render(<PersonForm kind="tutor" />);
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Asha Sharma" },
    });
    fireEvent.change(screen.getByLabelText("Date of birth"), {
      target: { value: "1990-01-02" },
    });
    fireEvent.change(screen.getByLabelText("Login email"), {
      target: { value: "asha@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Initial password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Mathematics" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add subject" }));
    expect(
      screen.getByRole("button", { name: "Remove Mathematics" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Create tutor" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toMatchObject({
      subjects: ["Mathematics"],
    });
  });

  it("prefills the admin editor and submits a PATCH", async () => {
    render(
      <PersonForm
        kind="tutor"
        tutor={{
          id: "tutor-id",
          name: "Asha Sharma",
          email: "asha@example.com",
          dob: "1990-01-02",
          contactPhone: "+919876543210",
          subjects: ["Mathematics"],
        }}
      />,
    );
    expect(screen.getByDisplayValue("Asha Sharma")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove Mathematics" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Save tutor" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/tutors/tutor-id");
    expect(options?.method).toBe("PATCH");
  });
});
