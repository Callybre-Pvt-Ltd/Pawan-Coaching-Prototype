import { describe, expect, it } from "vitest";
import { dayDifference, indiaDate } from "./dates";

describe("attendance date rules", () => {
  it("presents instants in Asia/Kolkata", () => {
    expect(indiaDate(new Date("2026-09-21T20:00:00Z"))).toBe("2026-09-22");
  });

  it("counts calendar days for the tutor backdate window", () => {
    expect(dayDifference("2026-09-15", "2026-09-22")).toBe(7);
    expect(dayDifference("2026-09-23", "2026-09-22")).toBe(-1);
  });
});
