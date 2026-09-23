import { describe, expect, it } from "vitest";
import { dayDifference, indiaDate, isValidIsoDate } from "./dates";

describe("attendance date rules", () => {
  it("presents instants in Asia/Kolkata", () => {
    expect(indiaDate(new Date("2026-09-21T20:00:00Z"))).toBe("2026-09-22");
  });

  it("counts calendar days for the tutor backdate window", () => {
    expect(dayDifference("2026-09-15", "2026-09-22")).toBe(7);
    expect(dayDifference("2026-09-23", "2026-09-22")).toBe(-1);
  });

  it("accepts calendar dates and rejects impossible dates", () => {
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2027-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
  });
});
